# ระบบปฏิทินการปฏิบัติงาน (Real-time Cloud System)

เว็บแอปพลิเคชันระบบปฏิทินและกำหนดการปฏิบัติงานสำหรับองค์กร/สถาบัน ข้อมูลเป็น **Real-time ซิงก์ร่วมกันได้ทุกเครื่องทันที** รองรับการใช้งานพร้อมกันหลายอุปกรณ์ ภาษาไทยทั้งระบบ แสดงผลปีเป็น **พ.ศ.** รองรับมือถือ (Mobile-First) และโหมดมืด (Dark Mode)

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ผู้ใช้งาน / Client Devices                     │
│   (Browser 1: Chrome)      (Browser 2: Edge)            (มือถือ/แท็บเล็ต)  │
└────────────▲────────────────────────▲────────────────────────▲─────────┘
             │                        │                        │
             │   WebSocket Real-time  │  (onSnapshot)          │
             ▼                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ฐานข้อมูลหลัก: Firebase Firestore Database              │
│  - Collection "events": เก็บรายการงานและสถานะ พร้อม real-time sync     │
│  - Collection "users": เก็บบทบาท (admin, head, staff) และแผนกสังกัด    │
│  - Collection "holidays": เก็บวันหยุดราชการ/องค์กร                     │
│  - Security Rules: ควบคุมสิทธิ์การเข้าถึงข้อมูลตามบทบาทผู้ใช้          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Background Sync / On-demand
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              ฐานข้อมูลสำรอง & รายงาน: Google Sheets Database           │
│  - ชีต "Events" (คอลัมน์: id, title, type, status, assignee, start,   │
│                 end, startTime, endTime, location, detail, updatedAt)  │
│  - ชีต "Users" & "Holidays"                                           │
│  - Email Reminder Trigger: ส่งอีเมลแจ้งเตือนทุกเช้า 08:00 น.           │
│  - Google Apps Script Web App: JSON API รองรับการ Upsert & Import      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **ฐานข้อมูลหลัก (Primary DB):** Firebase Firestore (SDK v10 Modular ผ่าน CDN โดยตรง ไม่ต้อง build)
   - ใช้ `onSnapshot` เพื่อฟังการเปลี่ยนแปลงของ Collection `events` แบบ Real-time ทุกเครื่องและทุกเบราว์เซอร์จะเห็นการเพิ่ม แก้ไข เปลี่ยนสถานะ หรือลบงานทันทีโดยไม่ต้องกดรีเฟรชหน้าจอ
   - เพิ่ม/แก้ไข/เปลี่ยนสถานะ/ลบ ใช้ `setDoc`, `updateDoc` และ `deleteDoc` โดยตรงกับ Firestore
   - ติดตั้งข้อมูลตัวอย่างเริ่มต้น (Seed data) อัตโนมัติครั้งแรกเมื่อ Collection `events` ยังว่างอยู่เท่านั้น
   - เลิกใช้ `localStorage` และ `BroadcastChannel` เป็นแหล่งข้อมูลหลัก ข้อมูลทุกอย่างอยู่บน Cloud Firestore จริง

2. **ระบบยืนยันตัวตน (Authentication):**
   - Firebase Authentication (Google Sign-In) ด้วย `signInWithPopup`
   - จัดเก็บและตรวจสอบสิทธิ์ของผู้ใช้จาก Collection `users` ใน Firestore แบ่งเป็น 3 ระดับ: `admin` / `head` / `staff`

3. **ฐานข้อมูลสำรองและการซิงก์ (Secondary DB):** Google Sheets
   - เมื่อมีการสร้าง แก้ไข หรือเปลี่ยนสถานะงานใน Firestore สามารถส่งข้อมูลไปอัปเดตแถวในชีต `Events` ตาม `id` พร้อมบันทึกเวลา `updatedAt` อัตโนมัติ
   - มีปุ่ม **"นำเข้าจากชีต"** สำหรับ Admin เพื่ออ่านข้อมูลจากชีตแล้ว Upsert เข้าสู่ Firestore

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์

