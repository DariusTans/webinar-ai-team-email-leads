/* ทดสอบ app.js ในระดับ DOM ด้วย jsdom — เน้น submit handler และ error path
   (bug เดิม: POST พังแต่ยังโชว์หน้าสำเร็จ → lead หายเงียบ)

   รัน: node scripts/frontend-test.mjs */

import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

const html = await readFile('index.html', 'utf8');
const appJs = await readFile('app.js', 'utf8');

/** สร้างหน้าเว็บใหม่พร้อม fetch ที่ควบคุมได้ */
async function boot(fetchImpl) {
  // runScripts: 'outside-only' → window.eval มี document/window ใน scope
  // (index.html โหลด app.js ผ่าน <script src> ซึ่ง jsdom ไม่ fetch ให้ เราจึง eval เอง)
  const dom = new JSDOM(html, {
    url: 'http://localhost:3000/',
    pretendToBeVisual: true,
    runScripts: 'outside-only'
  });
  const { window } = dom;
  const fetchCalls = [];

  window.fetch = (url, opts) => {
    fetchCalls.push({ url, opts });
    return fetchImpl(url, opts);
  };
  window.HTMLFormElement.prototype.reportValidity = () => true;   // jsdom ไม่มี
  window.HTMLFormElement.prototype.submit = () => {};
  window.console.warn = () => {};
  window.console.error = () => {};

  window.eval(appJs);
  await new Promise((r) => setTimeout(r, 20));   // ให้ loadSeats() ตอนบูตทำงานจบ

  const $ = (s) => window.document.querySelector(s);

  async function submitForm(fields = {}) {
    const form = $('#regForm');
    Object.assign(form.querySelector('[name=email]'), { value: fields.email ?? 'a@b.com' });
    Object.assign(form.querySelector('[name=name]'), { value: fields.name ?? 'ทดสอบ' });
    if (fields.hp_zzz) form.querySelector('[name=hp_zzz]').value = fields.hp_zzz;
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 30));
    return form;
  }

  return { window, $, fetchCalls, submitForm, dom };
}

