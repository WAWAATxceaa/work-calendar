// =========================================================
// ระบบปฏิทินการปฏิบัติงาน — Node.js + Express Server
// server.js
// =========================================================

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── เส้นทางไฟล์ข้อมูล ──────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');
const DATA_FILE  = path.join(DATA_DIR, 'events.json');

// ── SSE Clients ─────────────────────────────────────────────
let sseClients = [];

// ── ข้อมูลตัวอย่างเริ่มต้น (สร้างอัตโนมัติเมื่อไม่มีไฟล์) ─
const INITIAL_DATA = {
  events: [
    { id:'ev-1', title:'ประชุมวางแผนโครงการประจำปี 2568',         type:'meet',  status:'done',  assignee:'head.it@school.ac.th', start:'2025-01-10', end:'2025-01-10', startTime:'09:00', endTime:'12:00', location:'ห้องประชุม 1',     detail:'ประชุมวางแผนงานประจำปีงบประมาณ 2568', updatedAt:'' },
    { id:'ev-2', title:'อบรมเชิงปฏิบัติการระบบ ERP องค์กร',        type:'teach', status:'done',  assignee:'staff1@school.ac.th',  start:'2025-01-20', end:'2025-01-22', startTime:'08:30', endTime:'16:30', location:'ห้องคอมพิวเตอร์ 3', detail:'อบรมหลักสูตรการใช้งานระบบ ERP สำหรับบุคลากรใหม่', updatedAt:'' },
    { id:'ev-3', title:'โครงการพัฒนาเว็บไซต์และพอร์ทัลสถาบัน',     type:'proj',  status:'doing', assignee:'staff1@school.ac.th',  start:'2025-02-01', end:'2025-03-31', startTime:'08:30', endTime:'16:30', location:'ฝ่ายสารสนเทศ IT',  detail:'ปรับปรุงโฉมและฟังก์ชันเว็บไซต์หลักของสถาบัน', updatedAt:'' },
    { id:'ev-4', title:'ประชุมคณะกรรมการบริหาร ประจำไตรมาส 1',    type:'meet',  status:'done',  assignee:'head.hr@school.ac.th', start:'2025-02-15', end:'2025-02-15', startTime:'13:00', endTime:'16:00', location:'ห้องประชุมใหญ่',   detail:'รายงานสรุปผลการดำเนินงานและเป้าหมายไตรมาสถัดไป', updatedAt:'' },
    { id:'ev-5', title:'อบรม Microsoft 365 เพื่อการทำงานร่วมกัน', type:'teach', status:'todo',  assignee:'staff2@school.ac.th',  start:'2025-03-10', end:'2025-03-12', startTime:'08:30', endTime:'12:00', location:'ห้องอบรม 2',       detail:'การใช้งาน Teams, OneDrive และ Forms เพื่อการทำงาน', updatedAt:'' },
    { id:'ev-6', title:'โครงการสำรวจความผูกพันและความพึงพอใจ',     type:'proj',  status:'todo',  assignee:'staff2@school.ac.th',  start:'2025-03-15', end:'2025-04-30', startTime:'',      endTime:'',      location:'ฝ่ายทรัพยากรบุคคล', detail:'จัดทำแบบสำรวจและประมวลผลข้อมูลความพึงพอใจบุคลากร', updatedAt:'' },
    { id:'ev-7', title:'ประชุมปฐมนิเทศผู้ปกครอง ภาคเรียนที่ 1/2568', type:'meet', status:'todo', assignee:'head.hr@school.ac.th', start:'2025-05-20', end:'2025-05-20', startTime:'14:00', endTime:'17:00', location:'หอประชุมใหญ่',     detail:'ชี้แจงแนวทางการเรียนการสอนและกฎระเบียบของสถาบัน', updatedAt:'' },
    { id:'ev-8', title:'อบรมการตระหนักรู้ด้านความปลอดภัยไซเบอร์', type:'teach', status:'doing', assignee:'head.it@school.ac.th', start:'2025-06-05', end:'2025-06-06', startTime:'09:00', endTime:'16:00', location:'ห้องประชุม 2',     detail:'หลักสูตร Cybersecurity Awareness สำหรับเจ้าหน้าที่ทุกฝ่าย', updatedAt:'' },
    { id:'ev-9', title:'โครงการจัดทำคลังข้อมูลและแฟ้มประวัติบุคคล', type:'proj', status:'doing', assignee:'staff1@school.ac.th', start:'2025-07-01', end:'2025-08-31', startTime:'08:30', endTime:'16:30', location:'ฝ่ายบุคคล HR',     detail:'แปลงเอกสารสู่ระบบดิจิทัลและจัดหมวดหมู่ข้อมูล', updatedAt:'' },
    { id:'ev-10',title:'กิจกรรมเฉลิมพระเกียรติวันแม่แห่งชาติ',     type:'other', status:'todo', assignee:'staff2@school.ac.th', start:'2025-08-12', end:'2025-08-12', startTime:'08:00', endTime:'12:00', location:'ลานอเนกประสงค์',   detail:'พิธีถวายพระพรชัยมงคลและกิจกรรมบำเพ็ญประโยชน์', updatedAt:'' }
  ],
  users: [
    { email:'admin@school.ac.th',   name:'ผู้ดูแลระบบ',    department:'IT', role:'admin' },
    { email:'head.it@school.ac.th', name:'หัวหน้าฝ่าย IT', department:'IT', role:'head'  },
    { email:'head.hr@school.ac.th', name:'หัวหน้าฝ่าย HR', department:'HR', role:'head'  },
    { email:'staff1@school.ac.th',  name:'นายสมชาย ใจดี',  department:'IT', role:'staff' },
    { email:'staff2@school.ac.th',  name:'นางสมหญิง รักดี', department:'HR', role:'staff' }
  ],
  holidays: [
    { date:'2025-01-01', name:'วันขึ้นปีใหม่',              type:'public' },
    { date:'2025-02-12', name:'วันมาฆบูชา',                  type:'public' },
    { date:'2025-04-06', name:'วันจักรี',                    type:'public' },
    { date:'2025-04-13', name:'วันสงกรานต์',                 type:'public' },
    { date:'2025-04-14', name:'วันสงกรานต์',                 type:'public' },
    { date:'2025-04-15', name:'วันสงกรานต์',                 type:'public' },
    { date:'2025-05-01', name:'วันแรงงานแห่งชาติ',           type:'public' },
    { date:'2025-05-05', name:'วันฉัตรมงคล',                 type:'public' },
    { date:'2025-05-12', name:'วันวิสาขบูชา',                type:'public' },
    { date:'2025-06-03', name:'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', type:'public' },
    { date:'2025-07-10', name:'วันอาสาฬหบูชา',              type:'public' },
    { date:'2025-07-11', name:'วันเข้าพรรษา',                type:'public' },
    { date:'2025-07-28', name:'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', type:'public' },
    { date:'2025-08-12', name:'วันแม่แห่งชาติ',              type:'public' },
    { date:'2025-10-13', name:'วันนวมินทรมหาราช',            type:'public' },
    { date:'2025-10-23', name:'วันปิยมหาราช',                type:'public' },
    { date:'2025-12-05', name:'วันพ่อแห่งชาติ',              type:'public' },
    { date:'2025-12-10', name:'วันรัฐธรรมนูญ',               type:'public' },
    { date:'2025-12-31', name:'วันสิ้นปี',                   type:'public' }
  ]
};

