const firebaseConfig = {
  apiKey: "AIzaSyCAEq7JcwG6q1nyh554FVufzTS_TLrHcmY",
  authDomain: "campusconnect-eead9.firebaseapp.com",
  projectId: "campusconnect-eead9",
  storageBucket: "campusconnect-eead9.firebasestorage.app",
  messagingSenderId: "1060381987364",
  appId: "1:1060381987364:web:836268d87274abc295beb1",
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
console.log(app, auth, db);
