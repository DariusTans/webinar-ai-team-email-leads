/* นับที่นั่ง — ใช้ร่วมกันทั้ง api/seats.js และ api/register.js */

import { query } from './db.js';
import { TABLE, SOURCE, COLS, ident } from './schema.js';

const num = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const TOTAL = num(process.env.SEATS_TOTAL, 100);
export const BASELINE = num(process.env.SEATS_BASELINE, 73);

function shape(taken) {
  const capped = Math.min(TOTAL, taken);
  return { total: TOTAL, taken: capped, left: Math.max(0, TOTAL - capped) };
}

/** จำนวนที่นั่งจาก DB + baseline offset — throw ถ้า DB ไม่ตอบ */
export async function getSeats() {
  const where = COLS.source ? ` WHERE ${ident(COLS.source)} = $1` : '';
  const params = COLS.source ? [SOURCE] : [];
  const { rows } = await query(`SELECT count(*)::int AS n FROM ${ident(TABLE)}${where}`, params);
  return shape(BASELINE + (rows[0]?.n ?? 0));
}

/** ค่า fallback เมื่อ DB ล่ม — หน้าเว็บต้องไม่พังเพราะแถบที่นั่ง */
export function fallbackSeats() {
  return { ...shape(BASELINE), fallback: true };
}
