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
  apiKey: "ضع_apiKey_هنا",
  authDomain: "ضع_authDomain_هنا",
  projectId: "ضع_projectId_هنا",
  storageBucket: "ضع_storageBucket_هنا",
  messagingSenderId: "ضع_messagingSenderId_هنا",
  appId: "ضع_appId_هنا"
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
