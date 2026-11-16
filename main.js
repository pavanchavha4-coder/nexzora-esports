
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

// FIREBASE CONFIG
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

// ADMIN UID
const ADMIN_UID = '69EkQfAkuShSM5Fe5pCEs8nOv0l2';

// TOURNAMENTS
const tournaments = [
  {
    game: 'FREE FIRE',
    name: 'FREE FIRE SOLO',
    mode: 'Solo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 7:00 PM'
  },
  {
    game: 'FREE FIRE',
    name: 'FREE FIRE DUO',
    mode: 'Duo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 8:00 PM'
  },
  {
    game: 'FREE FIRE',
    name: 'FREE FIRE SQUAD',
    mode: 'Squad',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Tomorrow - 7:00 PM'
  },
  {
    game: 'BGMI',
    name: 'BGMI SOLO',
    mode: 'Solo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 7:00 PM'
  },
  {
    game: 'BGMI',
    name: 'BGMI DUO',
    mode: 'Duo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 8:00 PM'
  },
  {
    game: 'BGMI',
    name: 'BGMI SQUAD',
    mode: 'Squad',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Tomorrow - 7:00 PM'
  }
];

const app = document.getElementById('app');

let currentUser = null;
let unsubscribeMessages = null;
let unsubscribeChats = null;

// DESIGN
const design = document.createElement('style');

design.textContent = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #080808;
  color: white;
  font-family: Arial, sans-serif;
}

#app {
  max-width: 650px;
  margin: auto;
  padding: 15px;
}

.header {
  text-align: center;
  padding: 25px 8px;
  border-bottom: 2px solid #8d111b;
  margin-bottom: 22px;
}

.logo {
  color: #ff303c;
  font-size: 29px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow: 0 0 15px #e00020;
}

.subtitle {
  color: #aaa;
  letter-spacing: 4px;
  margin-top: 12px;
  font-size: 12px;
}

.panel {
  background: #181818;
  border: 1px solid #333;
  border-radius: 15px;
  padding: 18px;
  margin: 14px 0;
}

h2, h3 {
  margin-top: 0;
}

input {
  width: 100%;
  padding: 14px;
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #555;
  background: #080808;
  color: white;
  font-size: 15px;
}

button {
  width: 100%;
  padding: 14px;
  margin: 7px 0;
  border: 0;
  border-radius: 9px;
  background: #d71920;
  color: white;
  font-weight: bold;
  font-size: 15px;
}

button.secondary {
  background: #333;
}

button:disabled {
  opacity: 0.5;
}

.game-button {
  min-height: 115px;
  font-size: 21px;
  border: 1px solid #ff303c;
  background: linear-gradient(140deg, #380b10, #171717);
}

.game-icon {
  display: block;
  font-size: 30px;
  margin-bottom: 8px;
}

.small {
  color: #aaa;
  font-size: 13px;
}

#messages {
  height: 320px;
  overflow-y: auto;
  border: 1px solid #383838;
  border-radius: 10px;
  padding: 10px;
  margin: 12px 0;
}

.message {
  padding: 11px;
  margin: 9px 0;
  border-radius: 10px;
  background: #292929;
  overflow-wrap: anywhere;
}

.mine {
  background: #542025;
}

.chat-list button {
  background: #292929;
  text-align: left;
}

