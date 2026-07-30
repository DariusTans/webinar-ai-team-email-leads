/* GET /api/seats — จำนวนที่นั่งจริงจาก DB (+ SEATS_BASELINE)
   DB ล่มก็ยังตอบ 200 พร้อม fallback:true — หน้าเว็บต้องไม่พังเพราะแถบที่นั่ง */

import { getSeats, fallbackSeats } from '../lib/seats.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method' });
  }

  try {
    const seats = await getSeats();
    // cache 30 วิ ที่ edge — ลด query โดยที่เลขยังสดพอสำหรับ landing page
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(seats);
  } catch (err) {
    console.error('[seats] อ่านจาก DB ไม่สำเร็จ:', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(fallbackSeats());
  }
}
