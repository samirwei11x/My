import { currentUser } from "./auth.js";

import {
    getUser,
    getGroup,
    sendMessage,
    listenMessages,
    chatId,
    chatExists,
    sendGroupMessage,
    listenGroupMessages
} from "./firestore.js";


// =====================
// Elements
// =====================

const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const userStatus = document.getElementById("userStatus");

const messages = document.getElementById("messages");
const message = document.getElementById("message");
const send = document.getElementById("send");
const back = document.getElementById("back");

const groupSettings =
    document.getElementById("groupSettings");


// =====================
// URL
// =====================

const params =
    new URLSearchParams(location.search);

const otherUid =
    params.get("uid");

const groupId =
    params.get("group");

const isGroup =
    groupId != null;


// =====================
// Check URL
// =====================

if (!otherUid && !groupId) {

    location.href = "home.html";

    throw new Error(
        "Missing uid or group"
    );

}


// =====================
// Variables
// =====================

let myUid = "";
let room = "";


// =====================
// Current User
// =====================

currentUser(async (user) => {

    if (!user) {

        location.href = "index.html";

        return;

    }

    myUid = user.uid;


    // =====================
    // GROUP CHAT
    // =====================

    if (isGroup) {

        room = groupId;

        try {

            const group =
                await getGroup(groupId);


            if (!group) {

                alert(
                    "الجروب غير موجود"
                );

                location.href =
                    "home.html";

                return;

            }


            // صورة الجروب

            userPhoto.src =
                group.photo ||
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(
                    group.name || "Group"
                );


            // اسم الجروب

            userName.innerText =
                group.name || "جروب";


            // الحالة

            userStatus.innerText =
                "Group Chat";


            // إظهار الإدارة للمالك فقط

            if (
                group.owner === myUid
            ) {

                groupSettings.style.display =
                    "block";

            }


            // تحميل الرسائل

            loadGroupMessages();

        } catch (error) {

            console.error(
                "Open group error:",
                error
            );

            alert(
                "تعذر فتح الجروب: " +
                error.message
            );

            location.href =
                "home.html";

        }

        return;

    }


    // =====================
    // PRIVATE CHAT
    // =====================

    room =
        chatId(
            myUid,
            otherUid
        );


    const exists =
        await chatExists(
            myUid,
            otherUid
        );


    if (!exists) {

        alert(
            "يجب قبول الطلب أولاً"
        );

        location.href =
            "home.html";

        return;

    }


    const other =
        await getUser(otherUid);


    if (!other) {

        alert(
            "المستخدم غير موجود"
        );

        location.href =
            "home.html";

        return;

    }


    userPhoto.src =
        other.photo || "";


    userName.innerText =
        other.username || "";


    userStatus.innerText =
        other.status || "offline";


    loadMessages();

});


// =====================
// Private Messages
// =====================

function loadMessages() {

    listenMessages(
        room,
        (list) => {

            messages.innerHTML = "";


            list.forEach((msg) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    msg.sender == myUid
                        ? "me"
                        : "other";


                let time = "";


                if (msg.createdAt) {

                    try {

                        const d =
                            msg.createdAt.toDate();


                        time =
                            d.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    } catch (e) {}

                }


                div.innerHTML = `

                    <div>
                        ${msg.text || ""}
                    </div>

                    <span class="time">
                        ${time}
                    </span>

                `;


                messages.appendChild(div);

            });


            messages.scrollTop =
                messages.scrollHeight;

        }
    );

}


// =====================
// Group Messages
// =====================

function loadGroupMessages() {

    listenGroupMessages(
        room,
        (list) => {

            messages.innerHTML = "";


            list.forEach((msg) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    msg.sender == myUid
                        ? "me"
                        : "other";


                let time = "";


                if (msg.createdAt) {

                    try {

                        time =
                            msg.createdAt
                                .toDate()
                                .toLocaleTimeString(
                                    [],
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    }
                                );

                    } catch (e) {}

                }


                div.innerHTML = `

                    <div>
                        ${msg.text || ""}
                    </div>

                    <span class="time">
                        ${time}
                    </span>

                `;


                messages.appendChild(div);

            });


            messages.scrollTop =
                messages.scrollHeight;

        }
    );

}


// =====================
// Send Message
// =====================

async function sendNow() {

    const text =
        message.value.trim();


    if (text === "") {
        return;
    }


    try {

        // =====================
        // GROUP
        // =====================

        if (isGroup) {

            await sendGroupMessage(
                room,
                {
                    sender: myUid,
                    text: text
                }
            );

        }


        // =====================
        // PRIVATE
        // =====================

        else {

            const exists =
                await chatExists(
                    myUid,
                    otherUid
                );


            if (!exists) {

                alert(
                    "المحادثة غير متاحة"
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


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        alert(
            error.code
                ? error.code +
                  "\n" +
                  error.message
                : error.message
        );

    }

}


// =====================
// Send Button
// =====================

send.onclick =
    sendNow;


// =====================
// Enter
// =====================

message.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {

            sendNow();

        }

    }
);


// =====================
// Back
// =====================

back.onclick = () => {

    location.href =
        "home.html";

};