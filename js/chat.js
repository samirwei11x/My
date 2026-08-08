import { currentUser } from "./auth.js";

import {
    getUser,
    sendMessage,
    listenMessages,
    chatId,
    chatExists,
    sendGroupMessage,
    listenGroupMessages,
    deleteMessage
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


// زر الحظر
const blockButton =
    document.getElementById("blockUser");


// ============================
// URL Parameters
// ============================

const params =
    new URLSearchParams(
        window.location.search
    );

const otherUid =
    params.get("uid");

const groupId =
    params.get("group");


// ============================
// Check URL
// ============================

if (!otherUid && !groupId) {

    document.body.innerHTML = `

        <div style="
            padding:40px;
            direction:rtl;
            text-align:center;
            font-family:Arial;
        ">

            <h2>❌ لم يتم تحديد المحادثة</h2>

            <p>
                لم يتم إرسال UID أو Group ID.
            </p>

            <button
                onclick="history.back()"
            >
                رجوع
            </button>

        </div>

    `;

    throw new Error(
        "Missing chat UID or group ID"
    );
}


const isGroup =
    !!groupId;


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

        console.log(
            "CHAT: user is null"
        );

        alert(
            "المستخدم غير مسجل الدخول"
        );

        return;
    }


    myUid =
        user.uid;


    // ============================
    // GROUP
    // ============================

    if (isGroup) {

        room =
            groupId;


        if (userPhoto) {

            userPhoto.src =
                "https://ui-avatars.com/api/?name=Group";

        }


        if (userName) {

            userName.innerText =
                "الجروب";

        }


        if (userStatus) {

            userStatus.innerText =
                "Group Chat";

        }


        // إخفاء الحظر في الجروبات
        if (blockButton) {

            blockButton.style.display =
                "none";

        }


        loadGroupMessages();

        return;
    }


    // ============================
    // PRIVATE CHAT
    // ============================

    if (!otherUid) {

        window.location.replace(
            "home.html"
        );

        return;
    }


    room =
        chatId(
            myUid,
            otherUid
        );


    console.log(
        "Opening chat:",
        {
            myUid,
            otherUid,
            room
        }
    );


    try {

        // ============================
        // Check Chat
        // ============================

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


        // ============================
        // Other User
        // ============================

        const other =
            await getUser(
                otherUid
            );


        if (!other) {

            alert(
                "المستخدم غير موجود"
            );

            return;
        }


        if (userPhoto) {

            userPhoto.src =
                other.photo ||
                "https://ui-avatars.com/api/?name=User";

        }


        if (userName) {

            userName.innerText =
                other.username ||
                other.name ||
                "مستخدم";

        }


        if (userStatus) {

            userStatus.innerText =
                other.status ||
                "offline";

        }


        // ============================
        // Block Button
        // ============================

        if (blockButton) {

            blockButton.style.display =
                "block";


            blockButton.innerText =
                "🚫 حظر";


            blockButton.onclick =
                () => {

                    blockUser();

                };

        }


        // ============================
        // Load Messages
        // ============================

        loadMessages();


    } catch (error) {

        console.error(
            "Chat initialization error:",
            error
        );


        if (
            error?.code ===
            "permission-denied"
        ) {

            alert(
                "ليس لديك صلاحية للوصول إلى هذه المحادثة.\n\nراجع Firestore Security Rules."
            );

        } else {

            alert(
                "حدث خطأ أثناء فتح المحادثة:\n" +
                error.message
            );

        }

    }

});


// ============================
// Load Private Messages
// ============================

function loadMessages() {

    if (!messages) {
        return;
    }


    listenMessages(
        room,
        (list) => {

            messages.innerHTML =
                "";


            list.forEach(
                (msg) => {

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        msg.sender === myUid
                            ? "me"
                            : "other";


                    let time =
                        "";


                    if (
                        msg.createdAt
                    ) {

                        try {

                            const date =
                                msg.createdAt.toDate();


                            time =
                                date.toLocaleTimeString(
                                    "ar-EG",
                                    {
                                        hour:
                                            "2-digit",

                                        minute:
                                            "2-digit"
                                    }
                                );

                        } catch {

                            time =
                                "";

                        }

                    }


                    const text =
                        escapeHTML(
                            msg.text || ""
                        );


                    div.innerHTML = `

                        <div class="message-text">
                            ${text}
                        </div>

                        <span class="time">
                            ${time}
                        </span>

                    `;


                    // ============================
                    // Delete My Message
                    // ============================

                    if (
                        msg.sender === myUid
                    ) {

                        const deleteBtn =
                            document.createElement(
                                "button"
                            );


                        deleteBtn.className =
                            "delete-message";


                        deleteBtn.innerText =
                            "حذف";


                        deleteBtn.type =
                            "button";


                        deleteBtn.onclick =
                            async () => {

                                await deleteMyMessage(
                                    msg.id
                                );

                            };


                        div.appendChild(
                            deleteBtn
                        );

                    }


                    messages.appendChild(
                        div
                    );

                }
            );


            scrollMessages();

        }
    );

}


