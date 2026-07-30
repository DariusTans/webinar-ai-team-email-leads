-- ตารางเก็บ lead ลงทะเบียน webinar
-- รันไฟล์นี้บน Postgres ของคุณ:
--   psql "$DATABASE_URL" -f db/schema.sql
-- idempotent — รันซ้ำได้ไม่พัง

CREATE TABLE IF NOT EXISTS webinar_leads (
  id          bigserial   PRIMARY KEY,
  email       text        NOT NULL,
  name        text        NOT NULL,
  instagram   text,
  facebook    text,
  answer      text,                                        -- คำตอบคำถามท้ายฟอร์ม
  lang        text        NOT NULL DEFAULT 'th',           -- 'th' | 'en' → ใช้เลือกภาษาอีเมล
  source      text        NOT NULL DEFAULT 'webinar-aiteam-lead',
  email_sent  boolean     NOT NULL DEFAULT false,          -- ไล่ส่งอีเมลซ้ำภายหลังได้
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- unique บน email แบบ case-insensitive → A@x.com กับ a@x.com นับเป็นคนเดียว
-- และเป็น conflict target ให้ ON CONFLICT (lower(email)) DO UPDATE
CREATE UNIQUE INDEX IF NOT EXISTS webinar_leads_email_uniq
  ON webinar_leads (lower(email));

CREATE INDEX IF NOT EXISTS webinar_leads_created_at_idx
  ON webinar_leads (created_at DESC);


-- ── ถ้าตารางมีอยู่แล้วจากเวอร์ชันก่อน ─────────────────────────────
-- คำสั่งเหล่านี้เติมคอลัมน์ที่อาจยังไม่มี (ปลอดภัย รันซ้ำได้)
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS instagram  text;
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS facebook   text;
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS answer     text;
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS lang       text        NOT NULL DEFAULT 'th';
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS source     text        NOT NULL DEFAULT 'webinar-aiteam-lead';
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS email_sent boolean     NOT NULL DEFAULT false;
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE webinar_leads ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();


-- ── คำสั่งที่ใช้บ่อย ────────────────────────────────────────────────
-- ดู lead ล่าสุด:
--   SELECT id, email, name, lang, email_sent, created_at
--     FROM webinar_leads ORDER BY created_at DESC LIMIT 20;
--
-- นับจำนวนลงทะเบียน:
--   SELECT count(*) FROM webinar_leads;
--
-- หา lead ที่ยังไม่ได้รับอีเมล:
--   SELECT email, name, lang FROM webinar_leads WHERE NOT email_sent;
--
-- export CSV จาก DB (รันใน psql):
--   \copy (SELECT * FROM webinar_leads ORDER BY created_at) TO 'leads.csv' CSV HEADER
