import { currentUser } from "./auth.js";

import {
    getUser,
    sendMessage,
    listenMessages,
    chatId,
    chatExists,
    sendGroupMessage,
    listenGroupMessages,
    deleteMessage,
    blockUser,
    unblockUser,
    isUserBlocked
} from "./firestore.js";


// ============================
// Elements
// ============================

const userPhoto =
    document.getElementById("userPhoto");

const userName =
    document.getElementById("userName");

const userStatus =
    document.getElementById("userStatus");

const messages =
    document.getElementById("messages");

const message =
    document.getElementById("message");

const send =
    document.getElementById("send");

const back =
    document.getElementById("back");

const chatMenuBtn =
    document.getElementById("chatMenuBtn");

const chatMenu =
    document.getElementById("chatMenu");

const blockUserBtn =
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

            <h2>
                ❌ لم يتم إرسال UID
            </h2>

            <p>
                الرابط الحالي:
            </p>

            <p style="direction:ltr;">
                ${window.location.href}
            </p>

            <button onclick="history.back()">
                رجوع
            </button>

        </div>

    `;

    throw new Error(
        "Missing chat UID"
    );
}


const isGroup =
    !!groupId;


// ============================
// Variables
// ============================

let myUid = "";

let room = "";

let blocked = false;


// ============================
// Current User
// ============================

currentUser(async (user) => {

    if (!user) {

        console.log(
            "CHAT: user is null"
        );

        alert(
            "المستخدم غير مسجل دخول"
        );

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

        userName.innerText =
            "الجروب";

        userStatus.innerText =
            "Group Chat";

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
        // Load Other User
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


        // ============================
        // Check Block
        // ============================

        blocked =
            await isUserBlocked(
                myUid,
                otherUid
            );


        updateBlockUI();


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
// Load Private Messages
// ============================

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
                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"
                                }
                            );

                    } catch (error) {

                        time = "";

                    }

                }


                const text =
                    escapeHTML(
                        msg.text || ""
                    );


                div.innerHTML = `

                    <div class="message-content">

                        ${text}

                    </div>

                    <span class="time">

                        ${time}

                    </span>

                `;


                // ============================
                // Delete Own Message
                // ============================

                if (
                    msg.sender === myUid &&
                    msg.id
                ) {

                    const deleteBtn =
                        document.createElement(
                            "button"
                        );


                    deleteBtn.className =
                        "delete-message";


                    deleteBtn.type =
                        "button";


                    deleteBtn.innerText =
                        "حذف";


                    deleteBtn.onclick =
                        async (event) => {

                            event.stopPropagation();

                            const confirmDelete =
                                confirm(
                                    "هل تريد حذف هذه الرسالة؟"
                                );


                            if (!confirmDelete) {

                                return;

                            }


                            try {

                                await deleteMessage(
                                    room,
                                    msg.id
                                );

                            } catch (error) {

                                console.error(
                                    "Delete message error:",
                                    error
                                );

                                alert(
                                    "حدث خطأ أثناء حذف الرسالة"
                                );

                            }

                        };


                    div.appendChild(
                        deleteBtn
                    );

                }


                messages.appendChild(
                    div
                );

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
                    document.createElement(
                        "div"
                    );


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
                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"
                                }
                            );

                    } catch (error) {

                        time = "";

                    }

                }


                div.innerHTML = `

                    <div>
                        ${escapeHTML(
                            msg.text || ""
                        )}
                    </div>

                    <span class="time">
                        ${time}
                    </span>

                `;


                messages.appendChild(
                    div
                );

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


    if (
        !isGroup &&
        blocked
    ) {

        alert(
            "لا يمكنك إرسال رسائل لهذا المستخدم لأنه محظور."
        );

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
// Enter
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
// Chat Menu
// ============================

chatMenuBtn.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        chatMenu.classList.toggle(
            "show"
        );

    }
);


// Close Menu

document.addEventListener(
    "click",
    () => {

        chatMenu.classList.remove(
            "show"
        );

    }
);


// ============================
// Block / Unblock
// ============================

blockUserBtn.addEventListener(
    "click",
    async (event) => {

        event.stopPropagation();


        if (isGroup) {

            return;
        }


        try {

            if (!blocked) {

                const confirmBlock =
                    confirm(
                        "هل تريد حظر هذا المستخدم؟"
                    );


                if (!confirmBlock) {

                    return;
                }


                await blockUser(
                    myUid,
                    otherUid
                );


                blocked = true;


                alert(
                    "تم حظر المستخدم"
                );


            } else {

                const confirmUnblock =
                    confirm(
                        "هل تريد إلغاء حظر هذا المستخدم؟"
                    );


                if (!confirmUnblock) {

                    return;
                }


                await unblockUser(
                    myUid,
                    otherUid
                );


                blocked = false;


                alert(
                    "تم إلغاء الحظر"
                );

            }


            updateBlockUI();

        } catch (error) {

            console.error(
                "Block error:",
                error
            );

            alert(
                "حدث خطأ أثناء تنفيذ العملية"
            );

        }

    }
);


// ============================
// Update Block UI
// ============================

function updateBlockUI() {

    if (isGroup) {

        chatMenuBtn.style.display =
            "none";

        return;
    }


    chatMenuBtn.style.display =
        "block";


    if (blocked) {

        blockUserBtn.innerText =
            "✅ إلغاء حظر المستخدم";

    } else {

        blockUserBtn.innerText =
            "🚫 حظر المستخدم";

    }

}


// ============================
// Scroll
// ============================

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;

}


// ============================
// Safe HTML
// ============================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}