// ============================
// Load Group Messages
// ============================

function loadGroupMessages() {

    if (!messages) {
        return;
    }


    listenGroupMessages(
        room,
        (list) => {

            messages.innerHTML =
                "";


            list.forEach(
                (msg) => {

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        msg.sender === myUid
                            ? "me"
                            : "other";


                    let time =
                        "";


                    if (
                        msg.createdAt
                    ) {

                        try {

                            const date =
                                msg.createdAt.toDate();


                            time =
                                date.toLocaleTimeString(
                                    "ar-EG",
                                    {
                                        hour:
                                            "2-digit",

                                        minute:
                                            "2-digit"
                                    }
                                );

                        } catch {

                            time =
                                "";

                        }

                    }


                    div.innerHTML = `

                        <div class="message-text">
                            ${escapeHTML(
                                msg.text || ""
                            )}
                        </div>

                        <span class="time">
                            ${time}
                        </span>

                    `;


                    // حذف رسالة العضو نفسه
                    if (
                        msg.sender === myUid
                    ) {

                        const deleteBtn =
                            document.createElement(
                                "button"
                            );


                        deleteBtn.className =
                            "delete-message";


                        deleteBtn.innerText =
                            "حذف";


                        deleteBtn.type =
                            "button";


                        deleteBtn.onclick =
                            async () => {

                                await deleteGroupMessage(
                                    msg.id
                                );

                            };


                        div.appendChild(
                            deleteBtn
                        );

                    }


                    messages.appendChild(
                        div
                    );

                }
            );


            scrollMessages();

        }
    );

}


// ============================
// Send Message
// ============================

async function sendNow() {

    if (!message) {
        return;
    }


    const text =
        message.value.trim();


    if (!text) {
        return;
    }


    if (send) {

        send.disabled =
            true;

    }


    try {

        // ============================
        // Group
        // ============================

        if (isGroup) {

            await sendGroupMessage(
                room,
                {
                    sender:
                        myUid,

                    text:
                        text
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
                    sender:
                        myUid,

                    text:
                        text
                }
            );

        }


        message.value =
            "";


        message.focus();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );


        if (
            error?.code ===
            "permission-denied"
        ) {

            alert(
                "ليس لديك صلاحية لإرسال الرسائل."
            );

        } else {

            alert(
                "حدث خطأ أثناء إرسال الرسالة:\n" +
                error.message
            );

        }

    } finally {

        if (send) {

            send.disabled =
                false;

        }

    }

}


// ============================
// Delete Private Message
// ============================

async function deleteMyMessage(
    messageId
) {

    if (!messageId) {
        return;
    }


    const confirmed =
        confirm(
            "هل تريد حذف هذه الرسالة؟"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteMessage(
            room,
            messageId
        );


    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );


        if (
            error?.code ===
            "permission-denied"
        ) {

            alert(
                "ليس لديك صلاحية حذف الرسالة."
            );

        } else {

            alert(
                "فشل حذف الرسالة:\n" +
                error.message
            );

        }

    }

}


// ============================
// Delete Group Message
// ============================

async function deleteGroupMessage(
    messageId
) {

    if (!messageId) {
        return;
    }


    const confirmed =
        confirm(
            "هل تريد حذف هذه الرسالة؟"
        );


    if (!confirmed) {
        return;
    }


    try {

        // firestore.js الحالي عندك
        // لا يحتوي على deleteGroupMessage
        // لذلك ننبه المستخدم

        alert(
            "حذف رسائل الجروبات يحتاج إضافة دالة deleteGroupMessage في firestore.js."
        );

    } catch (error) {

        console.error(
            error
        );

    }

}


// ============================
// Block User
// ============================

async function blockUser() {

    if (!otherUid) {
        return;
    }


    const confirmed =
        confirm(
            "هل تريد حظر هذا المستخدم؟"
        );


    if (!confirmed) {
        return;
    }


    /*
        ملاحظة:

        firestore.js الحالي عندك
        لا يحتوي على نظام الحظر.

        لذلك لن نحاول استدعاء
        isUserBlocked أو blockUser
        لأنها غير موجودة حالياً.
    */

    alert(
        "زر الحظر ظاهر، لكن نظام الحظر يحتاج إضافة دوال الحظر في firestore.js وقواعد Firestore."
    );

}


// ============================
// Enter To Send
// ============================

if (message) {

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

}


// ============================
// Send Button
// ============================

if (send) {

    send.addEventListener(
        "click",
        sendNow
    );

}


// ============================
// Back Button
// ============================

if (back) {

    back.addEventListener(
        "click",
        () => {

            window.location.replace(
                "home.html"
            );

        }
    );

}


// ============================
// Scroll
// ============================

function scrollMessages() {

    if (!messages) {
        return;
    }


    messages.scrollTop =
        messages.scrollHeight;

}


// ============================
// Escape HTML
// ============================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}
