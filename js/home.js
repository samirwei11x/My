const newGroup=document.getElementById("newGroup");
import { currentUser, logout } from "./auth.js";

import {
    getUser,
    getGroup,
    updateUser,

    sendGroupRequest,
    listenGroupRequests,
    acceptGroupRequest,
    rejectGroupRequest,

    searchUsers,
    sendRequest,
    listenRequests,
    acceptRequest,
    rejectRequest,

    listenGroups,
    createGroup,

    listenAcceptedChats
} from "./firestore.js";
// ======================
// Elements
// ======================

const myPhoto = document.getElementById("myPhoto");
const myName = document.getElementById("myName");
const myStatus = document.getElementById("myStatus");

const profilePhoto = document.getElementById("profilePhoto");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");

const search = document.getElementById("search");

const results = document.getElementById("results");

const requestsList = document.getElementById("requestsList");

const groupsList = document.getElementById("groupsList");

const chatList=document.getElementById("chatList");

const logoutBtn = document.getElementById("logout");
const saveProfile = document.getElementById("saveProfile");

const profileUsername = document.getElementById("profileUsername");

const photoUrl = document.getElementById("photoUrl");

const groupRequestsList = document.getElementById("groupRequestsList");

// ======================

let me = null;

// ======================
// Tabs
// ======================

document.querySelectorAll(".tab").forEach(btn=>{

    btn.onclick=()=>{

        document
        .querySelectorAll(".tab")
        .forEach(x=>x.classList.remove("active"));

        btn.classList.add("active");

        document
        .querySelectorAll(".page")
        .forEach(x=>x.classList.remove("active"));

        document
        .getElementById(btn.dataset.tab)
        .classList.add("active");

    };

});

// ======================
// Current User
// ======================

currentUser(async(user)=>{

    if(!user){

        location.href="index.html";

        return;

    }

    me = await getUser(user.uid);

    myPhoto.src = me.photo;
    myName.innerText = me.username;
    myStatus.innerText = me.status;

    profilePhoto.src = me.photo || "";

    profileUsername.value = me.username || "";

    photoUrl.value = me.photo || "";

    profileBio.value = me.bio || "";
    profileName.innerText = me.name;
    profileBio.innerText = me.bio || "";

    loadRequests();

    loadGroupRequests();

    loadGroups();

    loadChats();


});

// ======================
// Search Users
// ======================

search.oninput = async () => {

    const value = search.value.trim();

    results.innerHTML = "";

    if (!value) {
        return;
    }

    try {

        const users = await searchUsers(value);

        console.log("Search results:", users);

        if (users.length === 0) {

            results.innerHTML = `
                <div class="user">
                    <p>لا توجد نتائج</p>
                </div>
            `;

            return;
        }

        users.forEach(user => {

            if (user.uid === me.uid) {
                return;
            }

            const div = document.createElement("div");

            div.className = "user";

            div.innerHTML = `
                <img
                    src="${user.photo || "https://ui-avatars.com/api/?name=User"}"
                    class="avatar"
                >

                <div>
                    <h4>${user.username}</h4>
                    <p>${user.bio || ""}</p>
                </div>
            `;

            div.onclick = async () => {

                try {

                    await sendRequest(me.uid, user.uid);

                    alert("تم إرسال الطلب، انتظر موافقة المستخدم.");

                } catch (error) {

                    console.error("Send request error:", error);

                    alert(error.code + "\n" + error.message);

                }

            };

            results.appendChild(div);

        });

    } catch (error) {

        console.error("Search error:", error);

        results.innerHTML = `
            <div class="user">
                <p>حدث خطأ أثناء البحث</p>
            </div>
        `;

    }

};

// ======================
// Requests
// ======================

function loadRequests() {
    console.log("loadRequests started", me.uid);

    listenRequests(me.uid, async (list) => {

        requestsList.innerHTML = "";

        if (!list.length) {

            requestsList.innerHTML = `
                <p>لا توجد طلبات حالياً</p>
            `;

            return;

        }

        for (const req of list) {

            if (req.status !== "pending") continue;

            try {

                const sender = await getUser(req.from);

                const div = document.createElement("div");

                div.className = "request";

                div.innerHTML = `

                    <div>

                        <b>
                            ${sender?.username || "مستخدم"}
                        </b>

                    </div>

                    <div>

                        <button class="accept">
                            قبول
                        </button>

                        <button class="reject">
                            رفض
                        </button>

                    </div>

                `;

                div.querySelector(".accept").onclick = async () => {

                    try {

                        await acceptRequest(req.id);

                        div.remove();

                    } catch (error) {

                        console.error("Accept error:", error);

                        alert(error.message);

                    }

                };

                div.querySelector(".reject").onclick = async () => {

                    try {

                        await rejectRequest(req.id);

                        div.remove();

                    } catch (error) {

                        console.error("Reject error:", error);

                        alert(error.message);

                    }

                };

                requestsList.appendChild(div);

            } catch (error) {

                console.error("Request display error:", error);

            }

        }

    });

}

// ======================
// Groups
// ======================

