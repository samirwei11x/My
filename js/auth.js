import {
    auth,
    provider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "./firebase.js";

import {
    createUser,
    getUser,
    setStatus
} from "./firestore.js";

// ============================
// Login With Google
// ============================

export async function loginGoogle() {

    try {

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        let data = await getUser(user.uid);

        if (!data) {

            await createUser(user.uid, {

                uid: user.uid,

                email: user.email,

                name: user.displayName,

                photo: user.photoURL,

                username: "",

                bio: "مرحباً بك فى MyChat 👋",

                status: "online",

                lastSeen: Date.now(),

                createdAt: Date.now()

            });

            window.location.replace("/username.html");
            return;

        }

        await setStatus(user.uid, "online");

        if (!data.username) {

            window.location.replace("/username.html");

        } else {

            window.location.replace("/home.html");

        }

    } catch (e) {

        console.error(e);

        alert("حدث خطأ أثناء تسجيل الدخول");

    }

}

// ============================
// Logout
// ============================

export async function logout() {

    if (auth.currentUser) {

        await setStatus(auth.currentUser.uid, "offline");

    }

    await signOut(auth);

    window.location.replace("/index.html");

}

// ============================
// Current User
// ============================

export function currentUser(callback) {

    onAuthStateChanged(auth, async(user) => {

        if (user) {

            await setStatus(user.uid, "online");

        }

        callback(user);

    });

}

// ============================
// Auto Offline
// ============================

window.addEventListener("beforeunload", async() => {

    if (auth.currentUser) {

        await setStatus(auth.currentUser.uid, "offline");

    }

});
