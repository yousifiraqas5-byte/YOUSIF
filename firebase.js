import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, where, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdGFdlWaYzYFmjWdJjfUPkD4ODtsfCTHM",
  authDomain: "yousif-4cc87.firebaseapp.com",
  projectId: "yousif-4cc87",
  storageBucket: "yousif-4cc87.firebasestorage.app",
  messagingSenderId: "1088580081605",
  appId: "1:1088580081605:web:aa3983dbd53c84f7c69dac",
  measurementId: "G-F4NECXGTCV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve(user);
    else signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(() => resolve(null));
  });
});

export async function getCurrentUid() {
  if (auth.currentUser) return auth.currentUser.uid;
  const user = await authReady;
  return user ? user.uid : null;
}

export async function getRegistrations() {
  try {
    const snapshot = await getDocs(collection(db, "registrations"));
    const all = [];
    snapshot.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
    return all;
  } catch (err) {
    console.error("getRegistrations error:", err);
    return [];
  }
}

export async function getComments(shopId) {
  try {
    const snapshot = await getDocs(collection(db, "comments"));
    const all = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      if (d.shopId === shopId) all.push({ id: doc.id, ...d });
    });
    return all;
  } catch (err) {
    return [];
  }
}

export async function getAllComments() {
  try {
    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const all = [];
    snapshot.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
    return all;
  } catch (err) {
    return [];
  }
}

export async function saveComment(data) {
  try {
    const uid = await getCurrentUid();
    await addDoc(collection(db, "comments"), {
      shopId: data.shopId,
      comment: data.comment,
      name: data.name || "",
      uid: uid || "",
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("saveComment error:", err);
    return false;
  }
}

export async function saveRegistration(data) {
  try {
    await addDoc(collection(db, "registrations"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("saveRegistration error:", err);
    return false;
  }
}

export async function saveRating(data) {
  try {
    const uid = await getCurrentUid();
    if (!uid) return false;
    const docId = `${uid}_${data.shopId}`;
    await setDoc(doc(db, "ratings", docId), {
      shopId: data.shopId,
      rating: data.rating,
      uid: uid,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("saveRating error:", err);
    return false;
  }
}

export async function getRatings(shopId) {
  try {
    const snapshot = await getDocs(collection(db, "ratings"));
    const all = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.shopId === shopId) all.push({ id: docSnap.id, ...d });
    });
    return all;
  } catch (err) {
    return [];
  }
}

export async function getUserRating(shopId) {
  try {
    const uid = await getCurrentUid();
    if (!uid) return null;
    const docId = `${uid}_${shopId}`;
    const snap = await getDoc(doc(db, "ratings", docId));
    if (!snap.exists()) return null;
    return snap.data().rating || null;
  } catch (err) {
    return null;
  }
}

export async function saveShop(data) {
  try {
    await addDoc(collection(db, "shops"), { ...data, createdAt: serverTimestamp() });
    return true;
  } catch (err) {
    return false;
  }
}

export async function getShops() {
  try {
    const snapshot = await getDocs(collection(db, "shops"));
    const all = [];
    snapshot.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
    return all;
  } catch (err) {
    return [];
  }
}

export async function saveRecommendation(data) {
  try {
    await addDoc(collection(db, "recommendations"), { ...data, createdAt: serverTimestamp() });
    return true;
  } catch (err) {
    return false;
  }
}

export async function setShopLike(shopId, value) {
  try {
    const uid = await getCurrentUid();
    if (!uid) return false;
    const docId = `${uid}_${shopId}`;
    if (value === 0) {
      await deleteDoc(doc(db, "likes", docId));
    } else {
      await setDoc(doc(db, "likes", docId), {
        shopId, uid, value, createdAt: serverTimestamp()
      });
    }
    return true;
  } catch (err) {
    console.error("setShopLike error:", err);
    return false;
  }
}

export async function getShopLikes(shopId) {
  try {
    const snapshot = await getDocs(collection(db, "likes"));
    let likes = 0, dislikes = 0, myValue = 0;
    const uid = await getCurrentUid();
    const myDocId = uid ? `${uid}_${shopId}` : null;
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.shopId !== shopId) return;
      if (data.value === 1) likes++;
      else if (data.value === -1) dislikes++;
      if (myDocId && d.id === myDocId) myValue = data.value;
    });
    return { likes, dislikes, myValue };
  } catch (err) {
    return { likes: 0, dislikes: 0, myValue: 0 };
  }
}
