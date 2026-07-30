#!/usr/bin/env node
/* แปลงไฟล์สำรอง data/leads.jsonl → data/leads.csv
   รัน: npm run leads:export

   ใช้ได้กับไฟล์สำรองในเครื่องเท่านั้น (ตอน dev)
   ถ้าต้องการ export จาก production ให้ดึงจาก Postgres:
     \copy (SELECT * FROM webinar_leads ORDER BY created_at) TO 'leads.csv' CSV HEADER */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'data');
const IN = join(DIR, 'leads.jsonl');
const OUT = join(DIR, 'leads.csv');

const COLUMNS = ['at', 'email', 'name', 'ig', 'fb', 'q', 'lang', 'userAgent'];

/** escape ตาม RFC 4180 — ครอบด้วย " เมื่อมี , " หรือขึ้นบรรทัดใหม่ */
function cell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

let raw;
try {
  raw = await readFile(IN, 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(`ไม่พบไฟล์ ${IN} — ยังไม่มี lead ในเครื่อง หรือ lead อยู่บน production (ดึงจาก Postgres แทน)`);
    process.exit(1);
  }
  throw err;
}

const rows = [];
let skipped = 0;

raw.split(/\r?\n/).forEach((line, i) => {
  if (!line.trim()) return;
  try {
    rows.push(JSON.parse(line));
  } catch {
    skipped++;
    console.warn(`ข้ามบรรทัดที่ ${i + 1} — ไม่ใช่ JSON ที่ถูกต้อง`);
  }
});

if (!rows.length) {
  console.error('ไม่มีข้อมูลที่อ่านได้');
  process.exit(1);
}

// เรียงตามเวลา และตัด lead ที่อีเมลซ้ำออก เก็บรายการล่าสุดของแต่ละอีเมล
rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
const byEmail = new Map();
for (const row of rows) byEmail.set(String(row.email || '').toLowerCase(), row);
const unique = [...byEmail.values()];

// BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
const csv = '﻿' + [
  COLUMNS.join(','),
  ...unique.map((row) => COLUMNS.map((c) => cell(row[c])).join(','))
].join('\r\n') + '\r\n';

await writeFile(OUT, csv, 'utf8');

console.log(`เขียน ${unique.length} รายการลง ${OUT}`);
if (unique.length !== rows.length) console.log(`  (รวม ${rows.length} บรรทัด — ตัดอีเมลซ้ำออก ${rows.length - unique.length})`);
if (skipped) console.log(`  (ข้ามบรรทัดเสียหาย ${skipped})`);
