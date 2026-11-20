
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
  getDocs,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

// FIREBASE
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
  { name: 'FREE FIRE SOLO', mode: 'Solo' },
  { name: 'FREE FIRE DUO', mode: 'Duo' },
  { name: 'FREE FIRE SQUAD', mode: 'Squad' }
];

const app = document.getElementById('app');

let currentUser = null;
let unsubscribeMessages = null;
let unsubscribeChats = null;
let unsubscribeLive = null;
let unsubscribeScores = null;
let deletingChat = false;

// DESIGN
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
.game-button{min-height:75px;font-size:21px;background:linear-gradient(140deg,#430b12,#171717);border:1px solid #a91b28}
.small{color:#aaa;font-size:13px}
#messages{height:390px;overflow-y:auto;padding:10px;border:1px solid #333;border-radius:12px;margin:12px 0}
.message{max-width:90%;padding:13px;margin:12px 0;border-radius:16px;background:#262626;overflow-wrap:anywhere}
.mine{margin-left:auto;background:#5539d9}
.message-name{font-size:11px;color:#bbb;margin-bottom:7px}
.message-text{white-space:pre-wrap;line-height:1.4}
.footer{text-align:center;color:#777;padding:20px}
.home-actions{display:flex;justify-content:flex-end;gap:9px;margin:8px 0 16px}
.home-actions button{width:auto;padding:10px 15px;margin:0}
.hero-live{background:linear-gradient(135deg,#4a0712,#171717);border:1px solid #c51d31;border-radius:16px;padding:18px;margin:12px 0}
.hero-live h2{color:#ff4055;margin-bottom:8px}
.live-frame{width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000;margin-top:12px}
.score-row{display:flex;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #333}
.score-row:last-child{border-bottom:0}
.score-rank{color:#ff4055;font-weight:900;min-width:28px}
.score-name{flex:1;overflow-wrap:anywhere}
.score-points{font-weight:bold;color:#ffd36a}
.admin-delete{width:auto;padding:8px 10px;background:#333}
.chat-list button{text-align:left;background:#292929}
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

function stopListeners() {
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeChats) unsubscribeChats();
  if (unsubscribeLive) unsubscribeLive();
  if (unsubscribeScores) unsubscribeScores();

  unsubscribeMessages = null;
  unsubscribeChats = null;
  unsubscribeLive = null;
  unsubscribeScores = null;
}

// LOGIN
function showLogin() {
  stopListeners();

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
    } catch (error) {
      alert(error.message);
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
    } catch (error) {
      alert(error.message);
    }
  };
}

// PLAYER HOME
function showPlayer() {
  stopListeners();

  shell(`
    <div class="home-actions">
      <button class="secondary" id="profile">👤 PROFILE</button>
      <button class="secondary" id="chat">💬 CHAT</button>
    </div>

    <div class="panel">
      <h2>WELCOME TO NEXZORA</h2>
      <p class="small" id="player-email"></p>
    </div>

    <section class="hero-live">
      <h2>🔴 WATCH LIVE MATCH</h2>
      <p class="small" id="live-description">Free Fire live match stream</p>
      <div id="live-player" class="small" style="margin:12px 0">
        Checking live match...
      </div>
      <button id="watch-live" disabled>WATCH LIVE MATCH</button>
    </section>

    <div class="panel">
      <h2>🏆 PLAYER SCORE LIST</h2>
      <div id="score-list" class="small">Loading scores...</div>
    </div>

    <div class="panel">
      <h2>🔥 FREE FIRE TOURNAMENTS</h2>
      <p class="small">Choose your mode and register.</p>
      <button class="game-button" id="freefire">
        FREE FIRE TOURNAMENTS
      </button>
    </div>

    <button class="secondary" id="logout">LOGOUT</button>
  `);

  document.getElementById('player-email').textContent =
    currentUser.email || '';

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('chat').onclick = () => openPlayerChat();
  document.getElementById('profile').onclick = showProfile;
  document.getElementById('freefire').onclick = showTournaments;
  document.getElementById('watch-live').onclick = openLiveMatch;

  listenToLiveMatch();
  listenToScores();
}

// PROFILE
function showProfile() {
  stopListeners();

  shell(`
    <div class="panel">
      <h2>PLAYER PROFILE</h2>
      <p class="small" id="profile-email"></p>
      <p class="small" id="profile-id"></p>
      <button class="secondary" id="back">← BACK HOME</button>
      <button id="logout">LOGOUT</button>
    </div>
  `);

  document.getElementById('profile-email').textContent =
    'Email: ' + (currentUser.email || 'Not available');

  document.getElementById('profile-id').textContent =
    'Player ID: ' + currentUser.uid;

  document.getElementById('back').onclick = showPlayer;
  document.getElementById('logout').onclick = () => signOut(auth);
}

// LIVE MATCH
function listenToLiveMatch() {
  if (unsubscribeLive) unsubscribeLive();

  unsubscribeLive = onSnapshot(
    doc(db, 'settings', 'liveMatch'),
    snapshot => {
      const desc = document.getElementById('live-description');
      const player = document.getElementById('live-player');
      const button = document.getElementById('watch-live');

      if (!desc || !player || !button) return;

      const data = snapshot.exists() ? snapshot.data() : {};

      desc.textContent = data.title || 'Free Fire live match stream';
      player.textContent = data.url
        ? 'Live match link is ready.'
        : 'No live match is available right now.';

      button.disabled = !data.url;
      button.dataset.url = data.url || '';
    },
    error => {
      console.error(error);
      const player = document.getElementById('live-player');
      if (player) player.textContent = 'Live match could not be loaded.';
    }
  );
}

function getYouTubeEmbed(url) {
  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace('/', '');
    } else if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v') || '';

      if (!videoId && parsed.pathname.includes('/live/')) {
        videoId = parsed.pathname.split('/live/')[1].split('/')[0];
      }

      if (!videoId && parsed.pathname.includes('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1].split('/')[0];
      }
    }

    if (!videoId) return '';

    return 'https://www.youtube.com/embed/' + videoId;
  } catch {
    return '';
  }
}

function openLiveMatch() {
  const button = document.getElementById('watch-live');
  const url = button?.dataset.url;

  if (!url) {
    alert('Abhi koi live match link available nahi hai.');
    return;
  }

  try {
    const parsed = new URL(url);

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL');
    }

    const embed = getYouTubeEmbed(parsed.href);
    const player = document.getElementById('live-player');

    if (embed && player) {
      player.innerHTML = '';

      const frame = document.createElement('iframe');
      frame.className = 'live-frame';
      frame.src = embed;
      frame.title = 'NEXZORA Free Fire Live Match';
      frame.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;

      player.appendChild(frame);
    } else {
      window.open(parsed.href, '_blank');
    }
  } catch {
    alert('Admin ne jo live link diya hai woh valid nahi hai.');
  }
}

// PLAYER SCORE LIST
function listenToScores() {
  if (unsubscribeScores) unsubscribeScores();

  unsubscribeScores = onSnapshot(
    query(collection(db, 'leaderboard'), orderBy('score', 'desc')),
    snapshot => {
      const list = document.getElementById('score-list');
      if (!list) return;

      list.innerHTML = '';

      if (snapshot.empty) {
        list.textContent = 'Scores abhi add nahi hue hain.';
        return;
      }

      snapshot.docs.forEach((item, index) => {
        const data = item.data();
        const row = document.createElement('div');
        row.className = 'score-row';

        const rank = document.createElement('span');
        rank.className = 'score-rank';
        rank.textContent = '#' + (index + 1);

        const name = document.createElement('span');
        name.className = 'score-name';
        name.textContent = data.playerName || 'Player';

        const points = document.createElement('span');
        points.className = 'score-points';
        points.textContent = (Number(data.score) || 0) + ' pts';

        row.append(rank, name, points);

        if (data.prize) {
          const prize = document.createElement('span');
          prize.className = 'small';
          prize.textContent = ' • ' + data.prize;
          row.appendChild(prize);
        }

        list.appendChild(row);
      });
    },
    error => {
      const list = document.getElementById('score-list');
      if (list) {
        list.textContent = 'Score list load nahi hui. Firestore Rules check karein.';
      }
      console.error(error);
    }
  );
}

// TOURNAMENTS
function showTournaments() {
  stopListeners();

  shell(`
    <div class="panel">
      <h2>FREE FIRE TOURNAMENTS</h2>
      <button class="secondary" id="back">← BACK HOME</button>
    </div>
    <div id="tournament-list"></div>
    <button id="chat">CHAT WITH NEXZORA</button>
  `);

  document.getElementById('back').onclick = showPlayer;
  document.getElementById('chat').onclick = () => openPlayerChat();

  const list = document.getElementById('tournament-list');

  tournaments.forEach(tournament => {
    const card = document.createElement('div');
    card.className = 'panel';

    const title = document.createElement('h3');
    title.textContent = tournament.name;

    const details = document.createElement('p');
    details.textContent = `Mode: ${tournament.mode} | Entry: FREE`;

    const button = document.createElement('button');
    button.textContent = 'REGISTER';

    button.onclick = () => openPlayerChat(
      `I want to register for ${tournament.name}.`
    );

    card.append(title, details, button);
    list.appendChild(card);
  });
}

// ADMIN PANEL
function showAdmin() {
  stopListeners();

  shell(`
    <div class="panel">
      <h2>NEXZORA ADMIN PANEL</h2>
      <p class="small" id="admin-email"></p>
      <button class="secondary" id="logout">LOGOUT</button>
    </div>

    <div class="panel">
      <h3>🔴 LIVE MATCH CONTROL</h3>
      <input id="live-title" maxlength="100" placeholder="Match title">
      <input id="live-url" type="url" placeholder="YouTube / live stream URL">
      <button id="save-live">SAVE LIVE MATCH LINK</button>
      <p class="small">Player app mein Watch Live Match se link open hoga.</p>
    </div>

    <div class="panel">
      <h3>🏆 ADD PLAYER SCORE</h3>
      <input id="score-name" maxlength="60" placeholder="Player name">
      <input id="score-value" type="number" min="0" placeholder="Score">
      <input id="score-prize" maxlength="100" placeholder="Prize (optional)">
      <button id="add-score">ADD TO SCORE LIST</button>
      <div id="admin-scores" class="small"></div>
    </div>

    <div class="panel">
      <h3>PRIVATE PLAYER INBOX</h3>
      <div id="chat-list" class="chat-list">Loading...</div>
    </div>

    <div id="admin-chat"></div>
  `);

  document.getElementById('admin-email').textContent =
    currentUser.email || '';

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('save-live').onclick = saveLiveMatch;
  document.getElementById('add-score').onclick = addPlayerScore;

  listenToAdminScores();

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
          (data.playerEmail || 'Player') + ' — ' +
          (data.lastMessage || 'Open conversation');

        button.onclick = () => openAdminChat(chat.id);
        list.appendChild(button);
      });
    },
    error => console.error(error)
  );
}

// ADMIN SAVE LIVE MATCH
async function saveLiveMatch() {
  const title = document.getElementById('live-title').value.trim();
  const url = document.getElementById('live-url').value.trim();

  if (!url) {
    alert('Live match URL enter karo.');
    return;
  }

  try {
    const parsed = new URL(url);

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL');
    }

    await setDoc(doc(db, 'settings', 'liveMatch'), {
      title: title || 'Free Fire Live Match',
      url: parsed.href,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    alert('Live match link save ho gaya.');
  } catch (error) {
    alert('Link save nahi hua: ' + error.message);
  }
}

// ADMIN ADD SCORE
async function addPlayerScore() {
  const name = document.getElementById('score-name').value.trim();
  const score = Number(document.getElementById('score-value').value);
  const prize = document.getElementById('score-prize').value.trim();

  if (!name || !Number.isFinite(score) || score < 0) {
    alert('Player name aur valid score enter karo.');
    return;
  }

  try {
    await addDoc(collection(db, 'leaderboard'), {
      playerName: name,
      score,
      prize,
      createdAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    document.getElementById('score-name').value = '';
    document.getElementById('score-value').value = '';
    document.getElementById('score-prize').value = '';

    alert('Player score add ho gaya.');
  } catch (error) {
    alert('Score add nahi hua: ' + error.message);
  }
}

// ADMIN SCORE MANAGEMENT
function listenToAdminScores() {
  if (unsubscribeScores) unsubscribeScores();

  unsubscribeScores = onSnapshot(
    query(collection(db, 'leaderboard'), orderBy('score', 'desc')),
    snapshot => {
      const area = document.getElementById('admin-scores');
      if (!area) return;

      area.innerHTML = '';

      snapshot.forEach(item => {
        const data = item.data();
        const row = document.createElement('div');
        row.className = 'score-row';

        const label = document.createElement('span');
        label.className = 'score-name';
        label.textContent =
          (data.playerName || 'Player') + ' — ' +
          data.score + ' pts' +
          (data.prize ? ' • ' + data.prize : '');

        const remove = document.createElement('button');
        remove.className = 'admin-delete';
        remove.textContent = 'DELETE';

        remove.onclick = async () => {
          if (!confirm('Is player ka score delete karein?')) return;

          try {
            await deleteDoc(doc(db, 'leaderboard', item.id));
          } catch (error) {
            alert(error.message);
          }
        };

        row.append(label, remove);
        area.appendChild(row);
      });
    },
    error => console.error(error)
  );
}

// CHAT MESSAGE HELPERS
async function updateChatInfo(chatId, message) {
  await setDoc(doc(db, 'chats', chatId), {
    playerEmail: currentUser.email || 'Player',
    lastMessage: message,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function sendChatMessage(chatId, message, isAdmin = false) {
  const cleanMessage = message.trim();

  if (!cleanMessage) return;

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid: currentUser.uid,
    senderName: isAdmin ? 'NEXZORA ADMIN' : 'PLAYER',
    text: cleanMessage,
    system: false,
    createdAt: serverTimestamp()
  });

  await updateChatInfo(chatId, cleanMessage);
}

function listenToMessages(chatId) {
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(
    query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    ),
    snapshot => {
      const area = document.getElementById('messages');
      if (!area) return;

      area.innerHTML = '';

      snapshot.forEach(item => {
        const data = item.data();

        const message = document.createElement('div');
        message.className =
          'message' +
          (data.senderUid === currentUser.uid ? ' mine' : '');

        const name = document.createElement('div');
        name.className = 'message-name';
        name.textContent = data.senderName ||
          (data.system ? 'SYSTEM' : 'MESSAGE');

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = data.text || '';

        message.append(name, text);
        area.appendChild(message);
      });

      area.scrollTop = area.scrollHeight;
    },
    error => {
      console.error(error);
      const area = document.getElementById('messages');
      if (area) area.textContent = 'Messages load nahi hue. Rules check karein.';
    }
  );
}

// PLAYER CHAT
async function openPlayerChat(firstMessage = '') {
  stopListeners();

  const chatId = currentUser.uid;
  shell(`
    <div class="panel">
      <h2>💬 PLAYER CHAT</h2>
      <p class="small">Admin ko message bhejo. Chat se exit karne par conversation clear ho jayegi.</p>
      <div id="messages" class="messages"></div>
      <input id="chat-input" maxlength="500" placeholder="Type your message...">
      <button id="send-chat">SEND MESSAGE</button>
      <button class="secondary" id="exit-chat">EXIT CHAT</button>
    </div>
  `);

  listenToMessages(chatId);

  document.getElementById('send-chat').onclick = async () => {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    try {
      await sendChatMessage(chatId, message);
      input.value = '';
    } catch (error) {
      alert('Message send nahi hua: ' + error.message);
    }
  };

  document.getElementById('chat-input').addEventListener('keydown', event => {
    if (event.key === 'Enter') document.getElementById('send-chat').click();
  });

  document.getElementById('exit-chat').onclick = async () => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    try {
      const messages = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      messages.forEach(item => batch.delete(item.ref));
      batch.delete(doc(db, 'chats', chatId));
      await batch.commit();
    } catch (error) {
      console.error('Chat cleanup failed:', error);
      alert('Chat clear nahi ho payi. Firestore rules check karein.');
    }
    showPlayer();
  };

  if (firstMessage) {
    const input = document.getElementById('chat-input');
    input.value = firstMessage;
  }
}

function openAdminChat(chatId) {
  const holder = document.getElementById('admin-chat');
  if (!holder) return;

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  holder.innerHTML = `
    <div class="panel">
      <h3>PLAYER CONVERSATION</h3>
      <div id="messages" class="messages"></div>
      <input id="admin-chat-input" maxlength="500" placeholder="Reply to player...">
      <button id="admin-send-chat">SEND REPLY</button>
      <button class="secondary" id="close-admin-chat">CLOSE CHAT</button>
    </div>
  `;

  listenToMessages(chatId);

  document.getElementById('admin-send-chat').onclick = async () => {
    const input = document.getElementById('admin-chat-input');
    const message = input.value.trim();
    if (!message) return;
    try {
      await sendChatMessage(chatId, message, true);
      input.value = '';
    } catch (error) {
      alert('Reply send nahi hua: ' + error.message);
    }
  };

  document.getElementById('close-admin-chat').onclick = () => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    holder.innerHTML = '';
  };
}

// AUTH ROUTING
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (!user) {
    stopListeners();
    showLogin();
    return;
  }

  if (user.uid === ADMIN_UID) {
    showAdmin();
  } else {
    showPlayer();
  }
});
