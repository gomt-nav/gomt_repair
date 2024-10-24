// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
// 引入 Firestore 庫
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJhKP4APZJqUnZzACj9EiAcyuhwgr3wgE",
  authDomain: "gomt-9518e.firebaseapp.com",
  projectId: "gomt-9518e",
  storageBucket: "gomt-9518e.appspot.com",
  messagingSenderId: "169885183614",
  appId: "1:169885183614:web:f9d0c9d5ff8224f74a722f",
  measurementId: "G-DTTTWQ7BZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase 已成功初始化", app);

const analytics = getAnalytics(app);
console.log("Firebase Analytics 已成功初始化");

const firestoreDB = getFirestore(app);
console.log("Firestore 已成功初始化", firestoreDB);

// 匯出 Firebase App 和 Firestore
export { app, firestoreDB }; 
