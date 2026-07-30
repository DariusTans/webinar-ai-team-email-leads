/* Smoke test สำหรับ api/register.js + api/seats.js โดยไม่ต้องมี Postgres จริง
   inject fake pool ผ่าน globalThis seam ใน lib/db.js (Symbol.for('webinar.pgPool'))

   รัน: node scripts/smoke-test.mjs */

process.env.DATABASE_URL = 'postgres://fake/fake';
process.env.LEADS_TABLE = 'webinar_leads';
process.env.SEATS_TOTAL = '100';
process.env.SEATS_BASELINE = '73';
delete process.env.RESEND_API_KEY;   // ให้ email เป็น no-op

const calls = [];
let failNext = false;

globalThis[Symbol.for('webinar.pgPool')] = {
  on() {},
  async query(sql, params) {
    calls.push({ sql, params });
    if (failNext) throw new Error('simulated DB failure');
    if (/count\(\*\)/i.test(sql)) return { rows: [{ n: 5 }] };
    if (/RETURNING id/i.test(sql)) return { rows: [{ id: 42 }] };
    return { rows: [] };
  }
};

const { default: register } = await import('../api/register.js');
const { default: seats } = await import('../api/seats.js');

function mockRes() {
  const res = { statusCode: null, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

const post = (body) => ({ method: 'POST', body, headers: { 'user-agent': 'smoke-test/1.0' } });

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

// ── 1. ลงทะเบียนสำเร็จ ──────────────────────────────────────
{
  calls.length = 0;
  const res = mockRes();
  await register(post({ email: '  Test@Example.COM ', name: ' สมชาย ใจดี ', ig: '@somchai', fb: 'https://facebook.com/somchai/', q: 'งานขาย', lang: 'en' }), res);

  console.log('\n[1] ลงทะเบียนสำเร็จ');
  check('ตอบ 200', res.statusCode === 200, `→ ${res.statusCode}`);
  check('ok: true', res.body?.ok === true);
  check('emailSent: false (ไม่มี RESEND_API_KEY)', res.body?.emailSent === false);
  check('seats = baseline 73 + 5 rows', res.body?.seats?.taken === 78, JSON.stringify(res.body?.seats));
  check('left = 22', res.body?.seats?.left === 22);

  const ins = calls.find((c) => /^INSERT/.test(c.sql));
  check('มี INSERT', Boolean(ins));
  check('normalize email เป็นตัวเล็ก + trim', ins?.params[0] === 'test@example.com', ins?.params[0]);
  check('trim ชื่อ', ins?.params[1] === 'สมชาย ใจดี', JSON.stringify(ins?.params[1]));
  check('ตัด @ จาก instagram', ins?.params[2] === 'somchai', ins?.params[2]);
  check('ตัด URL จาก facebook', ins?.params[3] === 'somchai', ins?.params[3]);
  check('lang = en', ins?.params[5] === 'en', ins?.params[5]);
  check('มี ON CONFLICT (lower(email))', /ON CONFLICT \(lower\(email\)\) DO UPDATE/.test(ins?.sql || ''));
  check('มี COALESCE กันล้างค่าเดิม', /COALESCE\(EXCLUDED/.test(ins?.sql || ''));
  check('มี updated_at = now()', /"updated_at" = now\(\)/.test(ins?.sql || ''));
  check('ไม่ UPDATE email_sent (อีเมลไม่ได้ส่ง)', !calls.some((c) => /SET "email_sent"/.test(c.sql)));
  check('SQL ใช้ placeholder ไม่ inline ค่า', !/(test@example|สมชาย)/.test(ins?.sql || ''));
  console.log(`  SQL: ${ins?.sql}`);
}

// ── 2. honeypot ─────────────────────────────────────────────
{
  calls.length = 0;
  const res = mockRes();
  await register(post({ email: 'bot@spam.com', name: 'Bot', company: 'Acme Corp' }), res);

  console.log('\n[2] honeypot');
  check('ตอบ 200 (ไม่บอกบอทว่าถูกจับ)', res.statusCode === 200);
  check('ไม่แตะ DB เลย', calls.length === 0, `→ ${calls.length} queries`);
}

// ── 3. validation ───────────────────────────────────────────
{
  console.log('\n[3] validation');
  for (const [label, body, expectKey] of [
    ['อีเมลผิดรูปแบบ', { email: 'not-an-email', name: 'A' }, 'email'],
    ['อีเมลไม่มีโดเมน', { email: 'a@b', name: 'A' }, 'email'],
    ['ไม่มีอีเมล', { name: 'A' }, 'email'],
    ['ไม่มีชื่อ', { email: 'a@b.com' }, 'name'],
    ['body ว่าง', {}, 'email']
  ]) {
    calls.length = 0;
    const res = mockRes();
    await register(post(body), res);
    check(`${label} → 400 + errors.${expectKey}`,
      res.statusCode === 400 && Boolean(res.body?.errors?.[expectKey]) && calls.length === 0,
      `→ ${res.statusCode} ${JSON.stringify(res.body?.errors)}`);
  }
}

// ── 4. method ไม่ถูกต้อง ────────────────────────────────────
{
  const res = mockRes();
  await register({ method: 'GET', headers: {} }, res);
  console.log('\n[4] GET /api/register');
  check('ตอบ 405 + Allow header', res.statusCode === 405 && res.headers.Allow === 'POST');
}

// ── 5. DB ล่ม → ต้องตอบ 500 ไม่แสร้งว่าสำเร็จ ────────────────
{
  failNext = true;
  const res = mockRes();
  await register(post({ email: 'x@y.com', name: 'X' }), res);
  failNext = false;

  console.log('\n[5] DB ล่ม (จุดที่ bug เดิมอยู่)');
  check('ตอบ 500 ไม่ใช่ 200', res.statusCode === 500, `→ ${res.statusCode}`);
  check('ok: false, error: db', res.body?.ok === false && res.body?.error === 'db', JSON.stringify(res.body));
}

// ── 6. GET /api/seats ───────────────────────────────────────
{
  const res = mockRes();
  await seats({ method: 'GET', headers: {} }, res);
  console.log('\n[6] GET /api/seats');
  check('ตอบ 200', res.statusCode === 200);
  check('taken = 78, total = 100, left = 22',
    res.body?.taken === 78 && res.body?.total === 100 && res.body?.left === 22, JSON.stringify(res.body));
  check('มี Cache-Control', /s-maxage=30/.test(res.headers['Cache-Control'] || ''));
}

// ── 7. seats fallback เมื่อ DB ล่ม ──────────────────────────
{
  failNext = true;
  const res = mockRes();
  await seats({ method: 'GET', headers: {} }, res);
  failNext = false;

  console.log('\n[7] /api/seats เมื่อ DB ล่ม');
  check('ยังตอบ 200 (หน้าเว็บต้องไม่พัง)', res.statusCode === 200, `→ ${res.statusCode}`);
  check('fallback: true + baseline 73', res.body?.fallback === true && res.body?.taken === 73, JSON.stringify(res.body));
}

// ── 8. ตัดข้อความยาวเกิน ────────────────────────────────────
{
  calls.length = 0;
  const res = mockRes();
  await register(post({ email: 'long@y.com', name: 'N'.repeat(500), q: 'Q'.repeat(5000) }), res);
  const ins = calls.find((c) => /^INSERT/.test(c.sql));

  console.log('\n[8] ข้อความยาวเกินลิมิต');
  check('ยังลงทะเบียนสำเร็จ (ไม่ปฏิเสธ)', res.statusCode === 200);
  check('ตัดชื่อเหลือ 120', ins?.params[1]?.length === 120, `→ ${ins?.params[1]?.length}`);
  check('ตัดคำตอบเหลือ 2000', ins?.params[4]?.length === 2000, `→ ${ins?.params[4]?.length}`);
}

// ── 9. schema guard ─────────────────────────────────────────
{
  console.log('\n[9] schema guard');
  const { ident } = await import('../lib/schema.js');
  let threw = false;
  try { ident('leads; DROP TABLE users--'); } catch { threw = true; }
  check('ident() ปฏิเสธ identifier แปลกปลอม', threw);
  check('ident() ผ่านชื่อปกติ', ident('webinar_leads') === '"webinar_leads"');
}

console.log(`\n${'─'.repeat(50)}\nผ่าน ${pass} / ล้มเหลว ${fail}`);
process.exit(fail ? 1 : 0);
