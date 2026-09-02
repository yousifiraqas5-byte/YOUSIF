// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
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

// وعد يتحقق لما تكتمل عملية تسجيل الدخول المجهول، عشان نقدر نعرف هوية المستخدم قبل حفظ أي تقييم
let resolveAuthReady;
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

// تسجيل مجهول تلقائي للمستخدم لتمكين الكتابة من المتصفح (تأكد أن Anonymous مفعل في Console)
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous sign-in failed:', err);
  resolveAuthReady(null);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase anonymous signed in, uid =', user.uid);
  } else {
    console.log('Firebase auth: signed out');
  }
  resolveAuthReady(user);
});

// إرجاع هوية المستخدم الحالي (تنتظر اكتمال تسجيل الدخول المجهول إذا لم يكتمل بعد)
export async function getCurrentUid() {
  if (auth.currentUser) return auth.currentUser.uid;
  const user = await authReady;
  return user ? user.uid : null;
}

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
// اقتراح/ترشيح محل أو ورشة (بدون تسجيل رسمي)
// ==========================

export async function saveRecommendation(data) {
  try {
    const uid = await getCurrentUid();

    const ref = await addDoc(collection(db, "recommendations"), {
      ...data,
      uid: uid || null,
      createdAt: serverTimestamp()
    });

    console.log('saveRecommendation: created doc', ref.id);
    return true;
  } catch (err) {
    console.error('Failed to save recommendation:', err);
    return false;
  }
}

// ==========================
// Ratings Functions (تقييمات فقط - نجوم بدون نص)
// ==========================

export async function saveRating(shopId, ratingValue) {
  try {
    const uid = await getCurrentUid();

    if (!uid || !shopId) {
      console.error("Missing uid or shopId for rating");
      return false;
    }

    // فحص إذا كان هذا المستخدم قيّم نفس المحل من قبل - حذف التقييم القديم وحفظ الجديد
    const existingQuery = query(
      collection(db, "ratings"),
      where("shopId", "==", shopId),
      where("uid", "==", uid)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // حذف التقييم القديم
      for (const doc of existingSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
    }

    // حفظ التقييم الجديد
    const ref = await addDoc(collection(db, "ratings"), {
      shopId: shopId,
      uid: uid,
      rating: Number(ratingValue),
      createdAt: serverTimestamp()
    });

    console.log('Rating saved:', ref.id);
    return true;

  } catch (err) {
    console.error('Failed to save rating:', err);
    return false;
  }
}

export async function getRatings(shopId) {
  try {
    const q = query(
      collection(db, "ratings"),
      where("shopId", "==", shopId)
    );

    const snapshot = await getDocs(q);
    const ratings = [];

    snapshot.forEach((doc) => {
      ratings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return ratings;

  } catch (err) {
    console.error("Failed to get ratings:", err);
    return [];
  }
}

// ==========================
// Comments Functions (تعليقات منفصلة - نص فقط بدون نجوم)
// ==========================

export async function saveComment(shopId, commentText) {
  try {
    const uid = await getCurrentUid();

    const ref = await addDoc(collection(db, "commentsList"), {
      shopId: shopId,
      uid: uid || null,
      text: commentText,
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
      collection(db, "commentsList"),
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
// دوال إحصائية التقييم
// ================================
export async function getRatingStats(shopId) {
  try {
    const ratings = await getRatings(shopId);

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return {
        average: 0,
        votes: 0
      };
    }

    const total = ratings.reduce((sum, item) => {
      return sum + (Number(item.rating) || 0);
    }, 0);

    const votes = ratings.length;
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