const jsonRes = (body, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

// ── 1. บูตหน้าเว็บ + โหลดที่นั่งจาก API ──────────────────────
{
  console.log('\n[1] บูต + GET /api/seats');
  const { $, fetchCalls } = await boot((url) =>
    url === '/api/seats' ? jsonRes({ total: 100, taken: 81, left: 19 }) : jsonRes({}, 404));

  check('เรียก /api/seats ตอนบูต', fetchCalls.some((c) => c.url === '/api/seats'));
  check('แสดง left = 19 จาก API (ไม่ใช่ 27 จาก CONFIG)', $('[data-v="left"]').textContent === '19', `→ ${$('[data-v="left"]').textContent}`);
  check('แสดง taken = 81', $('[data-v="taken"]').textContent === '81');
  check('แถบที่นั่ง = 81%', $('#barFill').style.width === '81%', `→ ${$('#barFill').style.width}`);
  check('ไม่มี error ค้างอยู่', $('#formError').hidden);
}

// ── 2. /api/seats ล่ม → คงเลขจาก CONFIG ────────────────────
{
  console.log('\n[2] /api/seats ล่ม');
  const { $ } = await boot(() => Promise.reject(new Error('network down')));
  check('คงเลขเริ่มต้นจาก CONFIG (left = 27)', $('[data-v="left"]').textContent === '27', `→ ${$('[data-v="left"]').textContent}`);
  check('หน้าเว็บยังทำงาน (countdown แสดงผล)', /^\d{2}$/.test($('[data-v="days"]').textContent));
}

// ── 3. ลงทะเบียนสำเร็จ ─────────────────────────────────────
{
  console.log('\n[3] ลงทะเบียนสำเร็จ (emailSent: true)');
  const { $, fetchCalls, submitForm } = await boot((url) =>
    url === '/api/register'
      ? jsonRes({ ok: true, emailSent: true, seats: { total: 100, taken: 74, left: 26 } })
      : jsonRes({ total: 100, taken: 73, left: 27 }));

  $('[data-open-modal]').click();
  const form = await submitForm({ email: 'Somchai@Example.com', name: ' สมชาย ' });

  const post = fetchCalls.find((c) => c.url === '/api/register');
  const sent = JSON.parse(post.opts.body);
  check('POST ไป /api/register', Boolean(post));
  check('ส่ง JSON พร้อม lang', sent.email === 'Somchai@Example.com' && sent.lang === 'th', JSON.stringify(sent));
  check('โชว์หน้าสำเร็จ', $('#modalDone').hidden === false && $('#modalForm').hidden === true);
  check('ข้อความยืนยันว่า "ส่งอีเมลแล้ว"', $('#doneSub').textContent.includes('ส่งลิงก์ Zoom'));
  check('อัปเดตแถบที่นั่งเป็น 74', $('[data-v="taken"]').textContent === '74', `→ ${$('[data-v="taken"]').textContent}`);
  check('ล้างฟอร์มแล้ว', form.querySelector('[name=email]').value === '');
  check('ไม่มี error', $('#formError').hidden);
}

// ── 4. สำเร็จแต่ส่งอีเมลไม่ได้ → ต้องไม่โกหก ────────────────
{
  console.log('\n[4] สำเร็จแต่ emailSent: false');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register' ? jsonRes({ ok: true, emailSent: false }) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  await submitForm();

  check('โชว์หน้าสำเร็จ', $('#modalDone').hidden === false);
  check('ไม่อ้างว่าส่งอีเมลแล้ว', !$('#doneSub').textContent.includes('เราได้ส่งลิงก์'), `→ ${$('#doneSub').textContent}`);
  check('บอกว่าจะส่งให้ก่อนวันงาน', $('#doneSub').textContent.includes('ก่อนวันงาน'));
}

// ── 5. DB ล่ม (500) → bug เดิมอยู่ตรงนี้ ───────────────────
{
  console.log('\n[5] server ตอบ 500 (จุดที่ bug เดิมอยู่)');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register' ? jsonRes({ ok: false, error: 'db' }, 500) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  const form = await submitForm({ email: 'keepme@x.com' });

  check('ไม่โชว์หน้าสำเร็จ', $('#modalDone').hidden === true, '← bug เดิมจะโชว์');
  check('ยังอยู่หน้าฟอร์ม', $('#modalForm').hidden === false);
  check('แสดง error ให้ผู้ใช้เห็น', $('#formError').hidden === false && $('#formError').textContent.length > 0);
  check('ข้อความ error ภาษาไทย', $('#formError').textContent.includes('ลองอีกครั้ง'), `→ ${$('#formError').textContent}`);
  check('ไม่ล้างข้อมูลที่กรอก (กด submit ซ้ำได้)', form.querySelector('[name=email]').value === 'keepme@x.com');
  check('ปุ่มกลับมากดได้', form.querySelector('button[type=submit]').disabled === false);
  check('ข้อความปุ่มกลับเป็นเดิม', form.querySelector('button[type=submit]').textContent.includes('ยืนยันการลงทะเบียน'));
}

// ── 6. network พัง (fetch reject) ───────────────────────────
{
  console.log('\n[6] network พัง');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register' ? Promise.reject(new Error('offline')) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  const form = await submitForm();

  check('ไม่โชว์หน้าสำเร็จ', $('#modalDone').hidden === true);
  check('แสดง error เรื่องการเชื่อมต่อ', $('#formError').textContent.includes('เชื่อมต่อไม่ได้'), `→ ${$('#formError').textContent}`);
  check('ข้อมูลที่กรอกยังอยู่', form.querySelector('[name=email]').value === 'a@b.com');
}

// ── 7. validation error จาก server (400) ───────────────────
{
  console.log('\n[7] server ตอบ 400 validation');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register'
      ? jsonRes({ ok: false, error: 'validation', errors: { email: 'invalid' } }, 400)
      : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  await submitForm({ email: 'bad@@x' });

  check('ไม่โชว์หน้าสำเร็จ', $('#modalDone').hidden === true);
  check('แสดง error เจาะจงเรื่องอีเมล', $('#formError').textContent.includes('อีเมลไม่ถูกต้อง'), `→ ${$('#formError').textContent}`);
}

// ── 8. สลับภาษาแล้ว error ต้องแปลตาม ───────────────────────
{
  console.log('\n[8] สลับภาษาขณะมี error ค้าง');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register' ? jsonRes({ ok: false }, 500) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  await submitForm();
  const thMsg = $('#formError').textContent;

  $('#langBtn').click();
  await new Promise((r) => setTimeout(r, 10));

  check('ข้อความ error เปลี่ยนเป็นอังกฤษ', $('#formError').textContent !== thMsg && /try again/i.test($('#formError').textContent), `→ ${$('#formError').textContent}`);
  check('ปุ่ม submit เป็นอังกฤษ', $('#regForm button[type=submit]').textContent.includes('Confirm'));
}

// ── 9. ปิด/เปิด modal ใหม่ → error หาย ─────────────────────
{
  console.log('\n[9] เปิด modal ใหม่หลังเกิด error');
  const { $, submitForm } = await boot((url) =>
    url === '/api/register' ? jsonRes({ ok: false }, 500) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  await submitForm();
  check('มี error อยู่', $('#formError').hidden === false);

  $('#closeBtn').click();
  $('[data-open-modal]').click();
  check('error หายเมื่อเปิดใหม่', $('#formError').hidden === true);
  check('กลับมาที่ฟอร์ม', $('#modalForm').hidden === false && $('#modalDone').hidden === true);
}

// ── 10. honeypot ยังส่งไปกับฟอร์ม (ให้ server ตรวจ) ────────
{
  console.log('\n[10] honeypot');
  const { $, fetchCalls, submitForm } = await boot((url) =>
    url === '/api/register' ? jsonRes({ ok: true, emailSent: false }) : jsonRes({ total: 100, taken: 73 }));

  $('[data-open-modal]').click();
  await submitForm({ hp_zzz: 'Bot Inc' });

  const sent = JSON.parse(fetchCalls.find((c) => c.url === '/api/register').opts.body);
  check('ส่งฟิลด์กับดักไปให้ server ตรวจ', sent.hp_zzz === 'Bot Inc');
  check('honeypot ถูกซ่อนจากผู้ใช้ (class .hp)', $('.hp') !== null && $('.hp [name=hp_zzz]') !== null);
  // ชื่อที่ browser autofill รู้จักต้องไม่มีในฟอร์มเลย ไม่งั้นคนจริงโดนตัดสินว่าเป็นบอท
  check('ไม่มีฟิลด์ชื่อ company ในฟอร์ม', $('[name=company]') === null);
}

console.log(`\n${'─'.repeat(50)}\nผ่าน ${pass} / ล้มเหลว ${fail}`);
process.exit(fail ? 1 : 0);
