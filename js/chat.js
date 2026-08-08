import { currentUser } from "./auth.js";

import {
    getUser,
    sendMessage,
    listenMessages,
    chatId,
    chatExists,
    sendGroupMessage,
    listenGroupMessages
} from "./firestore.js";


// ============================
// Elements
// ============================

const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const userStatus = document.getElementById("userStatus");

const messages = document.getElementById("messages");
const message = document.getElementById("message");
const send = document.getElementById("send");
const back = document.getElementById("back");


// ============================
// URL Parameters
// ============================

const params = new URLSearchParams(window.location.search);

const otherUid = params.get("uid");
const groupId = params.get("group");

const isGroup = !!groupId;


// ============================
// Variables
// ============================

let myUid = "";
let room = "";


// ============================
// Current User
// ============================

currentUser(async (user) => {

    if (!user) {

        window.location.replace("index.html");

        return;

    }

    myUid = user.uid;


    // ============================
    // GROUP CHAT
    // ============================

    if (isGroup) {

        room = groupId;

        userPhoto.src =
            "https://ui-avatars.com/api/?name=Group";

        userName.innerText = "الجروب";

        userStatus.innerText = "Group Chat";

        loadGroupMessages();

        return;

    }


    // ============================
    // PRIVATE CHAT
    // ============================

    if (!otherUid) {

        window.location.replace("home.html");

        return;

    }


    room = chatId(myUid, otherUid);


    console.log("Opening chat:", {
        myUid,
        otherUid,
        room
    });


    // ============================
    // Check Chat
    // ============================

    try {

        const exists =
            await chatExists(myUid, otherUid);


        if (!exists) {

            console.error(
                "Chat does not exist:",
                {
                    myUid,
                    otherUid,
                    room
                }
            );

            alert(
                "المحادثة غير موجودة في Firestore"
            );

            return;

        }


        // ============================
        // Load Other User
        // ============================

        const other =
            await getUser(otherUid);


        if (!other) {

            alert("المستخدم غير موجود");

            return;

        }


        userPhoto.src =
            other.photo ||
            "https://ui-avatars.com/api/?name=User";

        userName.innerText =
            other.username ||
            other.name ||
            "مستخدم";

        userStatus.innerText =
            other.status ||
            "offline";


        loadMessages();

    } catch (error) {

        console.error(
            "Chat initialization error:",
            error
        );

        alert(
            "حدث خطأ أثناء فتح المحادثة"
        );

    }

});


// ============================
// Private Messages
// ============================

function loadMessages() {

    listenMessages(
        room,
        (list) => {

            messages.innerHTML = "";

            list.forEach((msg) => {

                const div =
                    document.createElement("div");


                div.className =
                    msg.sender === myUid
                        ? "me"
                        : "other";


                let time = "";


                if (msg.createdAt) {

                    try {

                        const date =
                            msg.createdAt.toDate();

                        time =
                            date.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    } catch (error) {

                        time = "";

                    }

                }


                div.innerHTML = `

                    <div>${escapeHTML(msg.text || "")}</div>

                    <span class="time">
                        ${time}
                    </span>

                `;


                messages.appendChild(div);

            });


            scrollMessages();

        }
    );

}


// ============================
// Group Messages
// ============================

function loadGroupMessages() {

    listenGroupMessages(
        room,
        (list) => {

            messages.innerHTML = "";


            list.forEach((msg) => {

                const div =
                    document.createElement("div");


                div.className =
                    msg.sender === myUid
                        ? "me"
                        : "other";


                let time = "";


                if (msg.createdAt) {

                    try {

                        const date =
                            msg.createdAt.toDate();

                        time =
                            date.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    } catch (error) {

                        time = "";

                    }

                }


                div.innerHTML = `

                    <div>${escapeHTML(msg.text || "")}</div>

                    <span class="time">
                        ${time}
                    </span>

                `;


                messages.appendChild(div);

            });


            scrollMessages();

        }
    );

}


// ============================
// Send Message
// ============================

async function sendNow() {

    const text =
        message.value.trim();


    if (!text) {

        return;

    }


    send.disabled = true;


    try {


        // ============================
        // Group
        // ============================

        if (isGroup) {

            await sendGroupMessage(
                room,
                {
                    sender: myUid,
                    text: text
                }
            );

        }


        // ============================
        // Private
        // ============================

        else {

            const exists =
                await chatExists(
                    myUid,
                    otherUid
                );


            if (!exists) {

                alert(
                    "المحادثة غير موجودة"
                );

                return;

            }


            await sendMessage(
                room,
                {
                    sender: myUid,
                    text: text
                }
            );

        }


        message.value = "";

        message.focus();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        alert(
            "حدث خطأ أثناء إرسال الرسالة"
        );

    } finally {

        send.disabled = false;

    }

}


// ============================
// Enter to Send
// ============================

message.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendNow();

        }

    }
);


// ============================
// Send Button
// ============================

send.addEventListener(
    "click",
    sendNow
);


// ============================
// Back
// ============================

back.addEventListener(
    "click",
    () => {

        window.location.replace(
            "home.html"
        );

    }
);


// ============================
// Scroll
// ============================

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;

}


// ============================
// Safe Text
// ============================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}
