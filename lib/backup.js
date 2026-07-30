/* ไฟล์สำรอง lead แบบ JSON Lines (1 บรรทัด = 1 lead)

   ข้อจำกัดที่ต้องรู้:
   - ตอน dev เขียนลง data/leads.jsonl → เปิดดู/export CSV ได้จริง
   - บน Vercel filesystem เป็น read-only ยกเว้น /tmp และ /tmp หายทุก cold start
     → ไฟล์นี้บน production เป็นแค่ diagnostic ชั่วคราว ไม่ใช่ backup ที่พึ่งได้
   - source of truth บน production คือ Postgres + Vercel logs (console.log ด้านล่าง)

   ทุก error จาก fs เป็น best-effort: log แล้วไปต่อ ไม่ทำให้การลงทะเบียนล้ม */

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { maskEmail } from './validate.js';

const ON_VERCEL = Boolean(process.env.VERCEL);

export const BACKUP_FILE = ON_VERCEL
  ? '/tmp/leads.jsonl'
  : join(process.cwd(), 'data', 'leads.jsonl');

export async function appendLead(record) {
  // ชั้นสำรองที่พึ่งได้จริงบน production — Vercel เก็บ stdout ไว้ให้
  console.log('[lead]', JSON.stringify({ ...record, email: maskEmail(record.email) }));

  try {
    await mkdir(dirname(BACKUP_FILE), { recursive: true });
    await appendFile(BACKUP_FILE, JSON.stringify(record) + '\n', 'utf8');
    return true;
  } catch (err) {
    console.error('[backup] เขียนไฟล์สำรองไม่สำเร็จ:', err.message);
    return false;
  }
}
