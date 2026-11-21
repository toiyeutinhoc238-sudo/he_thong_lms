import { Activity, Course, CourseModule } from '../types';

// ====================== PURE-JS STANDARDS-COMPLIANT PKZIP BUILDER ======================
// Không cần thư viện ngoài, hỗ trợ đầy đủ UTF-8 tiếng Việt (flag 0x0800) & chuẩn CRC-32
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  content: string | Uint8Array;
}

export function createZipBlob(entries: ZipEntry[], mimeType = 'application/zip'): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name.replace(/^\/+/, ''));
    const dataBytes = typeof entry.content === 'string' ? encoder.encode(entry.content) : entry.content;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed 2.0
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // compression: store
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd] as BlobPart[], { type: mimeType });
}

// ====================== HELPERS ======================
function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeSlug(name: string): string {
  return String(name || 'hoc-lieu')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'hoc_lieu';
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ====================== 1. DEEP LINK & EMBED URL BUILDER ======================
export function buildShareLink(params: {
  courseId: string;
  moduleId?: string | null;
  activityId?: string | null;
  embed?: boolean;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://he-thong-lms.onrender.com';
  const qs = new URLSearchParams();
  qs.set('course', params.courseId);
  if (params.moduleId) qs.set('module', params.moduleId);
  if (params.activityId) qs.set('activity', params.activityId);
  if (params.embed) qs.set('embed', '1');
  return `${origin}/?${qs.toString()}`;
}

export function buildEmbedIframeCode(url: string, title: string, heightPx = 680): string {
  return `<iframe src="${url}" title="${escapeHtml(title)}" width="100%" height="${heightPx}" style="border:1px solid #e2e8f0;border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
}

// ====================== 2. QUIZ AIKEN & MOODLE GIFT EXPORTERS ======================
export function exportQuizAiken(activities: Activity[], filenameBase: string) {
  const quizActs = activities.filter(a => a.type === 'quiz' && (a.quizQuestions?.length || 0) > 0);
  const lines: string[] = [];

  quizActs.forEach(act => {
    (act.quizQuestions || []).forEach(q => {
      const cleanQ = String(q.question || '').replace(/\r?\n/g, ' ').trim();
      if (!cleanQ) return;
      lines.push(cleanQ);
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      (q.options || []).forEach((opt, i) => {
        lines.push(`${letters[i]}. ${String(opt || '').replace(/\r?\n/g, ' ').trim()}`);
      });
      const ansLetter = letters[q.correctAnswer] || 'A';
      lines.push(`ANSWER: ${ansLetter}`);
      lines.push('');
    });
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${safeSlug(filenameBase)}_Aiken.txt`);
}

function escapeGift(text: string): string {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/~/g, '\\~')
    .replace(/=/g, '\\=')
    .replace(/#/g, '\\#')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/:/g, '\\:');
}

export function exportQuizGift(activities: Activity[], filenameBase: string) {
  const quizActs = activities.filter(a => a.type === 'quiz' && (a.quizQuestions?.length || 0) > 0);
  const blocks: string[] = ['// Định dạng Moodle GIFT — Xuất từ LMS Nhóm 2', ''];

  quizActs.forEach(act => {
    blocks.push(`// === ${act.title} ===`);
    (act.quizQuestions || []).forEach((q, idx) => {
      const qTitle = `${act.title} - Câu ${idx + 1}`;
      blocks.push(`::${escapeGift(qTitle)}:: ${escapeGift(q.question)} {`);
      (q.options || []).forEach((opt, i) => {
        const prefix = i === q.correctAnswer ? '=' : '~';
        const fb = i === q.correctAnswer && q.explanation ? ` #${escapeGift(q.explanation)}` : '';
        blocks.push(`  ${prefix}${escapeGift(opt)}${fb}`);
      });
      blocks.push('}');
      blocks.push('');
    });
  });

  const blob = new Blob(['\uFEFF' + blocks.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${safeSlug(filenameBase)}_Moodle_GIFT.txt`);
}

// ====================== 3. JSON PACKAGE EXPORT (SAO LƯU / CHUYỂN LMS) ======================
export function exportJsonPackage(course: Course, module?: CourseModule | null, activity?: Activity | null) {
  const payload = {
    format: 'lms-nhom2-package',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    scope: activity ? 'activity' : module ? 'module' : 'course',
    course: {
      code: course.code,
      name: course.name,
      category: course.category,
      gradeLevel: course.gradeLevel,
      description: course.description
    },
    modules: activity
      ? [{
          id: module?.id || activity.moduleId,
          title: module?.title || 'Học liệu nhập vào',
          description: module?.description || '',
          activities: [stripRuntimeFields(activity)]
        }]
      : module
        ? [{
            id: module.id,
            title: module.title,
            description: module.description,
            activities: (module.activities || []).map(stripRuntimeFields)
          }]
        : (course.modules || []).map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            activities: (m.activities || []).map(stripRuntimeFields)
          }))
  };

  const base = activity?.title || module?.title || course.code || course.name;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `${safeSlug(base)}_LMS_Package.json`);
}

function stripRuntimeFields(a: Activity): Partial<Activity> {
  const { isCompleted, score, submission, quizResult, watchedSeconds, videoProgress, viewCount, timeSpentSeconds, firstAccessedAt, lastAccessedAt, ...clean } = a;
  return clean;
}

// ====================== 4. SCORM 1.2 PACKAGE EXPORTER (.zip) ======================
// Đóng gói độc lập: hỗ trợ Video YouTube/MP4 có Neo chặn, Quiz có đếm giờ, Tài liệu, Bài tập + báo điểm chuẩn SCORM 1.2!
const SCORM_API_JS = `/* SCORM 1.2 Runtime Bridge - LMS Nhom 2 */
(function (w) {
  var api = null;
  function findAPI(win) {
    var tries = 0;
    while ((!win.API) && (win.parent) && (win.parent !== win) && tries < 12) {
      tries++;
      win = win.parent;
    }
    return win.API || null;
  }
  function getAPI() {
    if (api) return api;
    api = findAPI(w);
    if (!api && w.opener && typeof w.opener !== 'undefined') api = findAPI(w.opener);
    return api;
  }
  var initialized = false;
  w.LMSBridge = {
    init: function () {
      var a = getAPI();
      if (a && !initialized) {
        try { a.LMSInitialize(''); initialized = true; } catch (e) {}
      }
      return initialized;
    },
    setProgress: function (percent, score10, status) {
      var a = getAPI();
      if (!a) return;
      if (!initialized) this.init();
      try {
        if (typeof score10 === 'number' && !isNaN(score10)) {
          a.LMSSetValue('cmi.core.score.min', '0');
          a.LMSSetValue('cmi.core.score.max', '100');
          a.LMSSetValue('cmi.core.score.raw', String(Math.round(score10 * 10)));
        }
        if (status) a.LMSSetValue('cmi.core.lesson_status', status);
        a.LMSSetValue('cmi.core.lesson_location', String(Math.round(percent || 0)));
        a.LMSCommit('');
      } catch (e) {}
    },
    finish: function () {
      var a = getAPI();
      if (a && initialized) {
        try { a.LMSCommit(''); a.LMSFinish(''); initialized = false; } catch (e) {}
      }
    }
  };
  w.addEventListener('beforeunload', function () { w.LMSBridge.finish(); });
})(window);
`;

function buildScormPlayerHtml(title: string, courseName: string, items: Activity[], origin: string): string {
  const safeItems = items.map(a => {
    const clean = stripRuntimeFields(a);
    // Đổi link tương đối /uploads/... sang URL tuyệt đối để chạy được khi import sang LMS khác!
    if (clean.fileUrl && clean.fileUrl.startsWith('/')) clean.fileUrl = `${origin}${clean.fileUrl}`;
    if (clean.videoUrl && clean.videoUrl.startsWith('/')) clean.videoUrl = `${origin}${clean.videoUrl}`;
    return clean;
  });
  const dataJson = JSON.stringify(safeItems).replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<script src="scorm_api.js"></script>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a}
  .top{background:linear-gradient(90deg,#0374b5,#1e3a8a);color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .top h1{margin:0;font-size:18px}
  .top p{margin:4px 0 0;font-size:12px;opacity:.85}
  .pill{background:rgba(255,255,255,.18);padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700}
  .wrap{max-width:1040px;margin:20px auto;padding:0 16px;display:grid;grid-template-columns:${safeItems.length > 1 ? '260px 1fr' : '1fr'};gap:18px}
  @media(max-width:820px){.wrap{grid-template-columns:1fr}}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .nav-btn{width:100%;text-align:left;padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;margin-bottom:8px;cursor:pointer;font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .nav-btn.active{background:#e0f2fe;border-color:#0374b5;color:#0369a1}
  .nav-btn.done{border-color:#10b981}
  .btn{padding:10px 16px;border-radius:10px;border:none;font-weight:700;font-size:13px;cursor:pointer;background:#0374b5;color:#fff}
  .btn:hover{background:#025a8c}
  .btn-ok{background:#059669}
  .btn-opt{display:block;width:100%;text-align:left;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;margin:8px 0;cursor:pointer;font-size:13px}
  .btn-opt.selected{border-color:#0374b5;background:#e0f2fe;font-weight:700}
  .btn-opt.correct{border-color:#10b981;background:#d1fae5;color:#065f46;font-weight:700}
  .btn-opt.wrong{border-color:#ef4444;background:#fee2e2;color:#991b1b;font-weight:700}
  .video-box{position:relative;aspect-ratio:16/9;background:#0f172a;border-radius:12px;overflow:hidden}
  .video-box iframe,.video-box video{width:100%;height:100%;border:0}
  .overlay{position:absolute;inset:0;background:rgba(2,6,23,.92);display:flex;align-items:center;justify-content:center;padding:16px;z-index:20}
  .modal{background:#fff;border-radius:16px;padding:20px;max-width:500px;width:100%;border:2px solid #4f46e5}
  .bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:10px 0}
  .bar > div{height:100%;background:#0374b5;transition:width .3s}
  .badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1}
  .timer{font-family:monospace;font-size:15px;font-weight:800;color:#b45309;background:#fef3c7;padding:6px 12px;border-radius:10px}
</style>
</head>
<body>
<div class="top">
  <div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(courseName)} • Gói học liệu chuẩn SCORM 1.2 (LMS Nhóm 2)</p>
  </div>
  <div class="pill" id="overallPill">Tiến độ: 0%</div>
</div>
<div class="wrap">
  ${safeItems.length > 1 ? '<div class="card"><div style="font-size:12px;font-weight:800;color:#64748b;margin-bottom:10px;text-transform:uppercase">Nội dung bài học</div><div id="navList"></div></div>' : ''}
  <div class="card" id="stage"></div>
</div>
<script>
const ITEMS = ${dataJson};
const state = { idx: 0, done: {}, scores: {}, cpDone: {}, quizAns: {}, quizDone: {} };
let ytPlayer = null, pollId = null, quizTimerId = null;
window.LMSBridge && window.LMSBridge.init();

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmt(sec){sec=Math.max(0,Math.floor(sec||0));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
function extractYT(u){if(!u)return null;var m=u.match(/(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|shorts\\/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})/);return m?m[1]:null}

function syncScorm(){
  const total = ITEMS.length || 1;
  const doneCnt = Object.keys(state.done).filter(k=>state.done[k]).length;
  const pct = Math.round((doneCnt/total)*100);
  document.getElementById('overallPill').textContent = 'Tiến độ: '+pct+'% ('+doneCnt+'/'+total+')';
  const vals = Object.values(state.scores);
  const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : (pct===100?10:undefined);
  const status = pct >= 100 ? (avg !== undefined && avg < 5 ? 'failed' : 'completed') : 'incomplete';
  window.LMSBridge && window.LMSBridge.setProgress(pct, avg, status);
  renderNav();
}

function renderNav(){
  const el = document.getElementById('navList');
  if(!el) return;
  el.innerHTML = ITEMS.map((it, i) => '<button class="nav-btn '+(i===state.idx?'active':'')+' '+(state.done[it.id]?'done':'')+'" onclick="selectItem('+i+')"><span>'+esc(it.title)+'</span><span>'+(state.done[it.id]?'✓':'○')+'</span></button>').join('');
}

function cleanup(){
  if(pollId){clearInterval(pollId);pollId=null}
  if(quizTimerId){clearInterval(quizTimerId);quizTimerId=null}
  try{ytPlayer&&ytPlayer.destroy&&ytPlayer.destroy()}catch(e){}
  ytPlayer=null;
}

function selectItem(i){
  cleanup();
  state.idx = i;
  renderNav();
  const act = ITEMS[i];
  const stage = document.getElementById('stage');
  if(!act){stage.innerHTML='<p>Không có học liệu.</p>';return;}

  if(act.type === 'video') renderVideo(act, stage);
  else if(act.type === 'quiz') renderQuiz(act, stage);
  else if(act.type === 'assignment') renderAssignment(act, stage);
  else renderDocument(act, stage);
}

function renderVideo(act, stage){
  const ytId = extractYT(act.videoUrl);
  const cps = (act.videoCheckpoints || []).slice().sort((a,b)=>a.timeSeconds-b.timeSeconds);
  const cpState = state.cpDone[act.id] || (state.cpDone[act.id] = {});
  let maxWatched = 0, activeCp = null;

  stage.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h2 style="margin:0;font-size:18px">'+esc(act.title)+'</h2><span class="badge">Video'+(cps.length?' • '+cps.length+' neo chặn':'')+'</span></div>'
    + '<p style="color:#475569;font-size:13px">'+esc(act.description||'')+'</p>'
    + '<div class="video-box" id="vBox">'+(ytId?'<div id="ytMount" style="width:100%;height:100%"></div>':act.videoUrl?'<video id="h5v" controls src="'+esc(act.videoUrl)+'"></video>':'<p style="color:#94a3b8;padding:24px">Chưa có link video</p>')+'<div id="cpOverlay"></div></div>'
    + '<div class="bar"><div id="vBar" style="width:0%"></div></div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:#475569"><span id="vStat">Đã xem: 0%</span>'+(cps.length?'<span style="color:#4f46e5;font-weight:700">Xem ≥80% & vượt qua hết neo chặn để tự động hoàn thành</span>':'<button class="btn btn-ok" onclick="markDone(\\''+act.id+'\\')">Đánh dấu hoàn thành</button>')+'</div>';

  function showCp(cp, pauseFn, resumeFn){
    activeCp = cp;
    pauseFn();
    const ov = document.getElementById('cpOverlay');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="modal"><div class="badge" style="margin-bottom:8px">Neo chặn tại '+fmt(cp.timeSeconds)+'</div><h3 style="margin:0 0 12px;font-size:15px">'+esc(cp.question)+'</h3><div id="cpOpts"></div><div id="cpFb" style="margin-top:10px;font-size:13px;font-weight:700"></div></div>';
    const box = document.getElementById('cpOpts');
    (cp.options||[]).forEach((opt, oi)=>{
      const b = document.createElement('button');
      b.className = 'btn-opt';
      b.textContent = ['A','B','C','D'][oi]+'. '+opt;
      b.onclick = function(){
        const ok = oi === cp.correctAnswer;
        b.className = 'btn-opt '+(ok?'correct':'wrong');
        const fb = document.getElementById('cpFb');
        if(ok || cp.requireCorrect === false){
          cpState[cp.id] = true;
          fb.innerHTML = '<span style="color:'+(ok?'#059669':'#dc2626')+'">'+(ok?'✓ Chính xác!':'✗ Chưa đúng, đã ghi nhận.')+'</span> <button class="btn btn-ok" style="margin-left:8px" id="cpGo">Tiếp tục xem ▶</button>';
          document.getElementById('cpGo').onclick = function(){
            ov.className=''; ov.innerHTML=''; activeCp=null; resumeFn(cp.timeSeconds+1);
          };
        } else {
          fb.innerHTML = '<span style="color:#dc2626">✗ Chưa đúng! Vui lòng chọn lại đáp án đúng để xem tiếp.</span>';
        }
      };
      box.appendChild(b);
    });
  }

  function onTick(cur, dur, pauseFn, seekFn, resumeFn){
    if(activeCp){pauseFn();return;}
    const block = cps.find(c=>!cpState[c.id] && (act.preventVideoSkip ? cur >= c.timeSeconds : (cur >= c.timeSeconds && cur <= c.timeSeconds + 3)));
    if(block){
      if(cur > block.timeSeconds + 2) seekFn(block.timeSeconds);
      showCp(block, pauseFn, (t)=>{ maxWatched = Math.max(maxWatched, t); seekFn(t); resumeFn(); });
      return;
    }
    if(act.preventVideoSkip && cur > maxWatched + 6){ seekFn(maxWatched); return; }
    maxWatched = Math.max(maxWatched, cur);
    if(dur > 0){
      const pct = Math.min(100, Math.round((maxWatched/dur)*100));
      document.getElementById('vBar').style.width = pct+'%';
      const passed = cps.filter(c=>cpState[c.id]).length;
      document.getElementById('vStat').textContent = 'Đã xem: '+pct+'% ('+fmt(maxWatched)+'/'+fmt(dur)+')'+(cps.length?' • Neo: '+passed+'/'+cps.length:'');
      if(pct >= 80 && passed >= cps.length && !state.done[act.id]){ state.done[act.id]=true; syncScorm(); }
    }
  }

  if(ytId){
    function initYT(){
      ytPlayer = new YT.Player('ytMount', {
        videoId: ytId, width:'100%', height:'100%',
        events:{
          onStateChange:function(ev){
            if(ev.data === YT.PlayerState.PLAYING){
              if(pollId) clearInterval(pollId);
              pollId = setInterval(function(){
                if(!ytPlayer || !ytPlayer.getCurrentTime) return;
                onTick(ytPlayer.getCurrentTime(), ytPlayer.getDuration(), ()=>ytPlayer.pauseVideo(), (t)=>ytPlayer.seekTo(t,true), ()=>ytPlayer.playVideo());
              }, 800);
            } else if(ev.data === YT.PlayerState.ENDED){
              if(pollId) clearInterval(pollId);
              if(cps.every(c=>cpState[c.id])){ state.done[act.id]=true; document.getElementById('vBar').style.width='100%'; syncScorm(); }
            }
          }
        }
      });
    }
    if(window.YT && window.YT.Player) initYT();
    else {
      window.onYouTubeIframeAPIReady = initYT;
      var s = document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; document.head.appendChild(s);
    }
  } else {
    const v = document.getElementById('h5v');
    if(v){
      v.ontimeupdate = ()=>onTick(v.currentTime, v.duration, ()=>v.pause(), (t)=>{v.currentTime=t}, ()=>v.play());
      v.onended = ()=>{ if(cps.every(c=>cpState[c.id])){ state.done[act.id]=true; document.getElementById('vBar').style.width='100%'; syncScorm(); } };
    }
  }
}

function renderQuiz(act, stage){
  const qs = act.quizQuestions || [];
  const ans = state.quizAns[act.id] || (state.quizAns[act.id] = {});
  const submitted = !!state.quizDone[act.id];
  let left = (act.timeLimitMinutes || 15) * 60;

  function draw(){
    const done = !!state.quizDone[act.id];
    const score = state.scores[act.id];
    let html = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px"><div><h2 style="margin:0;font-size:18px">'+esc(act.title)+'</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b">'+qs.length+' câu • Điểm đạt: '+(act.passScore||5)+'/10</p></div>'
      + (!done ? '<div class="timer" id="qTimer">⏱ '+fmt(left)+'</div>' : '<span class="badge" style="background:#d1fae5;color:#065f46;font-size:14px">Điểm: '+score+'/10</span>') + '</div>';
    qs.forEach((q, qi)=>{
      html += '<div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px"><div style="font-weight:700;font-size:14px;margin-bottom:8px">Câu '+(qi+1)+': '+esc(q.question)+'</div>';
      (q.options||[]).forEach((opt, oi)=>{
        let cls = 'btn-opt';
        if(!done && ans[q.id] === oi) cls += ' selected';
        if(done){
          if(oi === q.correctAnswer) cls += ' correct';
          else if(ans[q.id] === oi) cls += ' wrong';
        }
        html += '<button class="'+cls+'" '+(done?'disabled':'')+' onclick="pickQ(\\''+act.id+'\\',\\''+q.id+'\\','+oi+')">'+['A','B','C','D'][oi]+'. '+esc(opt)+'</button>';
      });
      html += '</div>';
    });
    if(!done) html += '<button class="btn btn-ok" onclick="submitQ(\\''+act.id+'\\')">Nộp bài trắc nghiệm</button>';
    stage.innerHTML = html;
  }

  window.pickQ = function(aid, qid, oi){ state.quizAns[aid][qid] = oi; draw(); };
  window.submitQ = function(aid){
    if(quizTimerId){clearInterval(quizTimerId);quizTimerId=null;}
    const correct = qs.filter(q=>state.quizAns[aid][q.id]===q.correctAnswer).length;
    const sc = qs.length ? Number(((correct/qs.length)*10).toFixed(1)) : 10;
    state.scores[aid] = sc;
    state.quizDone[aid] = true;
    state.done[aid] = sc >= (act.passScore || 5);
    syncScorm();
    draw();
  };

  draw();
  if(!submitted){
    quizTimerId = setInterval(function(){
      left--;
      const t = document.getElementById('qTimer');
      if(t) t.textContent = '⏱ '+fmt(left);
      if(left <= 0) window.submitQ(act.id);
    }, 1000);
  }
}

function renderAssignment(act, stage){
  stage.innerHTML = '<h2 style="margin:0 0 8px;font-size:18px">'+esc(act.title)+'</h2>'
    + '<p style="color:#475569;font-size:13px">'+esc(act.assignmentPrompt || act.description || '')+'</p>'
    + (act.starterCode ? '<pre style="background:#0f172a;color:#7dd3fc;padding:14px;border-radius:10px;overflow:auto;font-size:12px">'+esc(act.starterCode)+'</pre>' : '')
    + (act.fileUrl ? '<p><a href="'+esc(act.fileUrl)+'" target="_blank" style="color:#0374b5;font-weight:700">📎 Mở tệp đề bài đính kèm</a></p>' : '')
    + '<button class="btn btn-ok" onclick="markDone(\\''+act.id+'\\')">'+(state.done[act.id]?'✓ Đã hoàn thành':'Xác nhận hoàn thành bài tập')+'</button>';
}

function renderDocument(act, stage){
  stage.innerHTML = '<h2 style="margin:0 0 8px;font-size:18px">'+esc(act.title)+'</h2>'
    + '<p style="color:#475569;font-size:13px">'+esc(act.description || '')+'</p>'
    + (act.fileUrl ? '<p><a class="btn" style="text-decoration:none;display:inline-block;margin-bottom:12px" href="'+esc(act.fileUrl)+'" target="_blank">📄 Mở tài liệu gốc</a></p>' : '')
    + '<button class="btn btn-ok" onclick="markDone(\\''+act.id+'\\')">'+(state.done[act.id]?'✓ Đã đọc xong':'Đánh dấu đã đọc tài liệu')+'</button>';
}

window.markDone = function(aid){ state.done[aid]=true; syncScorm(); selectItem(state.idx); };
selectItem(0);
syncScorm();
</script>
</body>
</html>`;
}

export function exportScorm12Zip(course: Course, module?: CourseModule | null, activity?: Activity | null) {
  const items: Activity[] = activity
    ? [activity]
    : module
      ? (module.activities || [])
      : (course.modules || []).flatMap(m => m.activities || []);

  if (items.length === 0) {
    alert('Chưa có học liệu nào bên trong để đóng gói SCORM 1.2. Hãy thêm ít nhất 1 Video, Quiz, Bài tập hoặc Tài liệu trước!');
    return;
  }

  const pkgTitle = activity?.title || module?.title || course.name;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://he-thong-lms.onrender.com';
  const manifestId = `LMS2_${safeSlug(pkgTitle)}_${Date.now()}`;

  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(manifestId)}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG_LMS2">
    <organization identifier="ORG_LMS2">
      <title>${escapeXml(pkgTitle)}</title>
      <item identifier="ITEM_1" identifierref="RES_1" isvisible="true">
        <title>${escapeXml(pkgTitle)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html" />
      <file href="scorm_api.js" />
    </resource>
  </resources>
</manifest>`;

  const html = buildScormPlayerHtml(pkgTitle, course.name, items, origin);
  const blob = createZipBlob([
    { name: 'imsmanifest.xml', content: manifestXml },
    { name: 'scorm_api.js', content: SCORM_API_JS },
    { name: 'index.html', content: html }
  ], 'application/zip');

  triggerDownload(blob, `${safeSlug(pkgTitle)}_SCORM_1.2.zip`);
}

// ====================== 5. IMS COMMON CARTRIDGE (.imscc) EXPORTER (CANVAS / MOODLE) ======================
export function exportImsccPackage(course: Course, module?: CourseModule | null) {
  const targetModules = module ? [module] : (course.modules || []);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://he-thong-lms.onrender.com';
  const pkgTitle = module ? `${course.code} - ${module.title}` : course.name;

  const entries: ZipEntry[] = [];
  const orgItemsXml: string[] = [];
  const resourcesXml: string[] = [];

  targetModules.forEach((mod, mIdx) => {
    const childItems: string[] = [];
    (mod.activities || []).forEach((act, aIdx) => {
      const resId = `RES_${mIdx + 1}_${aIdx + 1}`;
      const fileName = `resources/lesson_${mIdx + 1}_act_${aIdx + 1}.html`;
      const deepLink = buildShareLink({ courseId: course.id, moduleId: mod.id, activityId: act.id, embed: true });
      const fileHref = act.fileUrl?.startsWith('/') ? `${origin}${act.fileUrl}` : act.fileUrl;
      const vidHref = act.videoUrl?.startsWith('/') ? `${origin}${act.videoUrl}` : act.videoUrl;

      const pageHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${escapeHtml(act.title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#0f172a">
<h2>${escapeHtml(act.title)}</h2>
<p>${escapeHtml(act.description || '')}</p>
${act.assignmentPrompt ? `<div style="padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px"><strong>Đề bài:</strong><p>${escapeHtml(act.assignmentPrompt)}</p></div>` : ''}
${vidHref ? `<p><strong>Video gốc:</strong> <a href="${escapeHtml(vidHref)}" target="_blank">${escapeHtml(vidHref)}</a></p>` : ''}
${fileHref ? `<p><strong>Tài liệu đính kèm:</strong> <a href="${escapeHtml(fileHref)}" target="_blank">${escapeHtml(fileHref)}</a></p>` : ''}
<div style="margin-top:16px">${buildEmbedIframeCode(deepLink, act.title, 620)}</div>
</body></html>`;

      entries.push({ name: fileName, content: pageHtml });
      childItems.push(`        <item identifier="ITEM_${mIdx + 1}_${aIdx + 1}" identifierref="${resId}"><title>${escapeXml(act.title)}</title></item>`);
      resourcesXml.push(`    <resource identifier="${resId}" type="webcontent" href="${fileName}"><file href="${fileName}" /></resource>`);
    });

    orgItemsXml.push(`      <item identifier="MOD_${mIdx + 1}">\n        <title>${escapeXml(mod.title)}</title>\n${childItems.join('\n')}\n      </item>`);
  });

  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="IMSCC_${safeSlug(pkgTitle)}_${Date.now()}"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
  xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource"
  xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
    <lomimscc:lom><lomimscc:general><lomimscc:title><lomimscc:string language="vi">${escapeXml(pkgTitle)}</lomimscc:string></lomimscc:title></lomimscc:general></lomimscc:lom>
  </metadata>
  <organizations>
    <organization identifier="ORG_1" structure="rooted-hierarchy">
      <item identifier="ROOT">
${orgItemsXml.join('\n')}
      </item>
    </organization>
  </organizations>
  <resources>
${resourcesXml.join('\n')}
  </resources>
</manifest>`;

  entries.unshift({ name: 'imsmanifest.xml', content: manifestXml });
  const blob = createZipBlob(entries, 'application/zip');
  triggerDownload(blob, `${safeSlug(pkgTitle)}.imscc`);
}
