
import './style.css';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBg2WjHxp9nctwUTG2P8fikp9GHjLtlQLw",
  authDomain: "nexzora-esports.firebaseapp.com",
  projectId: "nexzora-esports",
  storageBucket: "nexzora-esports.firebasestorage.app",
  messagingSenderId: "501707649406",
  appId: "1:501707649406:web:b9a9daf8209b3b4612c32f"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const ADMIN_UID = '69EkQfAkuShSM5Fe5pCEs8nOv0l2';

const tournaments = [
  { name: 'FREE FIRE SOLO', mode: 'Solo', entry: 'FREE', prize: 'Sponsor Prize', time: 'Today - 7:00 PM' },
  { name: 'FREE FIRE DUO', mode: 'Duo', entry: 'FREE', prize: 'Sponsor Prize', time: 'Today - 8:00 PM' },
  { name: 'FREE FIRE SQUAD', mode: 'Squad', entry: 'FREE', prize: 'Sponsor Prize', time: 'Tomorrow - 7:00 PM' }
];

const app = document.getElementById('app');

let currentUser = null;
let activeChatId = null;
let unsubscribeMessages = null;
let unsubscribeChats = null;

const css = document.createElement('style');
css.textContent = `
*{box-sizing:border-box}
body{margin:0;background:#090909;color:white;font-family:Arial,sans-serif}
#app{max-width:650px;margin:auto;padding:16px}
.header{text-align:center;padding:22px 8px}
.logo{font-size:29px;font-weight:900;color:#ff3030;letter-spacing:2px}
.subtitle{color:#aaa;margin-top:8px}
.panel{background:#171717;border:1px solid #333;border-radius:13px;padding:17px;margin:14px 0}
h2,h3{margin-top:0}
input,button{width:100%;padding:13px;margin:7px 0;border-radius:8px;font-size:15px}
input{background:#090909;border:1px solid #555;color:white}
button{background:#d71920;color:white;border:0;font-weight:bold;cursor:pointer}
button.secondary{background:#333}
.join-btn{background:#d71920}
.small{color:#aaa;font-size:13px}
.message{padding:11px;margin:9px 0;border-radius:10px;background:#292929;overflow-wrap:anywhere}
.mine{background:#542020}
.chat-list button{text-align:left;background:#292929}
#messages{height:300px;overflow-y:auto;border:1px solid #333;padding:10px;border-radius:10px}
.footer{text-align:center;color:#777;padding:20px}
`;
document.head.appendChild(css);

function shell(content) {
  app.innerHTML = `
    <header class="header">
      <div class="logo">NEXZORA ESPORTS</div>
      <div class="subtitle">PLAY • COMPETE • WIN</div>
    </header>
    ${content}
  `;
}

function showLogin() {
  shell(`
    <div class="panel">
      <h2>Player Login</h2>
      <input id="email" type="email" placeholder="Email address">
      <input id="password" type="password" placeholder="Password">
      <button id="login">LOGIN</button>
      <button id="register" class="secondary">CREATE NEW ACCOUNT</button>
      <p class="small">Create an account to contact NEXZORA ESPORTS.</p>
    </div>
  `);

  document.getElementById('login').onclick = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        document.getElementById('email').value.trim(),
        document.getElementById('password').value
      );
    } catch (error) {
      alert(error.message);
    }
  };

  document.getElementById('register').onclick = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        document.getElementById('email').value.trim(),
        document.getElementById('password').value
      );
    } catch (error) {
      alert(error.message);
    }
  };
}

function showPlayer() {
  shell(`
    <div class="panel">
      <h2>Welcome Player</h2>
      <p class="small">${currentUser.email || ''}</p>
      <button id="logout" class="secondary">LOGOUT</button>
    </div>
    <h2>Available Tournaments</h2>
    <div id="tournament-list"></div>
    <div class="panel">
      <h3>My Chat</h3>
      <button id="my-chat">OPEN ADMIN CHAT</button>
    </div>
    <div class="footer">NEXZORA TECHNOLOGIES</div>
  `);

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('my-chat').onclick = () => openChat();

  const list = document.getElementById('tournament-list');

  tournaments.forEach(t => {
    const card = document.createElement('div');
    card.className = 'panel';

    const title = document.createElement('h3');
    title.textContent = t.name;

    const details = document.createElement('p');
    details.textContent =
      `Mode: ${t.mode} | Entry: ${t.entry} | Prize: ${t.prize} | ${t.time}`;

    const button = document.createElement('button');
    button.className = 'join-btn';
    button.textContent = 'REGISTER';

    button.onclick = () => {
      openChat(`Hello Admin, I want to register for ${t.name}.`);
    };

    card.append(title, details, button);
    list.appendChild(card);
  });
}

