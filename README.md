# Webinar Register — Video Hero

Landing page ลงทะเบียน webinar "จากคนใช้ AI สู่เจ้าของ AI Team"
implement จากดีไซน์ `Webinar Register - Video Hero.dc.html` (Claude Design)

สไตล์ neo-brutalist: เส้นขอบ 3px, hard shadow, ฟอนต์ Pixelify Sans + Kanit

## รัน

เป็นเว็บ static ล้วน ไม่มี build step — เปิด `index.html` ได้เลย
หรือเสิร์ฟผ่าน local server (จำเป็นถ้าจะให้วิดีโอ hero เล่น):

```bash
python -m http.server 8000
# แล้วเปิด http://localhost:8000
```

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html` | โครงหน้าเว็บ (nav, hero, countdown, seats, learn, cases, CTA, modal) |
| `styles.css` | สไตล์ทั้งหมด + responsive |
| `app.js` | `CONFIG`, พจนานุกรม ไทย/EN, countdown, seat bar, modal, ฟอร์ม |
| `assets/` | วิดีโอพื้นหลัง hero (ดูที่ `assets/README.md`) |

## ตั้งค่า

แก้ `CONFIG` ที่หัวไฟล์ `app.js` (ตรงกับ props ของไฟล์ดีไซน์):

```js
const CONFIG = {
  eventDate: '2026-08-15T10:00:00+07:00', // วันเวลาอีเวนต์ (ISO)
  totalSeats: 100,                        // ที่นั่งทั้งหมด
  seatsTaken: 73,                         // ลงทะเบียนแล้ว
  customQuestion: '',                     // เว้นว่าง = ใช้คำถามเริ่มต้นตามภาษา
  endpoint: ''                            // URL รับข้อมูลลงทะเบียน (POST JSON)
};
```

## ฟอร์มลงทะเบียน

ถ้า `CONFIG.endpoint` เว้นว่าง ฟอร์มจะแสดงหน้า "ลงทะเบียนสำเร็จ" อย่างเดียว
โดยไม่ส่งข้อมูลไปไหน (เหมือนพฤติกรรมในไฟล์ดีไซน์)
ถ้าใส่ URL ไว้ จะ `POST` JSON `{ email, name, ig, fb, q, lang }` ไปที่ endpoint นั้น

## ภาษา

ปุ่ม 🌐 บน nav สลับ ไทย ↔ อังกฤษ ข้อความทั้งหมดอยู่ใน `DICT` ในไฟล์ `app.js`
