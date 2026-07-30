/* อีเมลยืนยันการลงทะเบียน — ส่งผ่าน Resend
   ถ้าไม่ได้ตั้ง RESEND_API_KEY จะ no-op + log เตือน (dev รันได้โดยไม่ต้องมีคีย์)
   การส่งเป็น best-effort: พังแล้วไม่ทำให้การลงทะเบียนล้ม เพราะ lead อยู่ใน DB แล้ว */

import { Resend } from 'resend';
import { maskEmail } from './validate.js';

const EVENT = {
  th: process.env.EVENT_DATE_TH || '15 สิงหาคม 2026 · 10:00 น. (GMT+7)',
  en: process.env.EVENT_DATE_EN || '15 August 2026 · 10:00 AM (GMT+7)'
};

const COPY = {
  th: {
    subject: '🎉 ยืนยันที่นั่งแล้ว — Webinar "จากคนใช้ AI สู่เจ้าของ AI Team"',
    heading: 'ที่นั่งของคุณถูกจองแล้ว!',
    greet: (name) => `สวัสดีคุณ ${name}`,
    intro: 'ขอบคุณที่ลงทะเบียนเข้าร่วม webinar <b>"จากคนใช้ AI สู่เจ้าของ AI Team"</b> เราจองที่นั่งของคุณไว้เรียบร้อยแล้ว',
    whenLbl: 'วันและเวลา',
    whereLbl: 'ช่องทาง',
    where: 'Zoom (ออนไลน์)',
    zoomBtn: 'เข้าร่วมผ่าน Zoom',
    zoomNote: 'บันทึกอีเมลนี้ไว้ — ลิงก์เดิมใช้เข้างานได้ในวันจริง',
    noZoom: 'เราจะส่งลิงก์ Zoom ให้ทางอีเมลอีกครั้งก่อนวันงาน',
    learnTitle: 'สิ่งที่คุณจะได้ในงาน',
    learn: [
      'AI ในธุรกิจวันนี้ไปถึงไหนแล้ว และคุณยืนอยู่ตรงไหน',
      'กำแพง 4 ด้านที่เกือบทุกธุรกิจต้องเจอเมื่อเริ่มใช้ AI จริง',
      'Local AI — รัน AI บนเครื่องตัวเอง ปลอดภัย ควบคุมข้อมูลได้เต็มที่',
      'AI Agent Teams — สร้างทีม AI ที่ทำงานร่วมกันเป็นระบบ'
    ],
    outro: 'ไว้เจอกันในงานครับ 🚀',
    footer: 'อีเมลนี้ส่งเพราะคุณลงทะเบียน webinar ไว้ ถ้าไม่ได้ลงทะเบียน กรุณาละเว้นอีเมลนี้'
  },
  en: {
    subject: '🎉 You\'re registered — "From AI User to AI Team Owner" webinar',
    heading: 'Your seat is confirmed!',
    greet: (name) => `Hi ${name}`,
    intro: 'Thanks for registering for the <b>"From AI User to AI Team Owner"</b> webinar. Your seat is reserved.',
    whenLbl: 'Date & time',
    whereLbl: 'Where',
    where: 'Zoom (online)',
    zoomBtn: 'Join on Zoom',
    zoomNote: 'Keep this email — the same link works on the day of the event.',
    noZoom: 'We\'ll email you the Zoom link again before the event.',
    learnTitle: 'What you\'ll learn',
    learn: [
      'Where business AI stands today — and where you fit in',
      'The 4 walls almost every business hits when adopting AI',
      'Local AI — run AI on your own machine, private and fully under your control',
      'AI Agent Teams — build AI agents that work together as a system'
    ],
    outro: 'See you there 🚀',
    footer: 'You received this because you registered for our webinar. If that wasn\'t you, please ignore this email.'
  }
};

/* โทนสีเดียวกับหน้าเว็บ (neo-brutalist) — inline CSS เท่านั้น
   email client ส่วนใหญ่ตัด <style> block ทิ้ง */
