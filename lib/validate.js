/* ตรวจและ normalize ข้อมูลจากฟอร์ม — ไม่ throw คืน { ok, data, errors, spam } */

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const LIMITS = { email: 254, name: 120, ig: 120, fb: 120, q: 2000 };

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** ตัดข้อความยาวเกินแทนที่จะปฏิเสธ — ผู้ใช้ไม่ควรเสีย lead เพราะพิมพ์ยาว */
const clip = (v, max) => (v.length > max ? v.slice(0, max) : v);

/** ตัด @ นำหน้าและ URL ออกจาก social handle ให้เหลือ username */
function handle(v) {
  return v.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, '').replace(/\/+$/, '');
}

export function validate(body) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = {};

  // honeypot — ฟิลด์ที่คนจริงมองไม่เห็น ถ้ามีค่าคือบอท
  if (str(input.company)) return { ok: false, spam: true, errors: {}, data: null };

  const email = clip(str(input.email).toLowerCase(), LIMITS.email);
  if (!email) errors.email = 'required';
  else if (!EMAIL_RE.test(email)) errors.email = 'invalid';

  const name = clip(str(input.name), LIMITS.name);
  if (!name) errors.name = 'required';

  const lang = input.lang === 'en' ? 'en' : 'th';

  if (Object.keys(errors).length) return { ok: false, spam: false, errors, data: null };

  return {
    ok: true,
    spam: false,
    errors: {},
    data: {
      email,
      name,
      ig: clip(handle(str(input.ig)), LIMITS.ig) || null,
      fb: clip(handle(str(input.fb)), LIMITS.fb) || null,
      q: clip(str(input.q), LIMITS.q) || null,
      lang
    }
  };
}

/** ปิดบังอีเมลก่อน log — a***@domain.com */
export function maskEmail(email) {
  if (typeof email !== 'string') return '(none)';
  const at = email.indexOf('@');
  if (at < 1) return '***';
  return `${email[0]}***${email.slice(at)}`;
}
