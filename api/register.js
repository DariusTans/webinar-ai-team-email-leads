/* POST /api/register — เก็บ lead ลงไฟล์สำรอง + Postgres แล้วส่งอีเมลยืนยัน

   หลักการ: DB คือ source of truth
   - DB พัง → ตอบ 500 ให้ UI แสดง error จริง ห้ามแสร้งว่าสำเร็จ (lead จะหายเงียบ)
   - ไฟล์สำรอง / อีเมล พัง → ยังนับว่าสำเร็จ เพราะ lead อยู่ใน DB แล้ว */

import { query } from '../lib/db.js';
import { TABLE, SOURCE, COLS, CONFLICT_TARGET, ident } from '../lib/schema.js';
import { validate, maskEmail } from '../lib/validate.js';
import { appendLead } from '../lib/backup.js';
import { sendConfirmation } from '../lib/email.js';
import { getSeats, fallbackSeats } from '../lib/seats.js';

function parseBody(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;          // Vercel parse JSON ให้แล้ว
  try { return JSON.parse(raw); } catch { return {}; }
}

/** สร้าง INSERT ... ON CONFLICT DO UPDATE จาก COLS โดยข้ามคอลัมน์ที่เป็น null */
function buildInsert(lead, userAgent) {
  const values = {
    email: lead.email,
    name: lead.name,
    ig: lead.ig,
    fb: lead.fb,
    q: lead.q,
    lang: lead.lang,
    source: SOURCE,
    userAgent: userAgent || null
  };

  const cols = [];
  const params = [];
  for (const [key, value] of Object.entries(values)) {
    const col = COLS[key];
    if (!col) continue;                              // ตารางไม่มีคอลัมน์นี้ → ข้าม
    cols.push(ident(col));
    params.push(value);
  }

  const placeholders = params.map((_, i) => `$${i + 1}`);
  let sql = `INSERT INTO ${ident(TABLE)} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;

  if (CONFLICT_TARGET) {
    // ลงทะเบียนซ้ำด้วยอีเมลเดิม → อัปเดตข้อมูลล่าสุดทับ ไม่เกิด row ซ้ำ ไม่ error
    const sets = [`${ident(COLS.name)} = EXCLUDED.${ident(COLS.name)}`];
    for (const key of ['ig', 'fb', 'q', 'lang', 'userAgent']) {
      const col = COLS[key];
      // COALESCE — ถ้าครั้งนี้เว้นว่าง ให้เก็บค่าเดิมไว้ ไม่ล้างทิ้ง
      if (col) sets.push(`${ident(col)} = COALESCE(EXCLUDED.${ident(col)}, ${ident(TABLE)}.${ident(col)})`);
    }
    if (COLS.updatedAt) sets.push(`${ident(COLS.updatedAt)} = now()`);
    sql += ` ON CONFLICT (${CONFLICT_TARGET}) DO UPDATE SET ${sets.join(', ')}`;
  }

  return { sql: `${sql} RETURNING id`, params };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }

  const { ok, spam, errors, data } = validate(parseBody(req.body));

  // บอทติด honeypot — ตอบ 200 เงียบๆ อย่าให้รู้ว่าถูกจับได้
  if (spam) {
    console.warn('[register] honeypot ทำงาน — ไม่บันทึก');
    return res.status(200).json({ ok: true, emailSent: false });
  }

  if (!ok) return res.status(400).json({ ok: false, error: 'validation', errors });

  const userAgent = String(req.headers['user-agent'] || '').slice(0, 400);

  // ชั้นสำรอง (best-effort) — ทำก่อน DB เพื่อให้มีร่องรอยไว้แม้ DB ล่ม
  await appendLead({ ...data, userAgent, at: new Date().toISOString() });

  let leadId;
  try {
    const { sql, params } = buildInsert(data, userAgent);
    const { rows } = await query(sql, params);
    leadId = rows[0]?.id;
  } catch (err) {
    console.error(`[register] บันทึกลง DB ไม่สำเร็จ (${maskEmail(data.email)}):`, err.message);
    return res.status(500).json({ ok: false, error: 'db' });
  }

  // อีเมลเป็น best-effort — lead อยู่ใน DB แล้ว สำคัญกว่า
  const emailSent = await sendConfirmation({ to: data.email, name: data.name, lang: data.lang });

  if (emailSent && leadId && COLS.emailSent) {
    try {
      await query(`UPDATE ${ident(TABLE)} SET ${ident(COLS.emailSent)} = true WHERE id = $1`, [leadId]);
    } catch (err) {
      console.error('[register] อัปเดต email_sent ไม่สำเร็จ:', err.message);
    }
  }

  let seats;
  try { seats = await getSeats(); } catch { seats = fallbackSeats(); }

  return res.status(200).json({ ok: true, emailSent, seats });
}