function showAdmin() {
  shell(`
    <div class="panel">
      <h2>NEXZORA ADMIN PANEL</h2>
      <p class="small">Admin: ${currentUser.email || ''}</p>
      <button id="logout" class="secondary">LOGOUT</button>
    </div>
    <div class="panel">
      <h3>Player Messages / Inbox</h3>
      <div id="chat-list" class="chat-list">Loading chats...</div>
    </div>
    <div id="admin-chat"></div>
  `);

  document.getElementById('logout').onclick = () => signOut(auth);

  if (unsubscribeChats) unsubscribeChats();

  unsubscribeChats = onSnapshot(
    collection(db, 'chats'),
    snapshot => {
      const list = document.getElementById('chat-list');
      if (!list) return;

      list.innerHTML = '';

      if (snapshot.empty) {
        list.textContent = 'No player messages yet.';
        return;
      }

      snapshot.forEach(chat => {
        const data = chat.data();
        if (chat.id === ADMIN_UID) return;

        const button = document.createElement('button');
        button.textContent = data.playerEmail || chat.id;
        button.onclick = () => openChat(null, chat.id);
        list.appendChild(button);
      });
    },
    error => alert('Inbox error: ' + error.message)
  );
}

function openChat(firstMessage = '', chatId = currentUser.uid) {
  activeChatId = chatId;

  if (unsubscribeMessages) unsubscribeMessages();

  const target = currentUser.uid === ADMIN_UID
    ? document.getElementById('admin-chat')
    : app;

  if (currentUser.uid !== ADMIN_UID) {
    shell(`
      <div class="panel">
        <h2>Chat with NEXZORA Admin</h2>
        <button id="back" class="secondary">BACK</button>
        <div id="messages"></div>
        <input id="message-input" placeholder="Type your message...">
        <button id="send">SEND MESSAGE</button>
      </div>
    `);
    document.getElementById('back').onclick = showPlayer;
  } else {
    target.innerHTML = `
      <div class="panel">
        <h3>Player Conversation</h3>
        <div id="messages"></div>
        <input id="message-input" placeholder="Type your reply...">
        <button id="send">SEND REPLY</button>
      </div>
    `;
  }

  const messagesBox = document.getElementById('messages');
  const input = document.getElementById('message-input');
  const send = document.getElementById('send');

  const chatRef = doc(db, 'chats', chatId);

  if (currentUser.uid !== ADMIN_UID) {
    setDoc(chatRef, {
      uid: currentUser.uid,
      playerEmail: currentUser.email || '',
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(error => alert(error.message));
  }

  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  unsubscribeMessages = onSnapshot(
    messagesQuery,
    snapshot => {
      messagesBox.innerHTML = '';

      snapshot.forEach(message => {
        const data = message.data();
        const bubble = document.createElement('div');
        bubble.className = 'message' +
          (data.senderUid === currentUser.uid ? ' mine' : '');

        const sender = document.createElement('strong');
        sender.textContent =
          data.senderUid === ADMIN_UID ? 'NEXZORA ADMIN' : 'PLAYER';

        const content = document.createElement('p');
        content.textContent = data.text || '';

        bubble.append(sender, content);
        messagesBox.appendChild(bubble);
      });

      messagesBox.scrollTop = messagesBox.scrollHeight;
    },
    error => alert('Message error: ' + error.message)
  );

  send.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    send.disabled = true;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderUid: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      await setDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

      input.value = '';
    } catch (error) {
      alert('Message send nahi hua: ' + error.message);
    } finally {
      send.disabled = false;
    }
  };

  if (firstMessage && currentUser.uid !== ADMIN_UID) {
    input.value = firstMessage;
  }
}

onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  if (unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }

  if (!user) {
    showLogin();
    return;
  }

  if (user.uid === ADMIN_UID) {
    showAdmin();
  } else {
    showPlayer();
  }
});
  
