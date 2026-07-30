/* จุดเดียวที่ผูกกับ schema ของ Postgres — ตรงกับ db/schema.sql
   ถ้าตารางของคุณใช้ชื่อคอลัมน์อื่น แก้ที่นี่ที่เดียว
   ถ้าตารางไม่มีคอลัมน์ไหน ตั้งเป็น null → query builder จะข้ามคอลัมน์นั้นไป */

export const TABLE = process.env.LEADS_TABLE || 'webinar_leads';
export const SOURCE = process.env.LEADS_SOURCE || 'webinar-aiteam-lead';

export const COLS = {
  email: 'email',
  name: 'name',
  ig: 'instagram',
  fb: 'facebook',
  q: 'answer',
  lang: 'lang',
  source: 'source',
  emailSent: 'email_sent',
  userAgent: 'user_agent',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/* conflict target ของ ON CONFLICT — ต้องตรงกับ unique index ใน db/schema.sql
   ตั้งเป็น null ถ้าตารางไม่มี unique index บน email (จะ INSERT ตรงๆ ไม่ upsert) */
export const CONFLICT_TARGET = 'lower(email)';

/* กันชื่อ identifier แปลกปลอมหลุดเข้า SQL — ค่าเหล่านี้มาจาก env ได้
   จึงต้องตรวจก่อนนำไป interpolate (pg ไม่รับ identifier เป็น parameter) */
const IDENT = /^[a-z_][a-z0-9_]*$/i;

export function ident(name) {
  if (!IDENT.test(name)) throw new Error(`ชื่อ identifier ไม่ถูกต้อง: ${name}`);
  return `"${name}"`;
}

/* ตรวจ config ตอน import — พังเร็วดีกว่าพังตอนมี lead เข้ามา */
ident(TABLE);
for (const [key, col] of Object.entries(COLS)) {
  if (col !== null) ident(col);
  else if (key === 'email' || key === 'name') {
    throw new Error(`COLS.${key} ต้องมีค่า ไม่สามารถเป็น null ได้`);
  }
}
