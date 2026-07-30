/* Webinar Register — Video Hero
   ตั้งค่าอีเวนต์ได้ที่ CONFIG ด้านล่าง (ตรงกับ props ของไฟล์ดีไซน์) */

const CONFIG = {
  eventDate: '2026-08-15T10:00:00+07:00',
  totalSeats: 100,
  seatsTaken: 73,
  customQuestion: '',   // เว้นว่าง = ใช้คำถามเริ่มต้นตามภาษา
  endpoint: ''          // เว้นว่าง = ไม่ส่งไปที่ไหน (โชว์หน้าสำเร็จอย่างเดียว)
};

const DICT = {
  th: {
    langBtn: 'ไทย',
    navRegister: 'ลงทะเบียน',
    badge: 'WEBINAR • ออนไลน์ • ฟรี',
    kicker: 'From AI User to AI Team Owner',
    title: 'จากคนใช้ AI สู่เจ้าของ AI Team',
    subtitle: 'AI ยุคถัดไปที่เจ้าของธุรกิจต้องรู้ก่อนใคร',
    metaDate: '15 ส.ค. 2026 · 10:00 น.',
    metaFree: 'เข้าร่วมฟรี',
    metaZoom: 'ผ่าน Zoom',
    leadBtn: 'จองที่นั่งฟรี',
    cdTitle: 'อีเวนต์จะเริ่มใน',
    cdDays: 'วัน', cdHours: 'ชั่วโมง', cdMins: 'นาที', cdSecs: 'วินาที',
    cdLive: 'เริ่มแล้ว! 🎉',
    seatsTitle: 'ที่นั่งจำกัด',
    seatsLead: 'รับเพียง', seatsUnit: 'ที่นั่ง',
    seatsTakenLbl: 'ลงทะเบียนแล้ว',
    seatsLeftLbl: 'เหลืออีก',
    seatsHurry: 'รีบจองก่อนเต็ม',
    learnTitle: 'สิ่งที่คุณจะได้เรียนรู้',
    learnSub: '90 นาทีที่จะเปลี่ยนมุมมองเรื่อง AI ในธุรกิจของคุณ',
    learn: [
      { title: 'AI ในธุรกิจวันนี้', desc: 'ภาพรวมว่า AI ในโลกธุรกิจไปถึงไหนแล้ว และตอนนี้คุณยืนอยู่ตรงไหน' },
      { title: 'กำแพง 4 ด้าน', desc: 'อุปสรรค 4 อย่างที่เกือบทุกธุรกิจต้องเจอเมื่อเริ่มนำ AI มาใช้จริง' },
      { title: 'Local AI', desc: 'รัน AI บนเครื่องของคุณเอง เป็นส่วนตัว ปลอดภัย ควบคุมข้อมูลได้เต็มที่' },
      { title: 'AI Agent Teams', desc: 'สร้างทีม AI ที่ทำงานร่วมกันเป็นระบบ แทนการสั่ง AI ทีละงาน' }
    ],
    casesTitle: 'ใช้ AI Team ได้กับงานด้านไหนบ้าง',
    casesSub: 'ตัวอย่างทีม AI ที่คุณจะได้เห็นเดโมจริงในงาน',
    cases: [
      { icon: '✍️', title: 'Content Marketing', desc: 'สร้างคอนเทนต์ วางแผนโพสต์ และคิดแคมเปญได้เป็นทีม' },
      { icon: '🔍', title: 'Market Research', desc: 'สแกนตลาด คู่แข่ง และเทรนด์ให้แบบอัตโนมัติ' },
      { icon: '📊', title: 'Business Analysis', desc: 'เปลี่ยนข้อมูลและตัวเลขธุรกิจให้เป็นรายงานที่อ่านง่าย' },
      { icon: '💡', title: 'Customer Insight', desc: 'เข้าใจลูกค้าลึกขึ้นจากรีวิวและบทสนทนา' },
      { icon: '💻', title: 'Software House', desc: 'ช่วยเขียนโค้ด รีวิว และเร่งงานพัฒนาให้เร็วขึ้น' },
      { icon: '🤝', title: 'Sales Team', desc: 'หา lead ตอบลูกค้า และปิดการขายได้เร็วขึ้น' }
    ],
    ctaTitle: 'พร้อมเป็นเจ้าของ AI Team แล้วหรือยัง?',
    ctaSub: 'ที่นั่งมีจำกัดเพียง 100 ที่ — ลงทะเบียนฟรีวันนี้',
    ctaBtn: 'ลงทะเบียนฟรี',
    mTitle: 'ลงทะเบียนเข้าร่วม',
    mSub: 'กรอกข้อมูลเพื่อรับลิงก์ Zoom เข้าร่วมงาน',
    mEmail: 'อีเมล', mEmailPh: 'you@email.com',
    mName: 'ชื่อ-นามสกุล', mNamePh: 'ชื่อของคุณ',
    mIG: 'Instagram', mIGPh: '@username',
    mFB: 'Facebook', mFBPh: 'ชื่อโปรไฟล์',
    defaultQuestion: 'ถ้าคุณมี AI Team หรือ AI ที่จะช่วยงานในบริษัทหรือธุรกิจของคุณ อยากให้ช่วยงานด้านไหนเป็นอันดับแรก?',
    mQPh: 'พิมพ์คำตอบของคุณที่นี่...',
    mSubmit: 'ยืนยันการลงทะเบียน',
    sTitle: 'ลงทะเบียนสำเร็จ!',
    sSub: 'เราได้ส่งลิงก์ Zoom สำหรับเข้าร่วมงานไปที่อีเมลของคุณแล้ว ไว้เจอกันวันที่ 15 ส.ค. 🚀',
    sBtn: 'เยี่ยมเลย!',
    footer: 'สร้างด้วย ❤️ สำหรับผู้ที่อยากเป็นเจ้าของ AI Team'
  },
  en: {
    langBtn: 'EN',
    navRegister: 'Register',
    badge: 'WEBINAR • ONLINE • FREE',
    kicker: 'From AI User to AI Team Owner',
    title: 'From AI User to AI Team Owner',
    subtitle: 'The Next Era of Business AI — and How to Get There First',
    metaDate: '15 Aug 2026 · 10:00 AM',
    metaFree: 'Free to join',
    metaZoom: 'On Zoom',
    leadBtn: 'Save my seat',
    cdTitle: 'Event starts in',
    cdDays: 'Days', cdHours: 'Hours', cdMins: 'Mins', cdSecs: 'Secs',
    cdLive: "We're live! 🎉",
    seatsTitle: 'Limited seats',
    seatsLead: 'Only', seatsUnit: 'seats',
    seatsTakenLbl: 'registered',
    seatsLeftLbl: 'seats left',
    seatsHurry: 'Grab yours before they’re gone',
    learnTitle: "What you'll learn",
    learnSub: '90 minutes that will change how you think about AI in business',
    learn: [
      { title: 'Where AI stands today', desc: 'A clear picture of how far business AI has come — and where you fit in right now.' },
      { title: 'The 4 walls', desc: 'The four obstacles almost every business hits when it starts adopting AI for real.' },
      { title: 'Local AI', desc: 'Run AI on your own machine — private, secure, and fully under your control.' },
      { title: 'AI Agent Teams', desc: 'Build a team of AI agents that work together as a system, not one-off tasks.' }
    ],
    casesTitle: 'Use cases — where an AI Team fits',
    casesSub: "Real demos you'll see live during the webinar",
    cases: [
      { icon: '✍️', title: 'Content Marketing', desc: 'Create content, plan posts, and run campaigns as a team.' },
      { icon: '🔍', title: 'Market Research', desc: 'Scan markets, competitors, and trends automatically.' },
      { icon: '📊', title: 'Business Analysis', desc: 'Turn business data and numbers into clear reports.' },
      { icon: '💡', title: 'Customer Insight', desc: 'Understand customers from reviews and conversations.' },
      { icon: '💻', title: 'Software House', desc: 'Help write code, review, and speed up development.' },
      { icon: '🤝', title: 'Sales Team', desc: 'Find leads, reply to customers, and close deals faster.' }
    ],
    ctaTitle: 'Ready to own your AI Team?',
    ctaSub: 'Only 100 seats available — register free today',
    ctaBtn: 'Register free',
    mTitle: 'Register for the webinar',
    mSub: 'Fill in your details to get the Zoom join link',
    mEmail: 'Email', mEmailPh: 'you@email.com',
    mName: 'Full name', mNamePh: 'Your name',
    mIG: 'Instagram', mIGPh: '@username',
    mFB: 'Facebook', mFBPh: 'Profile name',
    defaultQuestion: 'If you had an AI Team to help run your company or business, which area would you want it to handle first?',
    mQPh: 'Type your answer here...',
    mSubmit: 'Confirm registration',
    sTitle: "You're registered!",
    sSub: "We've sent the Zoom join link to your email. See you on Aug 15! 🚀",
    sBtn: 'Awesome!',
    footer: 'Made with ❤️ for future AI Team owners'
  }
};