// =========================================================
// ฟังก์ชันจัดการไฟล์ข้อมูล
// =========================================================

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function readData() {
  ensureDirs();
  if (!fs.existsSync(DATA_FILE)) {
    writeData(INITIAL_DATA);
    console.log('📄 สร้างไฟล์ข้อมูลตั้งต้น data/events.json พร้อมข้อมูลตัวอย่าง');
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return {
      events:   Array.isArray(data.events)   ? data.events   : [],
      users:    Array.isArray(data.users)    ? data.users    : [],
      holidays: Array.isArray(data.holidays) ? data.holidays : []
    };
  } catch (err) {
    console.error('❌ อ่านไฟล์ข้อมูลล้มเหลว:', err.message);
    return { events: [], users: [], holidays: [] };
  }
}

/** เขียนไฟล์แบบปลอดภัย: เขียนไฟล์ชั่วคราวแล้ว rename */
function writeData(data) {
  ensureDirs();
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

/** สำรองข้อมูล data/backup/events-YYYYMMDD.json วันละครั้ง */
function dailyBackup() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const d = new Date();
    const tag = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const backupFile = path.join(BACKUP_DIR, `events-${tag}.json`);
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(DATA_FILE, backupFile);
      console.log(`💾 สำรองข้อมูลวันนี้: ${backupFile}`);
    }
  } catch (err) {
    console.error('⚠ สำรองข้อมูลล้มเหลว:', err.message);
  }
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// =========================================================
// SSE Broadcast — ส่งข้อมูลล่าสุดไปทุกเครื่องที่เชื่อมต่อ
// =========================================================

function broadcast() {
  const data = readData();
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter(res => {
    try { res.write(payload); return true; }
    catch (_) { return false; }
  });
}

// =========================================================
// Middleware
// =========================================================

// ป้องกัน Browser แคชไฟล์หน้าเว็บเก่า
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

// =========================================================
// API — Server-Sent Events (Real-time Stream)
// =========================================================

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // for nginx proxies
  res.flushHeaders();

  // ส่งข้อมูลปัจจุบันทันทีเมื่อเชื่อมต่อ
  const data = readData();
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  sseClients.push(res);
  console.log(`🔗 SSE client connected (total: ${sseClients.length})`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
    console.log(`🔌 SSE client disconnected (total: ${sseClients.length})`);
  });
});

// =========================================================
// API — Events (CRUD)
// =========================================================

app.get('/api/events', (req, res) => {
  const data = readData();
  res.json({ success: true, ...data });
});

