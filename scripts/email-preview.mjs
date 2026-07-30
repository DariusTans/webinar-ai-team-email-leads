/* พรีวิวอีเมลยืนยันเป็นไฟล์ HTML — ดูหน้าตาก่อนส่งจริง โดยไม่ต้องมี Resend API key

   รัน:  node scripts/email-preview.mjs           → เขียน data/email-preview-{th,en}.html
         node scripts/email-preview.mjs --check   → ตรวจเนื้อหาอย่างเดียว (ใช้ใน npm test) */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildEmail } from '../lib/email.js';

const CHECK_ONLY = process.argv.includes('--check');
const ZOOM = 'https://zoom.us/j/9999999999?pwd=example';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

for (const lang of ['th', 'en']) {
  console.log(`\n[${lang}] อีเมลยืนยัน`);
  const mail = buildEmail({ name: lang === 'th' ? 'สมชาย ใจดี' : 'John Doe', lang, zoomLink: ZOOM });

  check('มี subject', mail.subject.length > 10);
  check('มีทั้ง html และ text', mail.html.length > 500 && mail.text.length > 100);
  check('มีชื่อผู้รับใน html', mail.html.includes(lang === 'th' ? 'สมชาย ใจดี' : 'John Doe'));
  check('มีลิงก์ Zoom ใน html', mail.html.includes(ZOOM));
  check('มีลิงก์ Zoom ใน text', mail.text.includes(ZOOM));
  check('มีวันเวลาอีเวนต์', /2026/.test(mail.html) && /2026/.test(mail.text));
  check('html ปิด tag ครบ (สมดุล table)',
    (mail.html.match(/<table/g) || []).length === (mail.html.match(/<\/table>/g) || []).length);
  check('text ไม่มี HTML tag หลงเหลือ', !/<[a-z/]/i.test(mail.text), mail.text.match(/<[a-z/][^>]*>/i)?.[0]);
  check('ใช้ inline style ไม่มี <style> block', !/<style/i.test(mail.html));

  // ไม่มีลิงก์ Zoom → ต้องไม่โฆษณาปุ่ม Zoom
  const noZoom = buildEmail({ name: 'A', lang, zoomLink: '' });
  check('ไม่มี ZOOM_LINK → ไม่แสดงปุ่ม Zoom', !noZoom.html.includes(lang === 'th' ? 'เข้าร่วมผ่าน Zoom' : 'Join on Zoom'));
  check('ไม่มี ZOOM_LINK → บอกว่าจะส่งให้ทีหลัง',
    noZoom.html.includes(lang === 'th' ? 'ก่อนวันงาน' : 'before the event'));

  // escape — ชื่อที่มี HTML ต้องไม่หลุดเป็น markup
  const xss = buildEmail({ name: '<script>alert(1)</script>', lang, zoomLink: ZOOM });
  check('escape ชื่อผู้รับ (กัน HTML injection)', !xss.html.includes('<script>alert'), 'พบ <script> ที่ไม่ถูก escape');

  if (!CHECK_ONLY) {
    const dir = join(process.cwd(), 'data');
    await mkdir(dir, { recursive: true });
    const out = join(dir, `email-preview-${lang}.html`);
    await writeFile(out, mail.html, 'utf8');
    console.log(`  → เขียน ${out}`);
    console.log(`  subject: ${mail.subject}`);
  }
}

console.log(`\n${'─'.repeat(50)}\nผ่าน ${pass} / ล้มเหลว ${fail}`);
process.exit(fail ? 1 : 0);
