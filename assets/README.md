# assets

| ไฟล์ | ใช้ที่ไหน |
| --- | --- |
| `demo-pixels-small.mp4` | วิดีโอพื้นหลัง hero (autoplay / muted / loop) |

ไฟล์ต้นฉบับมาจากโปรเจกต์ Claude Design ที่ path `uploads/demo-pixels-small.mp4`
(https://claude.ai/design/p/8a940aa3-0973-4f57-98ef-6431c86175d0)

ถ้าไฟล์นี้หายไป หน้าเว็บยังทำงานได้ปกติ — hero จะแสดงพื้นหลังสีเข้ม `#12122a`
พร้อม gradient scrim แทนวิดีโอ

> หมายเหตุ: ไฟล์มีขนาด ~4.6 MB ซึ่งค่อนข้างใหญ่สำหรับวิดีโอพื้นหลัง
> ถ้าจะ deploy จริง แนะนำใส่ `poster` ให้ `<video>` ใน `index.html`
> เพื่อให้ hero มีภาพแสดงทันทีระหว่างที่วิดีโอยังโหลดไม่เสร็จ
