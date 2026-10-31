// =========================================================
// firebase-config.js
// ค่าคอนฟิกสำหรับเชื่อมต่อ Firebase Firestore & Authentication
// =========================================================

// นำค่า configuration ที่ได้จาก Firebase Console มาวางที่นี่:
// (Firebase Console -> Project Settings -> General -> Your apps -> Web app)
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// (ไม่บังคับ) หากต้องการซิงก์ข้อมูลลง Google Sheets ด้วย ให้นำ Web App URL ของ Google Apps Script มาวางที่นี่:
export const googleSheetsApiUrl = "";
