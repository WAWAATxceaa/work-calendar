// =========================================================
// firebase-config.js
// ค่าคอนฟิกสำหรับเชื่อมต่อ Firebase Firestore & Authentication
// =========================================================
import { APPS_SCRIPT_URL } from "./config.js";

// ส่งออก APPS_SCRIPT_URL และ googleSheetsApiUrl
export { APPS_SCRIPT_URL };
export const googleSheetsApiUrl = APPS_SCRIPT_URL;

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
