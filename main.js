
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
  getDoc,
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

const games = ['FREE FIRE', 'BGMI'];

const tournaments = [
  { game: 'FREE FIRE', name: 'FREE FIRE SOLO', mode: 'Solo' },
  { game: 'FREE FIRE', name: 'FREE FIRE DUO', mode: 'Duo' },
  { game: 'FREE FIRE', name: 'FREE FIRE SQUAD', mode: 'Squad' },
  { game: 'BGMI', name: 'BGMI SOLO', mode: 'Solo' },
  { game: 'BGMI', name: 'BGMI DUO', mode: 'Duo' },
  { game: 'BGMI', name: 'BGMI SQUAD', mode: 'Squad' }
];

const app = document.getElementById('app');

let currentUser = null;
let unsubscribeMessages = null;
let unsubscribeChats = null;

const style = document.createElement('style');
style.textContent = `
*{box-sizing:border-box}
body{margin:0;background:#080808;color:white;font-family:Arial,sans-serif}
#app{max-width:650px;margin:auto;padding:15px}
.header{text-align:center;padding:25px 8px;border-bottom:2px solid #9c111c;margin-bottom:20px}
.logo{font-size:29px;font-weight:900;color:#ff303c;text-shadow:0 0 15px #e00020;letter-spacing:2px}
.subtitle{color:#aaa;letter-spacing:4px;margin-top:10px;font-size:12px}
.panel{background:#181818;border:1px solid #333;border-radius:15px;padding:18px;margin:14px 0}
input{width:100%;padding:14px;margin:8px 0;border-radius:9px;border:1px solid #555;background:#090909;color:white;font-size:15px}
button{width:100%;padding:14px;margin:6px 0;border:0;border-radius:10px;background:#d71920;color:white;font-weight:bold;font-size:15px}
button.secondary{background:#333}
button:disabled{opacity:.5}
.game-button{min-height:100px;font-size:21px;background:linear-gradient(140deg,#430b12,#171717);border:1px solid #a91b28}
.small{color:#aaa;font-size:13px}
#messages{height:390px;overflow-y:auto;padding:10px;border:1px solid #333;border-radius:12px;margin:12px 0}
.message{max-width:90%;padding:13px;margin:12px 0;border-radius:16px;background:#262626;overflow-wrap:anywhere}
.mine{margin-left:auto;background:#5539d9}
.message-name{font-size:11px;color:#bbb;margin-bottom:7px}
.message-text{white-space:pre-wrap;line-height:1.4}
.action-button{background:#eee;color:#222;margin-top:12px}
.chat-list button{text-align:left;background:#292929}
.footer{text-align:center;color:#777;padding:20px}
`;

document.head.appendChild(style);

function shell(content) {
  app.innerHTML = `
    <header class="header">
      <div class="logo">NEXZORA ESPORTS</div>
      <div class="subtitle">PLAY • COMPETE • WIN</div>
    </header>
    ${content}
    <div class="footer">POWERED BY NEXZORA TECHNOLOGIES</div>
  `;
}

function showLogin() {
  shell(`
    <div class="panel">
      <h2>PLAYER LOGIN</h2>
      <input id="email" type="email" placeholder="Email address">
      <input id="password" type="password" placeholder="Password">
      <button id="login">LOGIN</button>
      <button id="register" class="secondary">CREATE NEW ACCOUNT</button>
    </div>
  `);

  document.getElementById('login').onclick = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        document.getElementById('email').value.trim(),
        document.getElementById('password').value
      );
    } catch (e) {
      alert(e.message);
    }
  };

  document.getElementById('register').onclick = async () => {
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || password.length < 6) {
        alert('Email aur minimum 6 character password enter karo.');
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert(e.message);
    }
  };
}

function showPlayer() {
  shell(`
    <div class="panel">
      <h2>WELCOME PLAYER</h2>
      <p class="small">${currentUser.email || ''}</p>
      <button class="secondary" id="logout">LOGOUT</button>
    </div>

    <h2>SELECT YOUR GAME</h2>
    <div class="panel">
      <button class="game-button" id="freefire">🔥 FREE FIRE</button>
      <button class="game-button" id="bgmi">🎯 BGMI</button>
    </div>

    <div class="panel">
      <h3>PRIVATE SUPPORT</h3>
      <button id="chat">CHAT WITH NEXZORA</button>
    </div>
  `);

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('chat').onclick = () => openPlayerChat();

  document.getElementById('freefire').onclick =
    () => showTournaments('FREE FIRE');

  document.getElementById('bgmi').onclick =
    () => showTournaments('BGMI');
}

function showTournaments(game) {
  shell(`
    <div class="panel">
      <h2>${game} TOURNAMENTS</h2>
      <button class="secondary" id="back">← BACK TO GAMES</button>
    </div>
    <div id="tournament-list"></div>
    <button id="chat">CHAT WITH NEXZORA</button>
  `);

  document.getElementById('back').onclick = showPlayer;
  document.getElementById('chat').onclick = () => openPlayerChat();

  const list = document.getElementById('tournament-list');

  tournaments.filter(t => t.game === game).forEach(t => {
    const card = document.createElement('div');
    card.className = 'panel';

    const title = document.createElement('h3');
    title.textContent = t.name;

    const details = document.createElement('p');
    details.textContent = `Mode: ${t.mode} | Entry: FREE`;

    const button = document.createElement('button');
    button.textContent = 'REGISTER';

    button.onclick = () => openPlayerChat(
      `I want to register for ${t.name}.`
    );

    card.append(title, details, button);
    list.appendChild(card);
  });
}

