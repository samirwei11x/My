import { db } from "./firebase.js";

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ===========================
   USERS
=========================== */

export async function createUser(uid, data) {

    return await setDoc(
        doc(db, "users", uid),
        data
    );

}


export async function getUser(uid) {

    const snap = await getDoc(
        doc(db, "users", uid)
    );

    return snap.exists()
        ? {
            uid: snap.id,
            ...snap.data()
        }
        : null;

}


export async function updateUser(uid, data) {

    if (!data.username) {

        return await updateDoc(
            doc(db, "users", uid),
            data
        );

    }

    const username =
        data.username
            .trim()
            .toLowerCase();

    const result = await getDocs(
        collection(db, "users")
    );

    for (const userDoc of result.docs) {

        if (userDoc.id === uid) {
            continue;
        }

        const userData =
            userDoc.data();

        const existingUsername =
            String(userData.username || "")
                .trim()
                .toLowerCase();

        if (existingUsername === username) {

            throw new Error(
                "اسم المستخدم مستخدم بالفعل"
            );

        }

    }

    return await updateDoc(
        doc(db, "users", uid),
        {
            ...data,
            username:
                data.username.trim()
        }
    );

}


export async function usernameExists(username) {

    const text =
        String(username || "")
            .trim()
            .toLowerCase();

    if (!text) {
        return false;
    }

    const result = await getDocs(
        collection(db, "users")
    );

    for (const userDoc of result.docs) {

        const data =
            userDoc.data();

        const existingUsername =
            String(data.username || "")
                .trim()
                .toLowerCase();

        if (existingUsername === text) {
            return true;
        }

    }

    return false;

}


export async function searchUsers(keyword) {

    const text =
        String(keyword || "")
            .trim()
            .toLowerCase();

    if (!text) {
        return [];
    }

    const result = await getDocs(
        collection(db, "users")
    );

    const users = [];

    result.forEach((docSnap) => {

        const data =
            docSnap.data();

        const username =
            String(data.username || "")
                .trim()
                .toLowerCase();

        if (
            username &&
            username.includes(text)
        ) {

            users.push({
                uid: docSnap.id,
                ...data
            });

        }

    });

    return users;

}


/* ===========================
   FRIEND REQUESTS
=========================== */

export async function sendRequest(from, to) {

    if (!from || !to) {
        throw new Error("بيانات الطلب غير صحيحة");
    }

    if (from === to) {
        throw new Error("لا يمكنك إرسال طلب لنفسك");
    }

    try {

        return await addDoc(
            collection(db, "requests"),
            {
                from: from,
                to: to,
                status: "pending",
                createdAt: serverTimestamp()
            }
        );

    } catch (error) {

        console.error("sendRequest error:", error);

        throw error;
    }
}

export async function acceptRequest(requestId) {

    const requestRef = doc(
        db,
        "requests",
        requestId
    );

    const snap = await getDoc(requestRef);

    if (!snap.exists()) {
        throw new Error("الطلب غير موجود");
    }

    const data = snap.data();

    const from = data.from;
    const to = data.to;

    if (!from || !to) {
        throw new Error("بيانات الطلب غير صحيحة");
    }

    // تحديث حالة الطلب
    await updateDoc(
        requestRef,
        {
            status: "accepted"
        }
    );

    // إنشاء المحادثة بنفس الـ UID للطرفين
    await createChat(
        from,
        to
    );

    console.log("Chat created:", {
        from,
        to,
        chatId: chatId(from, to)
    });
}


export async function rejectRequest(requestId) {

    return await updateDoc(
        doc(
            db,
            "requests",
            requestId
        ),
        {
            status: "rejected"
        }
    );

}


export function listenRequests(
    uid,
    callback
) {

    const q = query(
        collection(db, "requests"),
        where("to", "==", uid)
    );

    return onSnapshot(
        q,
        (snapshot) => {

            const requests = [];

            snapshot.forEach(
                (docSnap) => {

                    requests.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                }
            );

            callback(requests);

        }
    );

}


/* ===========================
   CHAT
=========================== */

export function chatId(uid1, uid2) {

    return [
        uid1,
        uid2
    ]
        .sort()
        .join("_");

}