```
ระบบปฏิทินการปฏิบัติงาน/
├── index.html           ← Frontend Web App (Modular Firebase v10 SDK ผ่าน CDN, ไม่มี build step)
├── firebase-config.js   ← ไฟล์คอนฟิก Firebase (ใส่ apiKey, authDomain, projectId ฯลฯ)
├── firestore.rules      ← กฎความปลอดภัย Firestore ตามบทบาท RBAC
├── Code.gs              ← Google Apps Script Web App (API ซิงก์ Google Sheets & Email Trigger)
└── README.md            ← คู่มือการติดตั้ง ตั้งค่า และทดสอบอย่างละเอียด
```

---

## 🛠️ ขั้นตอนการติดตั้งและตั้งค่าทีละขั้น (Step-by-Step Setup)

### ขั้นตอนที่ 1: ตั้งค่า Firebase Project (Firestore & Authentication)

1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วคลิก **"Add project"** (เพิ่มโปรเจกต์)
2. ตั้งชื่อโปรเจกต์ เช่น `work-calendar-system` แล้วคลิก Continue จนสร้างโปรเจกต์เสร็จสิ้น
3. **เปิดใช้งาน Authentication:**
   - เมนูด้านซ้ายเลือก **Build → Authentication**
   - คลิกปุ่ม **Get started**
   - ที่แท็บ **Sign-in method** ให้เลือก **Google** → กด **Enable** → เลือกอีเมลฝ่ายสนับสนุนของโปรเจกต์ → กด **Save**
4. **เปิดใช้งาน Cloud Firestore:**
   - เมนูด้านซ้ายเลือก **Build → Firestore Database**
   - คลิกปุ่ม **Create database**
   - เลือก Location ใกล้เคียง (เช่น `asia-southeast1` สิงคโปร์)
   - เลือกเริ่มต้นด้วย **Production mode** (โหมดการใช้งานจริง) → กด Create
5. **ติดตั้ง Firestore Security Rules:**
   - ในหน้า Firestore ให้คลิกแท็บ **Rules** ด้านบน
   - นำโค้ดทั้งหมดจากไฟล์ `firestore.rules` ในโฟลเดอร์โปรเจกต์ไปวางแทนที่ของเดิม
   - คลิกปุ่ม **Publish** (เผยแพร่)
6. **คัดลอก Firebase Config:**
   - คลิกไอคอนรูปฟันเฟือง ⚙️ ข้าง Project Overview (มุมซ้ายบน) → เลือก **Project settings**
   - เลื่อนลงมาที่หัวข้อ **Your apps** → คลิกไอคอนเว็บ `</>`
   - ตั้งชื่อเล่นแอป เช่น `Work Calendar Web` → คลิก **Register app**
   - คัดลอกค่าคอนฟิก JavaScript Object ในส่วน `firebaseConfig`

---

### ขั้นตอนที่ 2: วางค่าคอนฟิกลงในไฟล์ `firebase-config.js`

เปิดไฟล์ `firebase-config.js` ในโฟลเดอร์โปรเจกต์ แล้วนำค่าที่คัดลอกมาวางลงในออบเจกต์ `firebaseConfig`:

```javascript
// firebase-config.js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};

// (ไม่บังคับ) หากต้องการซิงก์ข้อมูลลง Google Sheets ด้วย ให้นำ Web App URL ของ Apps Script มาวางที่นี่:
export const googleSheetsApiUrl = "";
```

> [!NOTE]
> เมื่อกรอก `firebase-config.js` เรียบร้อยแล้ว ตัวเว็บจะเชื่อมต่อกับ Firestore อัตโนมัติ และสถานะบนหัวหน้าเว็บจะแสดง **🟢 เชื่อมต่อฐานข้อมูลแล้ว** ทันที

---

### ขั้นตอนที่ 3: (ทางเลือกเสริม) ตั้งค่า Google Sheets & Apps Script