const LEARN_COLORS = ['#FFD23F', '#4CC9F0', '#FF7BAC', '#06D6A0'];
const CASE_COLORS = ['#FFD23F', '#4CC9F0', '#FF7BAC', '#06D6A0', '#FF5A5F', '#FFD23F'];

const state = { lang: 'th', modalOpen: false, submitted: false };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const pad = (n) => String(n).padStart(2, '0');

/* ── Seats ─────────────────────────────────────────────────── */
const total = CONFIG.totalSeats;
const taken = Math.min(total, CONFIG.seatsTaken);
const left = Math.max(0, total - taken);
const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

const VALUES = { total, taken, left, days: '00', hours: '00', mins: '00', secs: '00' };

function paintValues() {
  $$('[data-v]').forEach((el) => { el.textContent = VALUES[el.dataset.v]; });
}

/* ── i18n ──────────────────────────────────────────────────── */
function t() { return DICT[state.lang]; }

function paintText() {
  const d = t();
  $$('[data-t]').forEach((el) => { el.textContent = d[el.dataset.t]; });
  $$('[data-ph]').forEach((el) => { el.placeholder = d[el.dataset.ph]; });
  $('#questionLabel').textContent = (CONFIG.customQuestion || '').trim() || d.defaultQuestion;
  document.documentElement.lang = state.lang;
  document.title = `${d.title} — Webinar`;
  renderLists();
}

