// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ضع بيانات مشروعك هنا
const firebaseConfig = {
  apiKey: "AIzaSyAdGFdlWaYzYFmjWdJjfUPkD4ODtsfCTHM",
  authDomain: "yousif-4cc87.firebaseapp.com",
  projectId: "yousif-4cc87",
  storageBucket: "yousif-4cc87.firebasestorage.app",
  messagingSenderId: "1088580081605",
  appId: "1:1088580081605:web:aa3983dbd53c84f7c69dac"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// حفظ محل
export async function saveShop(data) {
  await addDoc(collection(db, "shops"), {
    ...data,
    createdAt: serverTimestamp()
  });
}

// قراءة جميع المحلات
export async function getShops() {
  const snapshot = await getDocs(collection(db, "shops"));

  const shops = [];

  snapshot.forEach((doc) => {
    shops.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return shops;
}