.footer {
  text-align: center;
  color: #777;
  padding: 20px;
}
`;

document.head.appendChild(design);

// COMMON HEADER
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

// LOGIN PAGE
function showLogin() {
  shell(`
    <div class="panel">
      <h2>PLAYER LOGIN</h2>

      <input
        id="email"
        type="email"
        placeholder="Enter email address"
      >

      <input
        id="password"
        type="password"
        placeholder="Enter password"
      >

      <button id="login">LOGIN</button>

      <button id="register" class="secondary">
        CREATE NEW ACCOUNT
      </button>

      <p class="small">
        Login to play tournaments and chat privately with NEXZORA Admin.
      </p>
    </div>
  `);

  document.getElementById('login').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  document.getElementById('register').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || password.length < 6) {
      alert('Email enter karo aur password kam se kam 6 characters ka rakho.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };
}

// PLAYER GAME SELECTION
function showPlayer() {
  shell(`
    <div class="panel">
      <h2>WELCOME PLAYER</h2>
      <p class="small">${currentUser.email || ''}</p>
      <button id="logout" class="secondary">LOGOUT</button>
    </div>

    <h2>SELECT YOUR GAME</h2>
    <p class="small">Choose your favourite game to see tournaments.</p>

    <div class="panel">
      <button class="game-button" id="freefire">
        <span class="game-icon">🔥</span>
        FREE FIRE
      </button>

      <button class="game-button" id="bgmi">
        <span class="game-icon">🎯</span>
        BGMI
      </button>
    </div>

    <div class="panel">
      <h3>PRIVATE SUPPORT CHAT</h3>
      <p class="small">Contact NEXZORA Admin privately.</p>
      <button id="my-chat">CHAT WITH ADMIN</button>
    </div>
  `);

  document.getElementById('logout').onclick =
    () => signOut(auth);

  document.getElementById('freefire').onclick =
    () => showTournaments('FREE FIRE');

  document.getElementById('bgmi').onclick =
    () => showTournaments('BGMI');

  document.getElementById('my-chat').onclick =
    () => openChat();
}

// TOURNAMENT PAGE
function showTournaments(game) {
  shell(`
    <div class="panel">
      <h2>${game} TOURNAMENTS</h2>
      <button id="back" class="secondary">
        ← BACK TO GAMES
      </button>
    </div>

    <div id="tournament-list"></div>

    <div class="panel">
      <button id="my-chat">CHAT WITH ADMIN</button>
    </div>
  `);

  document.getElementById('back').onclick = showPlayer;
  document.getElementById('my-chat').onclick = () => openChat();

  const list = document.getElementById('tournament-list');

  tournaments
    .filter(tournament => tournament.game === game)
    .forEach(tournament => {
      const card = document.createElement('div');
      card.className = 'panel';

      const title = document.createElement('h3');
      title.textContent = tournament.name;

      const details = document.createElement('p');
      details.textContent =
        `Mode: ${tournament.mode} | Entry: ${tournament.entry} | Prize: ${tournament.prize} | Time: ${tournament.time}`;

      const register = document.createElement('button');
      register.textContent = 'REGISTER';

      register.onclick = () => {
        openChat(
          `Hello Admin, I want to register for ${tournament.name}.`
        );
      };

      card.append(title, details, register);
      list.appendChild(card);
    });
}

// ADMIN PANEL
function showAdmin() {
  shell(`
    <div class="panel">
      <h2>NEXZORA ADMIN PANEL</h2>
      <p class="small">Admin: ${currentUser.email || ''}</p>
      <button id="logout" class="secondary">LOGOUT</button>
    </div>

    <div class="panel">
      <h3>PLAYER MESSAGES / PRIVATE INBOX</h3>
      <div id="chat-list">Loading chats...</div>
    </div>

    <div id="admin-chat"></div>
  `);

  document.getElementById('logout').onclick =
    () => signOut(auth);

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
          (data.lastMessage ? ' — ' + data.lastMessage : '');

        button.onclick = () => openChat('', chat.id);

        list.appendChild(button);
      });
    },
    error => {
      alert('Inbox error: ' + error.message);
    }
  );
}

// PRIVATE CHAT
function openChat(firstMessage = '', chatId = currentUser.uid) {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  const isAdmin = currentUser.uid === ADMIN_UID;

  const chatTarget = isAdmin
    ? document.getElementById('admin-chat')
    : app;

  if (!chatTarget) return;

  if (!isAdmin) {
    shell(`
      <div class="panel">
        <h2>PRIVATE ADMIN CHAT</h2>
        <p class="small">
          Only you and NEXZORA Admin can see this conversation.
        </p>

        <button id="back" class="secondary">← BACK</button>

        <div id="messages"></div>

        <input
          id="message-input"
          maxlength="2000"
          placeholder="Type your message..."
        >

        <button id="send">SEND MESSAGE</button>
      </div>
    `);

    document.getElementById('back').onclick = () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
      showPlayer();
    };
  } else {
    chatTarget.innerHTML = `
      <div class="panel">
        <h3>PRIVATE PLAYER CONVERSATION</h3>

        <button id="close-chat" class="secondary">
          ← BACK TO INBOX
        </button>

        <div id="messages"></div>

        <input
          id="message-input"
          maxlength="2000"
          placeholder="Write your reply..."
        >

        <button id="send">SEND REPLY</button>
      </div>
    `;

    document.getElementById('close-chat').onclick = () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
      document.getElementById('admin-chat').innerHTML = '';
    };
  }

  const messagesBox = document.getElementById('messages');
  const input = document.getElementById('message-input');
  const send = document.getElementById('send');

  const chatRef = doc(db, 'chats', chatId);

  if (!isAdmin) {
    setDoc(chatRef, {
      uid: currentUser.uid,
      playerEmail: currentUser.email || '',
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(error => {
      alert('Chat setup error: ' + error.message);
    });
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
        bubble.className = 'message';

        if (data.senderUid === currentUser.uid) {
          bubble.classList.add('mine');
        }

        const sender = document.createElement('strong');

        sender.textContent =
          data.senderUid === ADMIN_UID
            ? 'NEXZORA ADMIN'
            : 'PLAYER';

        const text = document.createElement('p');
        text.textContent = data.text || '';

        bubble.append(sender, text);
        messagesBox.appendChild(bubble);
      });

      messagesBox.scrollTop = messagesBox.scrollHeight;
    },
    error => {
      alert('Chat error: ' + error.message);
    }
  );

  send.onclick = async () => {
    const messageText = input.value.trim();

    if (!messageText) return;

    send.disabled = true;

    try {
      await addDoc(
        collection(db, 'chats', chatId, 'messages'),
        {
          senderUid: currentUser.uid,
          text: messageText,
          createdAt: serverTimestamp()
        }
      );

      await setDoc(chatRef, {
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      }, { merge: true });

      input.value = '';

    } catch (error) {
      alert('Message send nahi hua: ' + error.message);
    } finally {
      send.disabled = false;
    }
  };

  if (firstMessage && !isAdmin) {
    input.value = firstMessage;
  }
}

// AUTHENTICATION CHECK
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
    return;
  }

  if (user.uid === ADMIN_UID) {
    showAdmin();
  } else {
    showPlayer();
  }
});
    