function renderLists() {
  const d = t();

  $('#learnGrid').innerHTML = d.learn.map((it, i) => `
    <div class="learn-card" style="background:${LEARN_COLORS[i % 4]}">
      <div class="learn-num">${pad(i + 1)}</div>
      <h3 class="learn-title">${it.title}</h3>
      <p class="learn-desc">${it.desc}</p>
    </div>`).join('');

  $('#casesGrid').innerHTML = d.cases.map((c, i) => `
    <div class="case-card">
      <div class="case-icon" style="background:${CASE_COLORS[i % 6]}">${c.icon}</div>
      <h3 class="case-title">${c.title}</h3>
      <p class="case-desc">${c.desc}</p>
    </div>`).join('');
}

/* ── Countdown ─────────────────────────────────────────────── */
const target = new Date(CONFIG.eventDate).getTime();

function tick() {
  const diff = Math.max(0, target - Date.now());
  const s = Math.floor(diff / 1000);
  VALUES.days = pad(Math.floor(s / 86400));
  VALUES.hours = pad(Math.floor((s % 86400) / 3600));
  VALUES.mins = pad(Math.floor((s % 3600) / 60));
  VALUES.secs = pad(s % 60);

  const live = diff <= 0;
  $('#cdLive').hidden = !live;
  $('#cdUnits').hidden = live;
  paintValues();
}

/* ── Modal ─────────────────────────────────────────────────── */
const overlay = $('#overlay');
let lastFocused = null;

function openModal() {
  lastFocused = document.activeElement;
  state.modalOpen = true;
  state.submitted = false;
  $('#modalForm').hidden = false;
  $('#modalDone').hidden = true;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#regForm').querySelector('input')?.focus();
}

function closeModal() {
  state.modalOpen = false;
  overlay.hidden = true;
  document.body.style.overflow = '';
  lastFocused?.focus();
}

function showDone() {
  state.submitted = true;
  $('#modalForm').hidden = true;
  $('#modalDone').hidden = false;
}

/* ── Wiring ────────────────────────────────────────────────── */
$$('[data-open-modal]').forEach((b) => b.addEventListener('click', openModal));
$$('[data-close-modal]').forEach((b) => b.addEventListener('click', closeModal));
$('#closeBtn').addEventListener('click', closeModal);

overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.modalOpen) closeModal(); });

$('#langBtn').addEventListener('click', () => {
  state.lang = state.lang === 'th' ? 'en' : 'th';
  paintText();
  paintValues();
});

$('#regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  data.lang = state.lang;

  if (CONFIG.endpoint) {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('ส่งข้อมูลลงทะเบียนไม่สำเร็จ', err);
    } finally {
      btn.disabled = false;
    }
  }

  form.reset();
  showDone();
});

/* ── Boot ──────────────────────────────────────────────────── */
$('#barFill').style.width = pct + '%';
if (pct > 0 && pct < 100) $('#barFill').style.borderRight = '3px solid #1A1A2E';
paintText();
paintValues();
tick();
setInterval(tick, 1000);