export async function createChat(uid1, uid2) {

    if (!uid1 || !uid2) {
        throw new Error("UID غير صحيح");
    }

    const id = chatId(uid1, uid2);

    await setDoc(
        doc(db, "chats", id),
        {
            users: [uid1, uid2],
            createdAt: serverTimestamp()
        },
        {
            merge: true
        }
    );

    console.log("Created chat:", id);

    return id;
}


export async function chatExists(
    uid1,
    uid2
) {

    const id =
        chatId(uid1, uid2);

    const snap =
        await getDoc(
            doc(db, "chats", id)
        );

    return snap.exists();

}


export async function getChat(
    uid1,
    uid2
) {

    const id =
        chatId(uid1, uid2);

    const snap =
        await getDoc(
            doc(db, "chats", id)
        );

    if (!snap.exists()) {
        return null;
    }

    return {
        id: snap.id,
        ...snap.data()
    };

}


export async function sendMessage(
    chat,
    data
) {

    return await addDoc(
        collection(
            db,
            "chats",
            chat,
            "messages"
        ),
        {
            ...data,
            createdAt:
                serverTimestamp()
        }
    );

}


export function listenMessages(
    chat,
    callback
) {

    const q = query(
        collection(
            db,
            "chats",
            chat,
            "messages"
        ),
        orderBy("createdAt")
    );

    return onSnapshot(
        q,
        (snapshot) => {

            const messages = [];

            snapshot.forEach(
                (docSnap) => {

                    messages.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                }
            );

            callback(messages);

        }
    );

}


export async function deleteMessage(
    chat,
    id
) {

    return await deleteDoc(
        doc(
            db,
            "chats",
            chat,
            "messages",
            id
        )
    );

}


export function listenAcceptedChats(
    uid,
    callback
) {

    return onSnapshot(
        collection(db, "chats"),
        (snapshot) => {

            const chats = [];

            snapshot.forEach(
                (docItem) => {

                    const data =
                        docItem.data();

                    if (
                        data.users &&
                        data.users.includes(uid)
                    ) {

                        chats.push({

                            id: docItem.id,

                            ...data

                        });

                    }

                }
            );

            callback(chats);

        }
    );

}


/* ===========================
   GROUPS
=========================== */

export async function createGroup(data) {

    return await addDoc(
        collection(db, "groups"),
        {

            ...data,

            members:
                Array.isArray(
                    data.members
                )
                    ? data.members
                    : [],

            createdAt:
                serverTimestamp()

        }
    );

}


export async function getGroup(
    groupId
) {

    const snap =
        await getDoc(
            doc(
                db,
                "groups",
                groupId
            )
        );

    if (!snap.exists()) {
        return null;
    }

    return {

        id: snap.id,

        ...snap.data()

    };

}


export function listenGroups(callback) {

    return onSnapshot(
        collection(db, "groups"),
        (snapshot) => {

            const groups = [];

            snapshot.forEach(
                (docSnap) => {

                    groups.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                }
            );

            callback(groups);

        }
    );

}


/* ===========================
   GROUP REQUESTS
=========================== */

export async function sendGroupRequest(
    groupId,
    from
) {

    if (!groupId || !from) {

        throw new Error(
            "بيانات الطلب غير صحيحة"
        );

    }

    const group =
        await getGroup(groupId);

    if (!group) {

        throw new Error(
            "الجروب غير موجود"
        );

    }

    if (group.owner === from) {

        throw new Error(
            "أنت صاحب الجروب بالفعل"
        );

    }

    const members =
        Array.isArray(group.members)
            ? group.members
            : [];

    if (members.includes(from)) {

        throw new Error(
            "أنت عضو في الجروب بالفعل"
        );

    }

    const q = query(
        collection(
            db,
            "groupRequests"
        ),
        where(
            "groupId",
            "==",
            groupId
        ),
        where(
            "from",
            "==",
            from
        ),
        where(
            "status",
            "==",
            "pending"
        )
    );

    const result =
        await getDocs(q);

    if (!result.empty) {

        throw new Error(
            "يوجد طلب انضمام معلق بالفعل"
        );

    }

    return await addDoc(
        collection(
            db,
            "groupRequests"
        ),
        {

            groupId:
                groupId,

            from:
                from,

            to:
                group.owner,

            status:
                "pending",

            createdAt:
                serverTimestamp()

        }
    );

}


