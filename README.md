# ChatWeb — Real-Time Chat Application 🚀

تطبيق محادثة فورية متكامل (Full-Stack MERN + Socket.IO + WebRTC) يدعم المحادثات الفردية والجماعية والمكالمات الصوتية مع تصميم مظلم عصري.

---

## 🌟 الميزات المكتملة (Features)

- 🔒 **نظام المصادقة والأمان (Authentication)**: تسجيل جديد، تسجيل دخول، تسجيل خروج، JWT عبر HTTP-Only Cookies، تشفير كلمات المرور باستخدام `bcryptjs`.
- 💬 **محادثات فورية (Real-Time 1-to-1 Chat)**: إرسال واستقبال الرسائل فورياً باستخدام `Socket.IO`.
- 👥 **محادثات جماعية (Group Chat)**: إنشاء مجموعات، إضافة/إزالة أعضاء، صلاحيات الأدمن، مغادرة المجموعات.
- 📞 **مكالمات صوتية (Voice Calls WebRTC)**: مكالمات صوتية مباشرة P2P باستخدام `simple-peer` مع شاشة اتصال متقدمة ومودال للمكالمات الواردة.
- 🟢 **حالة الاتصال (Online / Offline Status)**: مؤشر أخضر لحظي للمستخدمين المتصلين وقائمة المستخدمين النشطين.
- ⌨️ **مؤشر الكتابة (Typing Indicator)**: إشعار لحظي عند كتابة الطرف الآخر للرسالة.
- 🖼️ **إرسال الصور (Image Uploads)**: دعم رفع الصور عبر `Cloudinary` ومعاينتها قبل الإرسال.
- 🔔 **إشعارات صوتية (Web Audio Chimes)**: نغمة رنين عند وصول مكالمة واردة، وصوت تنبيه لطيف عند وصول رسالة جديدة.
- 🎨 **السمات والتخصيص (Themes)**: دعم أكثر من 14 سمة جاهزة (Night, Winter, Synthwave, Cyberpunk, Forest, etc.) مع حفظ السمة في المتصفح.

---

## 🛠️ بنية المشروع (Structure)

```
chatweb/
├── backend/                  # خادم Express + Socket.IO + Mongoose
│   ├── src/
│   │   ├── controllers/      # auth, message, group
│   │   ├── middleware/       # auth.middleware (JWT)
│   │   ├── models/           # User, Conversation, Message
│   │   ├── routes/           # auth, message, group
│   │   ├── lib/              # db, cloudinary, socket, utils
│   │   └── index.js          # نقطة انطلاق السيرفر
│   └── .env                  # إعدادات البيئة
├── frontend/                 # واجهة React + Vite + Tailwind + DaisyUI
│   ├── src/
│   │   ├── components/       # chat, sidebar, group, call, common
│   │   ├── pages/            # Home, Login, Register, Profile, Settings
│   │   ├── store/            # useAuthStore, useChatStore, useGroupStore, useCallStore, useThemeStore
│   │   └── lib/              # axios, sound, utils
└── package.json              # تشغيل الـ Frontend والـ Backend معاً
```

---

## 🚀 طريقة التشغيل (How to Run)

### 1. التأكد من تشغيل MongoDB محلياً
تأكد من أن خدمة MongoDB تعمل على جهازك على المنفذ الافتراضي `27017` (تم التأكد من عملها بنجاح).

### 2. تشغيل المشروع بأمر واحد:
من المجلد الرئيسي `c:\Users\Abdo Elemam\Desktop\chatweb`:
```bash
npm run dev
```
سيبدأ الخادمين معاً:
- **Backend**: `http://localhost:5001`
- **Frontend**: `http://localhost:5173`

### أو تشغيل كل طرف بشكل منفصل:

**تشغيل الـ Backend:**
```bash
cd backend
npm start
```

**تشغيل الـ Frontend:**
```bash
cd frontend
npm run dev
```

افتح المتصفح على: **`http://localhost:5173`** للبدء! 🎉
