// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

// Firebase Auth
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firestore
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// =======================
// Firebase Config
// =======================

const firebaseConfig = {

    apiKey: "AIzaSyBJlFLNHaCja-qa3hujTi9j6HuLAQaNuvM",

    authDomain: "mychatwei1.firebaseapp.com",

    projectId: "mychatwei1",

    storageBucket: "mychatwei1.firebasestorage.app",

    messagingSenderId: "377344902958",

    appId: "1:377344902958:web:e9419fe797a21f96d7dcbf",

    measurementId: "G-9FXH5BCP4K"

};

// =======================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

const db = getFirestore(app);

// =======================

export {

    auth,

    provider,

    db,

    signInWithPopup,

    signOut,

    onAuthStateChanged

};