// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
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
    const ref = await addDoc(collection(db, "shops"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log('saveShop: created doc', ref.id);
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
    snapshot.forEach((doc) => shops.push({ id: doc.id, ...doc.data() }));

    return shops;
  } catch (err) {
    console.error('Failed to get shops:', err);
    return [];
  }
}

// حفظ تسجيل من النموذج
export async function saveRegistration(data) {
  try {
    const ref = await addDoc(collection(db, "registrations"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log('saveRegistration: created doc', ref.id);
    return true;
  } catch (err) {
    console.error('Failed to save registration:', err);
    return false;
  }
}

// جلب التسجيلات مرتبة بحسب الأحدث
export async function getRegistrations() {
  try {
    // حاول الاستعلام المرتب أولاً
    try {
      const q = query(collection(db, "registrations"), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const regs = [];
snapshot.forEach((doc) => regs.push({ id: doc.id, ...doc.data() }));

console.log("Registrations:", regs);

return regs;
    } catch (innerErr) {
      // قد يفشل الأمر إذا لم يوجد حقل createdAt في المستندات بعد، فالتراجع إلى جلبٍ بسيط
      console.warn('Ordered query failed, falling back to simple getDocs:', innerErr);
      const snapshot = await getDocs(collection(db, "registrations"));
      const regs = [];
      snapshot.forEach((doc) => regs.push({ id: doc.id, ...doc.data() }));
      console.log('getRegistrations: fetched', regs.length, 'items (fallback)');
      return regs;
    }
  } catch (err) {
    console.error('Failed to get registrations:', err);
    return [];
  }
}
// ==========================
// Comments Functions
// ==========================

export async function saveComment(data) {
  try {
    const ref = await addDoc(collection(db, "comments"), {
      ...data,
      createdAt: serverTimestamp()
    });

    console.log("Comment saved:", ref.id);
    return true;

  } catch (err) {
    console.error("Failed to save comment:", err);
    return false;
  }
}

export async function getComments(shopId) {
  try {
    const q = query(
      collection(db, "comments"),
      where("shopId", "==", shopId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const comments = [];

    snapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return comments;

  } catch (err) {
    console.error("Failed to get comments:", err);
    return [];
  }
}

// ================================
// ???? ??????? ????? ?????
// ================================
export async function getRatingStats(shopId) {

  try {

    const comments = await getComments(shopId);

    if (!Array.isArray(comments) || comments.length === 0) {
      return {
        average: 0,
        votes: 0
      };
    }

    const total = comments.reduce((sum, item) => {
      return sum + (Number(item.rating) || 0);
    }, 0);

    const votes = comments.length;
    const average = total / votes;

    return {
      average: Number(average.toFixed(1)),
      votes: votes
    };

  } catch (err) {

    console.error("Failed to get rating stats:", err);

    return {
      average: 0,
      votes: 0
    };

  }

}