หากต้องการให้ระบบซิงก์ข้อมูลลง Google Sheets อัตโนมัติและส่งอีเมลแจ้งเตือนตอนเช้า:

1. ไปที่ [Google Sheets](https://sheets.google.com) แล้วสร้าง Spreadsheet ใหม่ ตั้งชื่อว่า **"ระบบปฏิทินการปฏิบัติงาน"**
2. คลิกเมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิมทั้งหมดใน `Code.gs` ออก แล้วนำโค้ดจากไฟล์ `Code.gs` ในโปรเจกต์นี้ไปวางแทนที่
4. กดปุ่ม **บันทึก (Ctrl+S)**
5. **สร้างข้อมูลตัวอย่างในชีต:**
   - ที่แถบเครื่องมือด้านบน เลือกฟังก์ชัน `initSampleData` แล้วคลิก **เรียกใช้ (Run)**
   - กดยอมรับสิทธิ์การเข้าถึง (Review permissions → Advanced → Go to unsafe → Allow)
   - ชีตจะถูกสร้าง 3 ชีตพร้อมหัวคอลัมน์: `Events`, `Users`, `Holidays`
6. **ตั้งค่า Email Trigger:**
   - เลือกฟังก์ชัน `setupTrigger` แล้วคลิก **เรียกใช้ (Run)** เพื่อเปิดระบบส่งอีเมลแจ้งเตือนงานใกล้ถึงกำหนดทุกเช้า 08:00 น.
7. **Deploy เป็น Web App:**
   - คลิก **ทำให้ใช้งานได้ (Deploy) → การทำให้ใช้งานได้รายการใหม่ (New deployment)**
   - เลือกประเภทเป็น **เว็บแอป (Web app)**
   - ตั้งค่า:
     - ดำเนินการในฐานะ: **ฉัน (Me)**
     - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
   - คลิก **ทำให้ใช้งานได้ (Deploy)**
   - คัดลอก **URL เว็บแอป (Web App URL)** ที่ลงท้ายด้วย `/exec` มาใส่ในตัวแปร `googleSheetsApiUrl` ในไฟล์ `firebase-config.js`

---

## 🧪 วิธีทดสอบการทำงาน Real-time ข้ามเบราว์เซอร์ (Chrome + Edge)

เพื่อให้มั่นใจว่าข้อมูลซิงก์หากันแบบ Real-time ข้ามเครื่องข้ามเบราว์เซอร์อย่างแท้จริง:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     หน้าต่างที่ 1: Google Chrome    │       │     หน้าต่างที่ 2: Microsoft Edge │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ 👤 ล็อกอินด้วย Google Account      │       │ 👤 ล็อกอินด้วย Google Account      │
│                                 │       │                                 │
│ 1. กดปุ่ม "+ เพิ่มงาน"           │       │ 2. เห็นงานปรากฏขึ้นบนปฏิทิน     │
│    พิมพ์ชื่องาน: "ทดสอบ Realtime" │──────▶│    ทันทีโดยไม่ต้องกดรีเฟรช!     │
│    กดบันทึก                     │       │                                 │
│                                 │       │ 3. กดเปลี่ยนสถานะงานนั้น        │
│ 4. สถานะงานเปลี่ยนเป็น "เสร็จแล้ว" │◀──────│    เป็น "เสร็จแล้ว"             │
│    บนหน้าจอทันทีในเสี้ยววินาที! │       │                                 │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

1. **เปิดหน้าต่าง 2 เบราว์เซอร์วางคู่กัน:**
   - หน้าต่างซ้าย: เปิดโปรแกรม **Google Chrome** แล้วเข้าสู่หน้าเว็บ
   - หน้าต่างขวา: เปิดโปรแกรม **Microsoft Edge** (หรือ Browser อื่น / โหมด Incognito) แล้วเข้าสู่หน้าเว็บ
2. **เข้าสู่ระบบ:**
   - คลิกปุ่ม **"เข้าสู่ระบบด้วย Google Account"** ในทั้งสองเบราว์เซอร์
   - สังเกตสถานะใต้หัวข้อแอปด้านซ้ายบนจะแสดง **🟢 เชื่อมต่อฐานข้อมูลแล้ว**
3. **ทดสอบเพิ่มงาน:**
   - ที่หน้าต่าง **Chrome**: คลิกปุ่ม **"+ เพิ่มงาน"** กรอกข้อมูลแล้วกด **💾 บันทึก**
   - **ผลลัพธ์:** ที่หน้าต่าง **Edge** การ์ดงานใหม่จะปรากฏขึ้นบนปฏิทินทันทีในเสี้ยววินาทีโดยไม่ต้องกด F5 หรือ Refresh!
4. **ทดสอบเปลี่ยนสถานะงานทันที:**
   - ที่หน้าต่าง **Edge**: คลิกที่การ์ดงานนั้น แล้วกดเปลี่ยนสถานะเป็น **"เสร็จแล้ว"**
   - **ผลลัพธ์:** ที่หน้าต่าง **Chrome** แถบงานจะขีดฆ่าและเปลี่ยนเป็นสีเขียวทันที
5. **ทดสอบลบงาน:**
   - กดปุ่ม **"ลบงาน"** จากหน้าต่างหนึ่ง อีกหน้าต่างจะเห็นงานหายไปทันที

---

## 🔒 กฎความปลอดภัย Firestore (Security Rules Explained)

ไฟล์ `firestore.rules` มีการแบ่งสิทธิ์ตามหลัก RBAC (Role-Based Access Control) ตามสิทธิ์ใน Collection `users`:

| บทบาท (Role) | การดูปฏิทิน (Read) | การสร้างงาน (Create) | การแก้ไข/ลบงาน (Update/Delete) | การจัดการระบบ |
|:---:|:---:|:---|:---|:---|
| 🧑‍💻 **Staff** | ดูงานทั้งหมดได้ | สร้างงานให้ตนเองได้ | แก้ไขและลบได้**เฉพาะงานที่ตนเองเป็นผู้รับผิดชอบ** (`assignee`) | - |
| 👔 **Head** | ดูงานทั้งหมดได้ | สร้างงานได้ | แก้ไขและลบงานของ**สมาชิกในแผนกเดียวกัน**ได้ | - |
| 👑 **Admin** | ดูงานทั้งหมดได้ | สร้างงานได้ทุกประเภท | จัดการได้**ทุกงาน ทุกแผนก** | จัดการรายชื่อผู้ใช้และวันหยุด |

---

## 🌐 การนำขึ้น GitHub Pages (Static Hosting)

โปรเจกต์นี้ใช้ Firebase JS SDK v10 Modular นำเข้าผ่าน CDN โดยตรง จึงเป็น Static Web App 100% ไม่จำเป็นต้องติดตั้ง Node.js หรือผ่านกระบวนการ Build ใดๆ ทั้งสิ้น:

1. Push โค้ดทั้งหมดขึ้น GitHub Repository:
   ```bash
   git add .
   git commit -m "feat: real-time firestore modular v10 and firebase-config"
   git push origin main
   ```
2. ไปที่หน้า GitHub Repository → ไปที่แท็บ **Settings → Pages**
3. ในหัวข้อ **Build and deployment**:
   - เลือก Source เป็น `Deploy from a branch`
   - เลือก Branch เป็น `main` และโฟลเดอร์ `/ (root)`
   - คลิกปุ่ม **Save**
4. **เพิ่ม Authorized Domain ใน Firebase:**
   - ไปที่ [Firebase Console](https://console.firebase.google.com/) → **Authentication → Settings → Authorized domains**
   - กด **Add domain** แล้วใส่โดเมนของ GitHub Pages (เช่น `<username>.github.io`)
5. เว็บแอปพลิเคชันจะออนไลน์พร้อมใช้งานแบบ Real-time ทุกเครื่องทั่วโลกทันทีครับ!
