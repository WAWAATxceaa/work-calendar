// =========================================================
// public/config.js
// การตั้งค่า Google Apps Script Web App
// =========================================================

// นำ URL ที่ได้จาก Google Apps Script (Deploy -> New deployment -> Web app)
// ต้องตรวจสอบว่า:
// 1. Execute as: Me
// 2. Who has access: Anyone (ทุกคน)
// 3. URL ต้องลงท้ายด้วย /exec เท่านั้น (ห้ามใช้ /dev)
// ตัวอย่าง: "https://script.google.com/macros/s/AKfycbyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec"
const APPS_SCRIPT_URL = "";

if (typeof window !== 'undefined') {
  window.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
}