app.post('/api/events', (req, res) => {
  try {
    const ev = req.body;
    if (!ev || !ev.id) return res.status(400).json({ success: false, error: 'ไม่พบ ID ของงาน' });

    const data = readData();
    ev.updatedAt = timestamp();
    const idx = data.events.findIndex(e => e.id === ev.id);
    if (idx !== -1) {
      data.events[idx] = { ...data.events[idx], ...ev };
    } else {
      data.events.push(ev);
    }

    writeData(data);
    dailyBackup();
    broadcast();
    res.json({ success: true, action: idx !== -1 ? 'updated' : 'created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/events/:id', (req, res) => {
  try {
    const data = readData();
    const before = data.events.length;
    data.events = data.events.filter(e => e.id !== req.params.id);
    if (data.events.length === before) {
      return res.status(404).json({ success: false, error: 'ไม่พบงานที่ต้องการลบ' });
    }

    writeData(data);
    dailyBackup();
    broadcast();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================
// API — Users (CRUD)
// =========================================================

app.get('/api/users', (req, res) => {
  const data = readData();
  res.json({ success: true, data: data.users });
});

app.post('/api/users', (req, res) => {
  try {
    const u = req.body;
    if (!u || !u.email) return res.status(400).json({ success: false, error: 'ไม่พบอีเมล' });

    const data = readData();
    const idx = data.users.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...u };
    } else {
      data.users.push(u);
    }

    writeData(data);
    broadcast();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:email', (req, res) => {
  try {
    const data = readData();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    data.users = data.users.filter(u => u.email.toLowerCase() !== email);

    writeData(data);
    broadcast();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================
// API — Holidays (CRUD)
// =========================================================

app.get('/api/holidays', (req, res) => {
  const data = readData();
  res.json({ success: true, data: data.holidays });
});

app.post('/api/holidays', (req, res) => {
  try {
    const h = req.body;
    if (!h || !h.date) return res.status(400).json({ success: false, error: 'ไม่พบวันที่' });

    const data = readData();
    const idx = data.holidays.findIndex(x => x.date === h.date);
    if (idx !== -1) {
      data.holidays[idx] = { ...data.holidays[idx], ...h };
    } else {
      data.holidays.push(h);
    }

    writeData(data);
    broadcast();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/holidays/:date', (req, res) => {
  try {
    const data = readData();
    data.holidays = data.holidays.filter(h => h.date !== req.params.date);

    writeData(data);
    broadcast();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================
// API — Export / Import CSV
// =========================================================

app.get('/api/export-csv', (req, res) => {
  const data = readData();
  const BOM = '\uFEFF';
  const header = ['id','title','type','status','assignee','start','end','startTime','endTime','location','detail','updatedAt'];
  const rows = [header.join(',')];

  data.events.forEach(ev => {
    const row = header.map(col => {
      const v = ev[col] !== undefined && ev[col] !== null ? String(ev[col]) : '';
      return `"${v.replace(/"/g, '""')}"`;
    });
    rows.push(row.join(','));
  });

  const csv = BOM + rows.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="events-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

app.post('/api/import-csv', (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) return res.status(400).json({ success: false, error: 'ไม่พบข้อมูล CSV' });

    // ลบ BOM ถ้ามี
    const clean = csvText.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ success: false, error: 'ไฟล์ CSV ว่างเปล่า' });

    // แยก header
    const headers = parseCSVLine(lines[0]);
    const idCol = headers.indexOf('id');
    if (idCol === -1) return res.status(400).json({ success: false, error: 'ไม่พบคอลัมน์ id ใน CSV' });

    const data = readData();
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (vals.length < headers.length) continue;

      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
      if (!obj.id) continue;

      obj.updatedAt = timestamp();
      const existing = data.events.findIndex(e => e.id === obj.id);
      if (existing !== -1) {
        data.events[existing] = { ...data.events[existing], ...obj };
      } else {
        data.events.push(obj);
      }
      count++;
    }

    writeData(data);
    dailyBackup();
    broadcast();
    res.json({ success: true, count, message: `นำเข้าสำเร็จ ${count} รายการ` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** แยกบรรทัด CSV ที่รองรับ double-quote */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// =========================================================
// เริ่มต้นเซิร์ฟเวอร์
// =========================================================

app.listen(PORT, '0.0.0.0', () => {
  readData(); // สร้างไฟล์ข้อมูลตั้งต้นถ้ายังไม่มี
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║   📅 ระบบปฏิทินการปฏิบัติงาน                    ║');
  console.log('  ║   Node.js Server — Real-time SSE              ║');
  console.log('  ╠═══════════════════════════════════════════════╣');
  console.log(`  ║   🟢  http://localhost:${PORT}                    ║`);
  console.log('  ║   📂  ข้อมูลจัดเก็บที่ data/events.json          ║');
  console.log('  ║   💾  สำรองอัตโนมัติที่ data/backup/              ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log('  💡 เปิดจากเครื่องอื่นในเครือข่ายเดียวกัน:');
  console.log(`     http://<IP ของเครื่องนี้>:${PORT}`);
  console.log('');
});
