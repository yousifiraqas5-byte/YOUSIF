// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// ضع بيانات مشروعك هنا (تأكد أنها تطابق Project settings في Console)
const firebaseConfig = {
  apiKey: "AIzaSyAdGFdlWaYzYFmjWdJjfUPkD4ODtsfCTHM",
  authDomain: "yousif-4cc87.firebaseapp.com",
  projectId: "yousif-4cc87",
  storageBucket: "yousif-4cc87.appspot.com",
  messagingSenderId: "1088580081605",
  appId: "1:1088580081605:web:aa3983dbd53c84f7c69dac"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// تسجيل مجهول تلقائي للمستخدم لتمكين الكتابة من المتصفح (تأكد أن Anonymous مفعل في Console)
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous sign-in failed:', err);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase anonymous signed in, uid =', user.uid);
  } else {
    console.log('Firebase auth: signed out');
  }
});

const db = getFirestore(app);

// حفظ محل
export async function saveShop(data) {
  try {
    await addDoc(collection(db, "shops"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Failed to save shop:', err);
    return false;
  }
}

// قراءة جميع المحلات
export async function getShops() {
  try {
    const snapshot = await getDocs(collection(db, "shops"));

    const shops = [];
    snapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() });
    });

    return shops;
  } catch (err) {
    console.error('Failed to get shops:', err);
    return [];
  }
}

// حفظ تسجيل من النموذج
export async function saveRegistration(data) {
  try {
    await addDoc(collection(db, "registrations"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Failed to save registration:', err);
    return false;
  }
}

// جلب التسجيلات مرتبة بحسب الأحدث
export async function getRegistrations() {
  try {
    const q = query(collection(db, "registrations"), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const regs = [];
    snapshot.forEach((doc) => regs.push({ id: doc.id, ...doc.data() }));
    return regs;
  } catch (err) {
    console.error('Failed to get registrations:', err);
    return [];
  }
}