/* ===========================
   LISTEN GROUP REQUESTS
=========================== */

export function listenGroupRequests(
    uid,
    callback
) {

    const q = query(
        collection(
            db,
            "groupRequests"
        ),
        where(
            "to",
            "==",
            uid
        )
    );

    return onSnapshot(
        q,
        (snapshot) => {

            const requests = [];

            snapshot.forEach(
                (docSnap) => {

                    requests.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                }
            );

            callback(requests);

        },
        (error) => {

            console.error(
                "Group requests error:",
                error
            );

        }
    );

}


/* ===========================
   ACCEPT GROUP REQUEST
=========================== */

export async function acceptGroupRequest(
    requestId
) {

    const requestRef =
        doc(
            db,
            "groupRequests",
            requestId
        );

    const requestSnap =
        await getDoc(requestRef);

    if (!requestSnap.exists()) {

        throw new Error(
            "الطلب غير موجود"
        );

    }

    const request =
        requestSnap.data();

    if (
        request.status !==
        "pending"
    ) {

        throw new Error(
            "الطلب تم التعامل معه بالفعل"
        );

    }

    const groupRef =
        doc(
            db,
            "groups",
            request.groupId
        );

    const groupSnap =
        await getDoc(groupRef);

    if (!groupSnap.exists()) {

        throw new Error(
            "الجروب غير موجود"
        );

    }

    const group =
        groupSnap.data();

    if (
        group.owner !==
        request.to
    ) {

        throw new Error(
            "ليس لديك صلاحية لقبول الطلب"
        );

    }

    const members =
        Array.isArray(group.members)
            ? [...group.members]
            : [];

    if (
        !members.includes(
            request.from
        )
    ) {

        members.push(
            request.from
        );

    }

    await updateDoc(
        groupRef,
        {
            members:
                members
        }
    );

    await updateDoc(
        requestRef,
        {
            status:
                "accepted"
        }
    );

    return true;

}


/* ===========================
   REJECT GROUP REQUEST
=========================== */

export async function rejectGroupRequest(
    requestId
) {

    const requestRef =
        doc(
            db,
            "groupRequests",
            requestId
        );

    const snap =
        await getDoc(requestRef);

    if (!snap.exists()) {

        throw new Error(
            "الطلب غير موجود"
        );

    }

    return await updateDoc(
        requestRef,
        {
            status:
                "rejected"
        }
    );

}


/* ===========================
   GROUP MEMBERS
=========================== */

export async function addGroupMember(
    groupId,
    uid
) {

    const ref =
        doc(
            db,
            "groups",
            groupId
        );

    const snap =
        await getDoc(ref);

    if (!snap.exists()) {

        throw new Error(
            "الجروب غير موجود"
        );

    }

    const data =
        snap.data();

    const members =
        Array.isArray(data.members)
            ? [...data.members]
            : [];

    if (
        !members.includes(uid)
    ) {

        members.push(uid);

        await updateDoc(
            ref,
            {
                members:
                    members
            }
        );

    }

    return true;

}


export async function removeGroupMember(
    groupId,
    uid
) {

    const ref =
        doc(
            db,
            "groups",
            groupId
        );

    const snap =
        await getDoc(ref);

    if (!snap.exists()) {

        throw new Error(
            "الجروب غير موجود"
        );

    }

    const data =
        snap.data();

    const members =
        Array.isArray(data.members)
            ? data.members
            : [];

    const newMembers =
        members.filter(
            member => member !== uid
        );

    await updateDoc(
        ref,
        {
            members:
                newMembers
        }
    );

    return true;

}


/* ===========================
   GROUP CHAT
=========================== */

export async function sendGroupMessage(
    groupId,
    data
) {

    return await addDoc(
        collection(
            db,
            "groups",
            groupId,
            "messages"
        ),
        {

            ...data,

            createdAt:
                serverTimestamp()

        }
    );

}


