import { auth } from "./firebase.js";

import {
    currentUser
} from "./auth.js";

import {
    getUser,
    updateUser,
    usernameExists
} from "./firestore.js";

const photo = document.getElementById("photo");
const name = document.getElementById("name");
const username = document.getElementById("username");
const save = document.getElementById("save");

let uid = "";

currentUser(async (user) => {

    if (!user) {

        location.href = "index.html";
        return;

    }

    uid = user.uid;

    const data = await getUser(uid);

    photo.src = data.photo;
    name.innerText = data.name;

});

save.onclick = async () => {

    const userName = username.value.trim().toLowerCase();

    if (userName.length < 4) {

        alert("اسم المستخدم يجب أن يكون 4 أحرف على الأقل");
        return;

    }

    const exists = await usernameExists(userName);

    if (exists) {

        alert("اسم المستخدم مستخدم بالفعل");
        return;

    }

    await updateUser(uid, {

        username: userName

    });

    location.href = "home.html";

};