function showAdmin() {
  shell(`
    <div class="panel">
      <h2>NEXZORA ADMIN PANEL</h2>
      <p class="small">${currentUser.email || ''}</p>
      <button class="secondary" id="logout">LOGOUT</button>
    </div>

    <div class="panel">
      <h3>PRIVATE PLAYER INBOX</h3>
      <div id="chat-list">Loading...</div>
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
        const button = document.createElement('button');

        button.textContent =
          (data.playerEmail || 'Player') +
          ' — ' + (data.lastMessage || 'Open conversation');

        button.onclick = () => openAdminChat(chat.id);
        list.appendChild(button);
      });
    },
    error => alert(error.message)
  );
}

async function addSystemMessage(chatId, text, buttons = []) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid: currentUser.uid,
    system: true,
    text,
    buttons,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function openPlayerChat(firstMessage = '') {
  const chatId = currentUser.uid;

  if (unsubscribeMessages) unsubscribeMessages();

  shell(`
    <div class="panel">
      <h2>NEXZORA PRIVATE CHAT</h2>
      <p class="small">Your conversation is private.</p>
      <button class="secondary" id="back">← BACK</button>
      <div id="messages">Loading messages...</div>
      <input id="message-input" maxlength="2000" placeholder="Message...">
      <button id="send">SEND MESSAGE</button>
    </div>
  `);

  document.getElementById('back').onclick = showPlayer;

  const chatRef = doc(db, 'chats', chatId);

  try {
    const chatSnapshot = await getDoc(chatRef);

    await setDoc(chatRef, {
      uid: chatId,
      playerEmail: currentUser.email || '',
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (!chatSnapshot.exists() || !chatSnapshot.data().welcomeSent) {
      await addSystemMessage(
        chatId,
        'Hey! Welcome to NEXZORA ESPORTS 😊\n\nThanks so much for joining us!\n\nTap below and I will help you get started ✨',
        ['START NOW']
      );

      await setDoc(chatRef, { welcomeSent: true }, { merge: true });
    }

    if (firstMessage) {
      await sendPlayerText(firstMessage);
    }
  } catch (error) {
    alert('Chat error: ' + error.message);
    return;
  }

  listenToMessages(chatId);
  setupPlayerSend(chatId);
}

function listenToMessages(chatId) {
  const messagesBox = document.getElementById('messages');

  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
    if (!messagesBox) return;

    messagesBox.innerHTML = '';

    snapshot.forEach(item => {
      const data = item.data();

      const bubble = document.createElement('div');
      bubble.className = 'message';

      if (data.senderUid === currentUser.uid && !data.system) {
        bubble.classList.add('mine');
      }

      const name = document.createElement('div');
      name.className = 'message-name';
      name.textContent = data.system
        ? 'NEXZORA ESPORTS'
        : data.senderUid === ADMIN_UID
          ? 'NEXZORA ADMIN'
          : 'YOU';

      const text = document.createElement('div');
      text.className = 'message-text';
      text.textContent = data.text || '';

      bubble.append(name, text);

      if (data.system && Array.isArray(data.buttons)) {
        data.buttons.forEach(label => {
          const button = document.createElement('button');
          button.className = 'action-button';
          button.textContent = label;
          button.onclick = () => handleChatButton(chatId, label);
          bubble.appendChild(button);
        });
      }

      messagesBox.appendChild(bubble);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }, error => alert(error.message));
}

async function handleChatButton(chatId, label) {
  try {
    if (label === 'START NOW') {
      await addSystemMessage(
        chatId,
        'Hey there! 🎮\n\nWhich game do you want to play?',
        games
      );
    } else if (games.includes(label)) {
      const choices = tournaments
        .filter(t => t.game === label)
        .map(t => t.name);

      await addSystemMessage(
        chatId,
        `Great choice! 🔥\n\nSelect your ${label} tournament:`,
        choices
      );
    } else if (tournaments.some(t => t.name === label)) {
      await addSystemMessage(
        chatId,
        `Your interest in ${label} has been received! 🎮\n\nPlease send your in-game name and ID. Our admin team will assist you shortly.`,
        []
      );
    }
  } catch (error) {
    alert('Could not continue: ' + error.message);
  }
}

async function sendPlayerText(text) {
  const chatId = currentUser.uid;

  if (!text.trim()) return;

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid: currentUser.uid,
    text: text.trim(),
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, 'chats', chatId), {
    lastMessage: text.trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function setupPlayerSend() {
  const input = document.getElementById('message-input');
  const button = document.getElementById('send');

  button.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    button.disabled = true;

    try {
      await sendPlayerText(text);
      input.value = '';
    } catch (error) {
      alert(error.message);
    }

    button.disabled = false;
  };
}

function openAdminChat(chatId) {
  if (unsubscribeMessages) unsubscribeMessages();

  const area = document.getElementById('admin-chat');

  area.innerHTML = `
    <div class="panel">
      <h3>PLAYER PRIVATE CONVERSATION</h3>
      <button class="secondary" id="close">← BACK TO INBOX</button>
      <div id="messages"></div>
      <input id="message-input" maxlength="2000" placeholder="Write a reply...">
      <button id="send">SEND REPLY</button>
    </div>
  `;

  document.getElementById('close').onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = null;
    area.innerHTML = '';
  };

  listenToMessages(chatId);

  document.getElementById('send').onclick = async () => {
    const input = document.getElementById('message-input');
    const button = document.getElementById('send');
    const text = input.value.trim();

    if (!text) return;

    button.disabled = true;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderUid: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

      input.value = '';
    } catch (error) {
      alert(error.message);
    }

    button.disabled = false;
  };
}

onAuthStateChanged(auth, user => {
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
  } else if (user.uid === ADMIN_UID) {
    showAdmin();
  } else {
    showPlayer();
  }
});
    