export function listenGroupMessages(
    groupId,
    callback
) {

    const q = query(
        collection(
            db,
            "groups",
            groupId,
            "messages"
        ),
        orderBy("createdAt")
    );

    return onSnapshot(
        q,
        (snapshot) => {

            const messages = [];

            snapshot.forEach(
                (docSnap) => {

                    messages.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                }
            );

            callback(messages);

        }
    );

}


/* ===========================
   DELETE GROUP
=========================== */

export async function deleteGroup(
    groupId
) {

    const groupRef =
        doc(
            db,
            "groups",
            groupId
        );

    const groupSnap =
        await getDoc(groupRef);

    if (!groupSnap.exists()) {

        throw new Error(
            "الجروب غير موجود"
        );

    }

    // حذف رسائل الجروب

    const messagesRef =
        collection(
            db,
            "groups",
            groupId,
            "messages"
        );

    const messagesSnap =
        await getDocs(messagesRef);

    for (
        const messageDoc
        of messagesSnap.docs
    ) {

        await deleteDoc(
            doc(
                db,
                "groups",
                groupId,
                "messages",
                messageDoc.id
            )
        );

    }

    // حذف الجروب

    await deleteDoc(groupRef);

    return true;

}

export async function isUserBlocked(uid, otherUid) {

    if (!uid || !otherUid) {
        return false;
    }

    const myBlockId =
        `${uid}_${otherUid}`;

    const otherBlockId =
        `${otherUid}_${uid}`;

    const myBlock =
        await getDoc(
            doc(
                db,
                "blocks",
                myBlockId
            )
        );

    const otherBlock =
        await getDoc(
            doc(
                db,
                "blocks",
                otherBlockId
            )
        );

    return (
        myBlock.exists() ||
        otherBlock.exists()
    );
}

/* ===========================
   BLOCK USERS
=========================== */

export async function blockUser(
    uid,
    blockedUid
) {

    if (!uid || !blockedUid) {
        throw new Error(
            "بيانات الحظر غير صحيحة"
        );
    }

    if (uid === blockedUid) {
        throw new Error(
            "لا يمكنك حظر نفسك"
        );
    }

    const blockId =
        `${uid}_${blockedUid}`;

    return await setDoc(
        doc(
            db,
            "blocks",
            blockId
        ),
        {
            from: uid,
            to: blockedUid,
            createdAt:
                serverTimestamp()
        }
    );
}


/* ===========================
   UNBLOCK USER
=========================== */

export async function unblockUser(
    uid,
    blockedUid
) {

    if (!uid || !blockedUid) {
        throw new Error(
            "بيانات إلغاء الحظر غير صحيحة"
        );
    }

    const blockId =
        `${uid}_${blockedUid}`;

    return await deleteDoc(
        doc(
            db,
            "blocks",
            blockId
        )
    );
}


/* ===========================
   CHECK BLOCK
=========================== */

export async function isBlocked(
    uid,
    otherUid
) {

    if (!uid || !otherUid) {
        return false;
    }

    const myBlockId =
        `${uid}_${otherUid}`;

    const otherBlockId =
        `${otherUid}_${uid}`;

    const myBlock =
        await getDoc(
            doc(
                db,
                "blocks",
                myBlockId
            )
        );

    const otherBlock =
        await getDoc(
            doc(
                db,
                "blocks",
                otherBlockId
            )
        );

    return (
        myBlock.exists() ||
        otherBlock.exists()
    );
}


/* ===========================
   AM I BLOCKING USER?
=========================== */

export async function isBlocking(
    uid,
    otherUid
) {

    if (!uid || !otherUid) {
        return false;
    }

    const blockId =
        `${uid}_${otherUid}`;

    const snap =
        await getDoc(
            doc(
                db,
                "blocks",
                blockId
            )
        );

    return snap.exists();
}


/* ===========================
   STATUS
=========================== */

export async function setStatus(
    uid,
    status
) {

    return await updateDoc(
        doc(db, "users", uid),
        {

            status:
                status,

            lastSeen:
                serverTimestamp()

        }
    );

}
