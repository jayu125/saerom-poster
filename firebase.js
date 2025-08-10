// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics

// Add Firebase products that you want to use
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  getDocs,
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1cIccZ-ByfVcAzTGkemdaK-SnRw-0HzI",
  authDomain: "poster-sharing.firebaseapp.com",
  projectId: "poster-sharing",
  storageBucket: "poster-sharing.firebasestorage.app",
  messagingSenderId: "596320829526",
  appId: "1:596320829526:web:b6f560e54f731dab46bbf7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function getPosters() {
  let postersArr = [];
  const querySnapshot = await getDocs(collection(db, "posters"));
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    postersArr.push(doc.data());
  });
  return postersArr;
}

export async function handleGoogleSign() {
  const provider = new GoogleAuthProvider();

  setPersistence(auth, browserLocalPersistence)
    .then(async () => {
      await signInWithPopup(auth, provider).then((data) => {
        if (auth.currentUser.email.endsWith("@saerom.hs.kr")) {
          window.location.assign("/index.html");
        } else {
          alert(
            "학교 이메일 (@saerom.hs.kr 로 끝나는 이메일) 로 로그인해주세요!"
          );
          signOutFirebase();
        }
      });
    })
    .then((result) => {
      console.log("로그인 성공");
    })
    .catch((error) => {
      console.error("오류 발생:", error);
    });
}

export async function isLoggedIn(loggedInCallback, notLoggedInCallback) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loggedInCallback();
    } else {
      notLoggedInCallback();
    }
  });
}

export async function addPoster(posterInfo) {
  const currentTimeNow = Date.now();
  try {
    await setDoc(doc(db, "posters", `${currentTimeNow}`), {
      createdAt: serverTimestamp(),
      docId: currentTimeNow,
      author: {
        displayName: auth.currentUser.displayName,
        email: auth.currentUser.email,
      },
      badge: posterInfo.badge,
      category: posterInfo.category,
      desc: posterInfo.desc,
      img: posterInfo.img,
      meta: posterInfo.meta,
      title: posterInfo.title,
    });
  } catch (err) {
    console.log("addPoster 함수에서 에러 발생! 에러 메세지 : ", err);
  }
}

export async function deletePoster(posterId) {
  try {
    await deleteDoc(doc(db, "posters", posterId));
  } catch (err) {
    console.log(err);
  } finally {
    window.location.reload();
  }
}

export function signOutFirebase() {
  try {
    auth.signOut();
  } catch (err) {
    console.log(err);
  } finally {
    window.location.reload();
  }
}