const C = { ink: '#1A1A2E', cream: '#FFF8E7', yellow: '#FFD23F', red: '#FF5A5F', cyan: '#4CC9F0' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderHtml(t, name, zoomLink, when) {
  const card = `border:3px solid ${C.ink};box-shadow:6px 6px 0 ${C.ink}`;

  const zoomBlock = zoomLink
    ? `<tr><td style="padding:0 28px 8px">
         <a href="${esc(zoomLink)}" style="display:inline-block;background:${C.red};color:${C.cream};font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;${card}">${t.zoomBtn} →</a>
         <p style="margin:14px 0 0;font-size:13px;color:#555">${t.zoomNote}</p>
       </td></tr>`
    : `<tr><td style="padding:0 28px 8px"><p style="margin:0;font-size:14px;color:#555">${t.noZoom}</p></td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:${C.cream};font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;${card}">
  <tr><td style="background:${C.yellow};padding:22px 28px;border-bottom:3px solid ${C.ink}">
    <div style="font-size:12px;font-weight:700;letter-spacing:2px">WEBINAR • ONLINE • FREE</div>
    <div style="font-size:24px;font-weight:700;margin-top:6px">🎉 ${t.heading}</div>
  </td></tr>

  <tr><td style="padding:26px 28px 4px">
    <p style="margin:0 0 12px;font-size:16px;font-weight:600">${esc(t.greet(name))}</p>
    <p style="margin:0;font-size:15px;line-height:1.65">${t.intro}</p>
  </td></tr>

  <tr><td style="padding:20px 28px 18px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cyan};${card}">
      <tr><td style="padding:16px 18px">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;opacity:.75">${t.whenLbl.toUpperCase()}</div>
        <div style="font-size:17px;font-weight:700;margin:2px 0 12px">📅 ${esc(when)}</div>
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;opacity:.75">${t.whereLbl.toUpperCase()}</div>
        <div style="font-size:17px;font-weight:700;margin-top:2px">▶ ${t.where}</div>
      </td></tr>
    </table>
  </td></tr>

  ${zoomBlock}

  <tr><td style="padding:22px 28px 4px">
    <div style="font-size:15px;font-weight:700;margin-bottom:10px">${t.learnTitle}</div>
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${t.learn.map((it, i) => `<tr>
        <td valign="top" style="padding:0 10px 10px 0;font-weight:700;color:${C.red}">${String(i + 1).padStart(2, '0')}</td>
        <td valign="top" style="padding:0 0 10px;font-size:14px;line-height:1.55">${esc(it)}</td>
      </tr>`).join('')}
    </table>
  </td></tr>

  <tr><td style="padding:8px 28px 26px"><p style="margin:0;font-size:15px;font-weight:600">${t.outro}</p></td></tr>

  <tr><td style="background:${C.ink};color:${C.cream};padding:16px 28px;font-size:12px;line-height:1.6">${t.footer}</td></tr>
</table>
</body></html>`;
}

function renderText(t, name, zoomLink, when) {
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  return [
    `${t.heading}`,
    '',
    t.greet(name),
    strip(t.intro),
    '',
    `${t.whenLbl}: ${when}`,
    `${t.whereLbl}: ${t.where}`,
    '',
    zoomLink ? `${t.zoomBtn}: ${zoomLink}\n${t.zoomNote}` : t.noZoom,
    '',
    `${t.learnTitle}:`,
    ...t.learn.map((it, i) => `  ${i + 1}. ${it}`),
    '',
    t.outro,
    '',
    '---',
    t.footer
  ].join('\n');
}

/** ประกอบเนื้อหาอีเมล — แยกออกมาให้ scripts/email-preview.mjs เรียกได้โดยไม่ต้องส่งจริง */
export function buildEmail({ name, lang = 'th', zoomLink = '' }) {
  const t = COPY[lang] || COPY.th;
  const when = EVENT[lang] || EVENT.th;
  return {
    subject: t.subject,
    html: renderHtml(t, name, zoomLink, when),
    text: renderText(t, name, zoomLink, when)
  };
}

/**
 * ส่งอีเมลยืนยัน
 * @returns {Promise<boolean>} true เมื่อส่งสำเร็จ
 */
export async function sendConfirmation({ to, name, lang = 'th' }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] ข้ามการส่ง (ไม่ได้ตั้ง ${!apiKey ? 'RESEND_API_KEY' : 'EMAIL_FROM'}) → ${maskEmail(to)}`);
    return false;
  }

  const { subject, html, text } = buildEmail({
    name,
    lang,
    zoomLink: (process.env.ZOOM_LINK || '').trim()
  });

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, subject, html, text });

    if (error) {
      console.error(`[email] Resend ตอบ error สำหรับ ${maskEmail(to)}:`, error.message || error);
      return false;
    }
    console.log(`[email] ส่งสำเร็จ → ${maskEmail(to)} (${lang})`);
    return true;
  } catch (err) {
    console.error(`[email] ส่งไม่สำเร็จ → ${maskEmail(to)}:`, err.message);
    return false;
  }
}
