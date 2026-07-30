/* Postgres client สำหรับ serverless
   เก็บ Pool ไว้บน globalThis เพื่อ reuse connection ข้าม warm invocation
   ถ้าสร้าง Pool ใหม่ทุกครั้ง connection จะทะลุ limit ของ DB เร็วมาก */

import pg from 'pg';

const KEY = Symbol.for('webinar.pgPool');

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('ไม่ได้ตั้งค่า DATABASE_URL');

  // Neon/Railway/Vercel Postgres ต้องใช้ SSL แต่ใบรับรองเป็น self-signed chain
  // ที่ Node ไม่รู้จัก — ปิด verify ยกเว้นสั่ง sslmode=disable มาชัดเจน
  const noSsl = /sslmode=disable/i.test(url);

  return new pg.Pool({
    connectionString: url,
    ssl: noSsl ? false : { rejectUnauthorized: false },
    max: 1,                       // 1 connection ต่อ 1 function instance
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000
  });
}

export function getPool() {
  if (!globalThis[KEY]) {
    const pool = createPool();
    // Pool จะ emit 'error' เมื่อ idle client หลุด — ถ้าไม่ดักไว้ process จะ crash
    pool.on('error', (err) => console.error('[db] idle client error:', err.message));
    globalThis[KEY] = pool;
  }
  return globalThis[KEY];
}

/** รัน query แบบ parameterized เท่านั้น — ห้ามต่อ string ค่าผู้ใช้เข้า sql */
export async function query(sql, params = []) {
  return getPool().query(sql, params);
}
