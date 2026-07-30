# Webinar Register — Video Hero

Landing page ลงทะเบียน webinar "จากคนใช้ AI สู่เจ้าของ AI Team"
implement จากดีไซน์ `Webinar Register - Video Hero.dc.html` (Claude Design)

สไตล์ neo-brutalist: เส้นขอบ 3px, hard shadow, ฟอนต์ Pixelify Sans + Kanit

หน้าเว็บเป็น static ล้วน (ไม่มี build step) ส่วนการเก็บ lead ใช้ Vercel Functions
เก็บลง Postgres + ส่งอีเมลยืนยันผ่าน Resend

## รัน

### แบบเต็ม (มี API — ใช้ตอนพัฒนา/ทดสอบฟอร์ม)

```bash
npm install
cp .env.example .env.local     # แล้วเติมค่าใน .env.local
npx vercel dev                 # http://localhost:3000
```

### แบบดูหน้าเว็บเฉยๆ (ไม่มี API)

```bash
python -m http.server 8000     # http://localhost:8000
```
ฟอร์มจะ POST ไป `/api/register` แล้วได้ 404 → หน้าเว็บจะแสดงข้อความ error
(ถ้าอยากให้โชว์หน้าสำเร็จเลย ตั้ง `CONFIG.endpoint = ''` ใน `app.js`)

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html` | โครงหน้าเว็บ (nav, hero, countdown, seats, learn, cases, CTA, modal) |
| `styles.css` | สไตล์ทั้งหมด + responsive |
| `app.js` | `CONFIG`, พจนานุกรม ไทย/EN, countdown, seat bar, modal, ฟอร์ม |
| `assets/` | วิดีโอพื้นหลัง hero (ดูที่ `assets/README.md`) |
| `api/register.js` | `POST` เก็บ lead → ไฟล์สำรอง + Postgres + อีเมลยืนยัน |
| `api/seats.js` | `GET` จำนวนที่นั่งจริงจาก DB |
| `lib/db.js` | Postgres pool (reuse connection ข้าม invocation) |
| `lib/schema.js` | **ชื่อตาราง/คอลัมน์** — จุดเดียวที่ผูกกับ schema |
| `lib/validate.js` | ตรวจ + normalize input, honeypot, mask อีเมลก่อน log |
| `lib/backup.js` | เขียนไฟล์สำรอง JSON Lines |
| `lib/email.js` | เทมเพลตอีเมล ไทย/EN + ส่งผ่าน Resend |
| `lib/seats.js` | คำนวณที่นั่ง (ใช้ร่วมกัน 2 endpoint) |
| `db/schema.sql` | `CREATE TABLE` — รันครั้งเดียวบน Postgres |
| `scripts/export-csv.js` | แปลงไฟล์สำรองเป็น CSV |
| `scripts/*-test.mjs` | เทสต์ backend / frontend (ไม่ต้องมี DB จริง) |

## เทสต์

```bash
npm test
```

รัน 96 assertion โดยไม่ต้องมี Postgres หรือ Resend key:

| ชุด | ครอบคลุม |
| --- | --- |
| `smoke-test.mjs` | API handlers ผ่าน fake pool — SQL ที่ generate, validation, honeypot, DB ล่ม → 500, seats fallback, `ident()` กัน SQL injection |
| `frontend-test.mjs` | `app.js` ใน jsdom — submit สำเร็จ/ล้มเหลว, error path, สลับภาษา, แถบที่นั่งอัปเดต |
| `email-preview.mjs` | เทมเพลตอีเมล ไทย/EN — ลิงก์ Zoom, escape HTML, กรณีไม่มี `ZOOM_LINK` |

พรีวิวอีเมลเป็นไฟล์ HTML (เปิดดูในเบราว์เซอร์ได้):

```bash
node scripts/email-preview.mjs    # → data/email-preview-th.html, -en.html
```

## ตั้งค่า

แก้ `CONFIG` ที่หัวไฟล์ `app.js` (ตรงกับ props ของไฟล์ดีไซน์):

```js
const CONFIG = {
  eventDate: '2026-08-15T10:00:00+07:00', // วันเวลาอีเวนต์ (ISO)
  totalSeats: 100,                        // ค่าเริ่มต้น — /api/seats จะทับด้วยค่าจริง
  seatsTaken: 73,                         // ค่าเริ่มต้น — แสดงก่อน API ตอบ
  customQuestion: '',                     // เว้นว่าง = ใช้คำถามเริ่มต้นตามภาษา
  endpoint: '/api/register',
  seatsEndpoint: '/api/seats'
};
```

### Environment variables

ดูรายการทั้งหมดใน `.env.example` ตัวที่จำเป็น:

| ตัวแปร | จำเป็น | หมายเหตุ |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string (ต้องมี `?sslmode=require`) |
| `RESEND_API_KEY` | — | ไม่ใส่ = ข้ามการส่งอีเมล (ลงทะเบียนยังทำงานปกติ) |
| `EMAIL_FROM` | — | ต้องเป็นโดเมนที่ verify กับ Resend แล้ว |
| `ZOOM_LINK` | — | ลิงก์ที่จะใส่ในอีเมล ไม่มีก็ยังส่งอีเมลได้ |
| `LEADS_TABLE` | — | default `webinar_leads` |
| `SEATS_TOTAL` | — | default `100` |
| `SEATS_BASELINE` | — | default `73` — บวกทับจำนวนจริงใน DB ตั้ง `0` ถ้าต้องการเลขจริงล้วน |

## ตั้งค่า Database

รันครั้งเดียว:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

ถ้าตารางของคุณใช้ชื่อคอลัมน์อื่น แก้ที่ `lib/schema.js` จุดเดียว (`COLS`) ไม่ต้องแตะโค้ดอื่น

## ฟอร์มลงทะเบียน

`POST /api/register` รับ JSON `{ email, name, ig, fb, q, lang }` แล้ว:

1. ตรวจ input + honeypot (ฟิลด์ `company` ที่คนมองไม่เห็น)
2. เขียนไฟล์สำรอง `data/leads.jsonl` (best-effort)
3. `INSERT ... ON CONFLICT (lower(email)) DO UPDATE` → ลงทะเบียนซ้ำอีเมลเดิมได้ ไม่เกิด row ซ้ำ
4. ส่งอีเมลยืนยัน (best-effort) แล้วอัปเดต `email_sent`
5. ตอบ `{ ok, emailSent, seats }` → หน้าเว็บอัปเดตแถบที่นั่งทันที

**DB คือ source of truth** — ถ้า insert พังจะตอบ `500` และฟอร์มแสดง error สีแดง
โดยไม่ล้างข้อมูลที่กรอก (ไม่แสร้งว่าสำเร็จ ไม่ทำ lead หายเงียบ)

## ไฟล์สำรอง (local data)

- **ตอน dev** → `data/leads.jsonl` (1 บรรทัด = 1 lead) ใช้งานได้จริง
- **บน Vercel** → เขียนที่ `/tmp/leads.jsonl` ซึ่งหายทุก cold start
  จึงเป็นแค่ diagnostic **ไม่ใช่ backup ที่พึ่งได้** — ชั้นสำรองจริงบน production คือ
  Postgres + Vercel logs (ทุก lead ถูก `console.log` โดย mask อีเมลไว้)

แปลงเป็น CSV (มี BOM ให้ Excel อ่านภาษาไทยได้):

```bash
npm run leads:export     # data/leads.jsonl → data/leads.csv
```

## Deploy บน Vercel

```bash
npx vercel link
# ตั้ง env vars (พิมพ์ค่าเอง ทำทั้ง production และ preview)
npx vercel env add DATABASE_URL production
npx vercel env add RESEND_API_KEY production
npx vercel env add EMAIL_FROM production
npx vercel env add ZOOM_LINK production
npx vercel --prod
```

ไฟล์ static ที่ root Vercel เสิร์ฟให้อัตโนมัติ ไม่ต้องตั้ง build command

## ภาษา

ปุ่ม 🌐 บน nav สลับ ไทย ↔ อังกฤษ ข้อความทั้งหมดอยู่ใน `DICT` ในไฟล์ `app.js`
ภาษาที่เลือกถูกส่งไปกับฟอร์มด้วย → อีเมลยืนยันเป็นภาษาเดียวกัน