function loadGroups() {

    listenGroups((groups) => {

        groupsList.innerHTML = "";

        if (!groups.length) {

            groupsList.innerHTML =
                "<p>لا توجد جروبات حالياً</p>";

            return;

        }

        groups.forEach((group) => {

            const div = document.createElement("div");

            div.className = "group";

            const isMember =
                Array.isArray(group.members) &&
                group.members.includes(me.uid);

            const isOwner =
                group.owner === me.uid;

            div.innerHTML = `

                <img
                    src="${
                        group.photo ||
                        "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(group.name || "Group")
                    }"
                    class="avatar"
                >

                <div>
                    <h3>
                        ${group.name || "جروب"}
                    </h3>

                    <p>
                        ${
                            Array.isArray(group.members)
                                ? group.members.length
                                : 0
                        }
                        أعضاء
                    </p>
                </div>

                <div class="group-action"></div>

            `;

            const action =
                div.querySelector(".group-action");


            // صاحب الجروب أو عضو بالفعل
            if (isOwner || isMember) {

                const openButton =
                    document.createElement("button");

                openButton.innerText =
                    "فتح الجروب";

                openButton.onclick = () => {

                    location.href =
                        `chat.html?group=${group.id}`;

                };

                action.appendChild(openButton);

            }

            // ليس عضوًا
            else {

                const joinButton =
                    document.createElement("button");

                joinButton.innerText =
                    "طلب انضمام";

                joinButton.onclick = async (e) => {

                    e.stopPropagation();

                    try {

                        await sendGroupRequest(
                            group.id,
                            me.uid
                        );

                        joinButton.innerText =
                            "تم إرسال الطلب";

                        joinButton.disabled = true;

                        alert(
                            "تم إرسال طلب الانضمام لصاحب الجروب"
                        );

                    } catch (error) {

                        console.error(
                            "Group request error:",
                            error
                        );

                        alert(error.message);

                    }

                };

                action.appendChild(joinButton);

            }


            groupsList.appendChild(div);

        });

    });

}

function loadGroupRequests() {

    listenGroupRequests(
        me.uid,
        async (list) => {

            groupRequestsList.innerHTML = "";

            const pending =
                list.filter(
                    req => req.status === "pending"
                );

            if (!pending.length) {

                groupRequestsList.innerHTML =
                    "<p>لا توجد طلبات دخول للجروبات</p>";

                return;

            }

            for (const req of pending) {

                try {

                    const sender =
                        await getUser(req.from);

                    const group =
                        await getGroup(req.groupId);

                    if (!sender || !group) {
                        continue;
                    }

                    const div =
                        document.createElement("div");

                    div.className = "request";

                    div.innerHTML = `

                        <div>

                            <b>
                                ${sender.username}
                            </b>

                            <p>
                                يريد الانضمام إلى
                                <strong>
                                    ${group.name}
                                </strong>
                            </p>

                        </div>

                        <div>

                            <button class="accept">
                                قبول
                            </button>

                            <button class="reject">
                                رفض
                            </button>

                        </div>

                    `;


                    div.querySelector(".accept")
                        .onclick = async () => {

                            try {

                                await acceptGroupRequest(
                                    req.id
                                );

                                div.remove();

                            } catch (error) {

                                console.error(
                                    "Accept group request error:",
                                    error
                                );

                                alert(error.message);

                            }

                        };


                    div.querySelector(".reject")
                        .onclick = async () => {

                            try {

                                await rejectGroupRequest(
                                    req.id
                                );

                                div.remove();

                            } catch (error) {

                                console.error(
                                    "Reject group request error:",
                                    error
                                );

                                alert(error.message);

                            }

                        };


                    groupRequestsList.appendChild(div);

                } catch (error) {

                    console.error(
                        "Group request display error:",
                        error
                    );

                }

            }

        }
    );

}

// ======================
// Logout
// ======================

logoutBtn.onclick=()=>{

    logout();

};


function loadChats(){

    listenAcceptedChats(me.uid, async (chats) => {

        chatList.innerHTML = "";

        for (const chat of chats) {

            const otherId =
                chat.users.find(id => id !== me.uid);

            if (!otherId) continue;

            const other =
                await getUser(otherId);

            if (!other) continue;

            const div =
                document.createElement("div");

            div.className = "user";

            div.innerHTML = `

                <img src="${other.photo || ""}">

                <div>

                    <h4>${other.username || other.name}</h4>

                    <p>${other.status || "offline"}</p>

                </div>

            `;

            div.onclick = () => {

                window.location.href =
                    `/chat?uid=${encodeURIComponent(otherId)}`;

            };

            chatList.appendChild(div);

        }

    });

}


//=======================
// Create Group
//=======================

newGroup.onclick=async()=>{

    const name=prompt("اسم الجروب");

    if(!name) return;

    await createGroup({

        name:name,

        description:"",

        photo:"https://ui-avatars.com/api/?name="+encodeURIComponent(name),

        owner:me.uid,

        members:[me.uid]

    });

    alert("تم إنشاء الجروب");

};

saveProfile.onclick = async () => {

    const username = profileUsername.value.trim();

    if (username === "") {

        alert("اكتب اسم مستخدم");

        return;

    }

    await updateUser(me.uid, {

        username: username,

        photo: photoUrl.value.trim(),

        bio: profileBio.value.trim()

    });

    alert("تم حفظ البيانات بنجاح");

    location.reload();

};
