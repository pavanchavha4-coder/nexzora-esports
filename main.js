
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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(firebaseApp);

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

style.textContent += `
/* NEXZORA ULTRA PREMIUM: white / black / red */
:root{color-scheme:dark;--nx-red:#e51d36;--nx-red2:#a80d24;--nx-white:#f7f7f8;--nx-muted:#a7a7ad;--nx-card:#141416;--nx-line:#29292e}
body{margin:0;background:#080809;color:var(--nx-white);font-family:Inter,system-ui,-apple-system,Arial,sans-serif;-webkit-tap-highlight-color:transparent}
#app{max-width:760px;margin:0 auto;min-height:100vh;padding:0 16px 28px}
.header{background:#09090b;border-bottom:1px solid #3c1119;padding:20px 10px;margin:0 -16px 16px;position:relative}
.logo{color:#fff;font-size:27px;letter-spacing:2.4px;text-shadow:0 0 18px rgba(229,29,54,.35)}
.logo:after{content:'  •';color:var(--nx-red)}
.subtitle{color:#aaa;letter-spacing:3px;font-size:10px}
.panel{background:linear-gradient(145deg,#18181b,#101012);border:1px solid #303035;border-radius:18px;box-shadow:0 12px 34px #0008}
button{background:linear-gradient(110deg,#a90f28,#ed263f);color:#fff;border:1px solid #e33a4e;border-radius:12px;font-weight:800;letter-spacing:.4px}
button.secondary{background:#19191d;border:1px solid #3a3a40;color:#eee}
input{background:#0c0c0e;border:1px solid #36363c;color:#fff;border-radius:12px}
.welcome-banner,.admin-hero{background:linear-gradient(135deg,#f7f7f8 0%,#dedee2 100%);color:#101014;border:1px solid #fff;border-radius:20px;box-shadow:0 12px 30px #0005}
.welcome-banner p,.admin-hero p{color:#444}
.welcome-banner h1,.admin-hero h1{color:#111}
.welcome-banner h1 em,.admin-hero h1 em{color:#d71932;text-shadow:none}
.eyebrow,.section-kicker{color:#d71932}
.game-tag{background:#111;color:#fff;border-color:#d71932}
.score-row{background:#101013;border:1px solid #29292e;border-radius:12px}
.score-rank,.score-points{color:#ff5368}
.admin-nav{background:#09090bf2}
.admin-nav-btn.active{background:linear-gradient(110deg,#a90f28,#ed263f)!important}
.messages{height:calc(100dvh - 178px);min-height:220px;max-height:none;overflow-y:auto;background:#09090b;border:0;border-radius:0;margin:0;padding:16px 13px 20px;overscroll-behavior:contain}
.message{background:#202024;border:1px solid #303036;border-radius:18px 18px 18px 5px;max-width:82%;padding:11px 13px;margin:9px 0}
.message.mine{background:linear-gradient(135deg,#a90f28,#d91d37);border-color:#ed5264;border-radius:18px 18px 5px 18px}
.message-name{color:#ff9aa7}
.message-text{color:#fff;font-size:14px}
.chat-mode #app{max-width:none;padding:0;min-height:100dvh}
.chat-mode .header,.chat-mode .footer{display:none}
.chat-screen{height:100dvh;height:100dvh;display:flex;flex-direction:column;background:#09090b;overflow:hidden}
.chat-topbar{height:62px;flex:0 0 62px;display:flex;align-items:center;gap:12px;padding:0 14px;background:#111113;border-bottom:1px solid #29292e}
.chat-back{width:42px;height:42px;padding:0;margin:0;background:#202024;border:1px solid #39393f;font-size:20px}
.chat-title{font-weight:900;letter-spacing:.5px;font-size:15px}
.chat-subtitle{font-size:10px;color:#a6a6ad;margin-top:3px}
.chat-composer{display:flex;align-items:center;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#111113;border-top:1px solid #29292e;flex:0 0 auto}
.chat-composer input{flex:1;min-width:0;margin:0;padding:13px 14px;border-radius:22px;background:#202024;border:1px solid #39393f}
.chat-send{width:48px;height:46px;flex:0 0 48px;margin:0;padding:0;border-radius:50%;font-size:18px}
.chat-attach{width:44px;height:44px;flex:0 0 44px;margin:0;padding:0;border-radius:50%;background:#202024;border:1px solid #39393f;font-size:19px}
.chat-image{display:block;max-width:min(260px,70vw);max-height:300px;border-radius:12px;margin-top:8px;object-fit:cover}
.auto-replies{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
.auto-replies button{width:auto;margin:0;padding:9px 11px;font-size:11px;background:#222226;border:1px solid #4a3035}
.chat-mode .admin-auto-wrap{padding:8px 12px;background:#111113;border-top:1px solid #28282d}
.chat-mode .messages{flex:1;min-height:0}
.chat-mode .chat-composer{flex:0 0 auto}
body,body *{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
input,textarea,[contenteditable=true]{-webkit-user-select:text;user-select:text}
@media(min-width:700px){.chat-screen{max-width:900px;margin:0 auto;border-left:1px solid #28282d;border-right:1px solid #28282d}}
`;
document.head.appendChild(style);
document.addEventListener('contextmenu',event=>{if(!event.target.closest('input,textarea,[contenteditable=true]'))event.preventDefault();});

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
    <div class="top-actions">
      <button class="icon-action" id="profile" aria-label="Profile">👤<span>PROFILE</span></button>
      <button class="icon-action" id="chat" aria-label="Chat">💬<span>CHAT</span></button>
    </div>

    <section class="welcome-banner">
      <span class="eyebrow">WELCOME TO</span>
      <h1>NEXZORA <em>ESPORTS</em></h1>
      <p>Compete with champions. Rise on the leaderboard.</p>
      <span class="game-tag">🔥 FREE FIRE ARENA</span>
    </section>

    <section class="panel join-card">
      <span class="section-kicker">FREE FIRE ARENA</span>
      <h2>READY TO COMPETE?</h2>
      <p class="small">Tournament details aur registration ke liye admin se connect karo.</p>
      <button id="join-now" class="join-now-btn">JOIN NOW <span>→</span></button>
    </section>

    <div class="panel premium-panel">
      <div class="panel-heading"><div><span class="section-kicker">TOP PLAYERS</span><h2>🏆 PLAYER SCORE LIST</h2></div><span class="live-dot">LIVE</span></div>
      <div id="score-list" class="small">Loading scores...</div>
    </div>

    <button class="secondary logout-wide" id="logout">LOGOUT</button>
  `);

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('chat').onclick = () => openPlayerChat();
  document.getElementById('profile').onclick = showProfile;
  document.getElementById('join-now').onclick = () => openPlayerChat('I want to join the Free Fire tournament. Please share the details.');

  listenToScores();
}

// PROFILE
function showProfile() {
  stopListeners();

  shell(`
    <div class="page-toolbar"><button class="secondary" id="back">← HOME</button><span class="section-kicker">PLAYER ACCOUNT</span></div>
    <section class="profile-hero">
      <div class="profile-avatar">👤</div>
      <span class="section-kicker">NEXZORA MEMBER</span>
      <h2>PLAYER PROFILE</h2>
      <p class="small">Your account details and player identity</p>
    </section>
    <div class="panel profile-details">
      <div class="detail-label">REGISTERED EMAIL</div>
      <div class="detail-value" id="profile-email"></div>
      <div class="detail-label">PLAYER ID</div>
      <div class="detail-value id-value" id="profile-id"></div>
      <button class="game-button" id="profile-chat">💬 CONTACT NEXZORA</button>
      <button class="secondary logout-wide" id="logout">LOGOUT FROM ACCOUNT</button>
    </div>
  `);

  document.getElementById('profile-email').textContent =
    currentUser.email || 'Not available';
  document.getElementById('profile-id').textContent = currentUser.uid;
  document.getElementById('back').onclick = showPlayer;
  document.getElementById('profile-chat').onclick = () => openPlayerChat();
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

      snapshot.docs.slice(0, 10).forEach((item, index) => {
        const data = item.data();
        const row = document.createElement('div');
        row.className = 'score-row rank-' + (index + 1);

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
    <section class="admin-hero">
      <span class="section-kicker">NEXZORA CONTROL CENTER</span>
      <h1>ADMIN <em>DASHBOARD</em></h1>
      <p>Manage your esports community from one place.</p>
    </section>

    <div class="admin-nav">
      <button class="admin-nav-btn active" data-target="admin-overview">OVERVIEW</button>
      <button class="admin-nav-btn" data-target="admin-scores-section">SCORES</button>
      <button class="admin-nav-btn" data-target="admin-inbox">PLAYER CHAT</button>
    </div>

    <section id="admin-overview" class="admin-section">
      <div class="admin-stat-grid">
        <div class="admin-stat"><span>🎮</span><b>FREE FIRE</b><small>ACTIVE GAME</small></div>
        <div class="admin-stat"><span>🏆</span><b>LEADERBOARD</b><small>PLAYER RANKING</small></div>
        <div class="admin-stat"><span>📡</span><b>LIVE CONTROL</b><small>STREAM SETTINGS</small></div>
        <div class="admin-stat"><span>💬</span><b>PLAYER SUPPORT</b><small>PRIVATE INBOX</small></div>
      </div>
      <div class="panel premium-panel">
        <span class="section-kicker">QUICK ACTIONS</span>
        <h2>MANAGE YOUR ARENA</h2>
        <button class="secondary admin-jump" data-target="admin-scores-section">🏆 MANAGE PLAYER SCORES</button>
        <button class="secondary admin-jump" data-target="admin-inbox">💬 OPEN PLAYER INBOX</button>
      </div>
    </section>

    <section id="admin-scores-section" class="admin-section" hidden>
      <div class="panel premium-panel">
        <span class="section-kicker">RANKING MANAGEMENT</span>
        <h2>🏆 ADD PLAYER SCORE</h2>
        <input id="score-name" maxlength="60" placeholder="Player name">
        <input id="score-value" type="number" min="0" placeholder="Score / points">
        <input id="score-prize" maxlength="100" placeholder="Prize (optional)">
        <button id="add-score">ADD TO LEADERBOARD</button>
        <div id="admin-scores" class="small"></div>
      </div>
    </section>

    <section id="admin-inbox" class="admin-section" hidden>
      <div class="panel premium-panel">
        <span class="section-kicker">PLAYER SUPPORT</span>
        <h2>💬 PRIVATE PLAYER INBOX</h2>
        <p class="small">Player ko reply karo ya quick auto-message bhejo.</p>
        <div id="chat-list" class="chat-list">Loading...</div>
      </div>
      <div id="admin-chat"></div>
    </section>

    <div class="admin-footer-actions">
      <button class="secondary admin-logout" id="logout">LOGOUT</button>
    </div>
  `);

  document.getElementById('logout').onclick = () => signOut(auth);
  document.getElementById('add-score').onclick = addPlayerScore;

  const showSection = id => {
    document.querySelectorAll('.admin-section').forEach(section => {
      section.hidden = section.id !== id;
    });
    document.querySelectorAll('.admin-nav-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.target === id);
    });
  };
  document.querySelectorAll('.admin-nav-btn, .admin-jump').forEach(button => {
    button.onclick = () => showSection(button.dataset.target);
  });

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
        button.className = 'inbox-item';
        button.textContent = (data.playerEmail || 'Player') + ' — ' +
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
    playerUid: chatId,
    playerEmail: currentUser.email || 'Player',
    lastMessage: message || '📷 Image',
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function uploadChatImage(file, chatId) {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('Sirf image upload kar sakte ho.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image 5 MB se chhoti honi chahiye.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const target = storageRef(storage, `chat-uploads/${chatId}/${Date.now()}-${safeName}`);
  const uploaded = await uploadBytes(target, file, { contentType: file.type });
  return await getDownloadURL(uploaded.ref);
}

async function sendChatMessage(chatId, message, isAdmin = false, imageUrl = '') {
  const cleanMessage = message.trim();
  if (!cleanMessage && !imageUrl) return;

  await setDoc(doc(db, 'chats', chatId), {
    playerUid: chatId,
    playerEmail: isAdmin ? 'Player' : (currentUser.email || 'Player'),
    lastMessage: cleanMessage || '📷 Image',
    updatedAt: serverTimestamp()
  }, { merge: true });

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid: currentUser.uid,
    senderName: isAdmin ? 'NEXZORA ADMIN' : 'PLAYER',
    text: cleanMessage,
    imageUrl,
    system: false,
    createdAt: serverTimestamp()
  });
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
        message.appendChild(name);
        if (data.text) message.appendChild(text);
        if (data.imageUrl) {
          const image = document.createElement('img');
          image.className = 'chat-image';
          image.src = data.imageUrl;
          image.alt = 'Chat image';
          image.loading = 'lazy';
          image.addEventListener('click', () => window.open(data.imageUrl, '_blank'));
          message.appendChild(image);
        }
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
  document.body.classList.add('chat-mode');
  shell(`
    <section class="chat-screen">
      <header class="chat-topbar">
        <button class="chat-back" id="exit-chat" aria-label="Back">‹</button>
        <div><div class="chat-title">NEXZORA SUPPORT</div><div class="chat-subtitle">PRIVATE PLAYER CHAT</div></div>
      </header>
      <div id="messages" class="messages"></div>
      <form class="chat-composer" id="player-chat-form">
        <input id="chat-image-file" type="file" accept="image/*" hidden>
        <button type="button" class="chat-attach" id="attach-image" aria-label="Upload image">＋</button>
        <input id="chat-input" maxlength="500" placeholder="Message..." autocomplete="off">
        <button type="submit" class="chat-send" aria-label="Send">➤</button>
      </form>
    </section>
  `);

  listenToMessages(chatId);
  document.getElementById('attach-image').onclick = () => document.getElementById('chat-image-file').click();
  document.getElementById('player-chat-form').onsubmit = async event => {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const fileInput = document.getElementById('chat-image-file');
    const message = input.value.trim();
    const file = fileInput.files[0];
    if (!message && !file) return;
    const sendButton = document.querySelector('.chat-send');
    sendButton.disabled = true;
    try {
      const imageUrl = file ? await uploadChatImage(file, chatId) : '';
      await sendChatMessage(chatId, message, false, imageUrl);
      input.value = '';
      fileInput.value = '';
    } catch (error) {
      alert('Message/image send nahi hua: ' + error.message);
    } finally {
      sendButton.disabled = false;
    }
  };

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
    document.body.classList.remove('chat-mode');
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
  document.body.classList.add('chat-mode');

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  holder.innerHTML = `
    <section class="chat-screen">
      <header class="chat-topbar">
        <button class="chat-back" id="close-admin-chat" aria-label="Back">‹</button>
        <div><div class="chat-title">PLAYER CONVERSATION</div><div class="chat-subtitle">NEXZORA ADMIN INBOX</div></div>
      </header>
      <div id="messages" class="messages"></div>
      <div class="admin-auto-wrap">
        <div class="small">AUTO MESSAGES · TAP TO SEND</div>
        <div class="auto-replies">
          <button type="button" data-auto="Welcome to NEXZORA eSports! How can we help you?">Welcome</button>
          <button type="button" data-auto="Your tournament registration request has been received.">Registration received</button>
          <button type="button" data-auto="Your match details will be shared here shortly.">Match details soon</button>
          <button type="button" data-auto="Thank you for contacting NEXZORA Support.">Thank you</button>
        </div>
      </div>
      <form class="chat-composer" id="admin-chat-form">
        <input id="admin-image-file" type="file" accept="image/*" hidden>
        <button type="button" class="chat-attach" id="admin-attach-image" aria-label="Upload image">＋</button>
        <input id="admin-chat-input" maxlength="500" placeholder="Reply..." autocomplete="off">
        <button type="submit" class="chat-send" aria-label="Send">➤</button>
      </form>
    </section>
  `;

  listenToMessages(chatId);
  document.getElementById('admin-attach-image').onclick = () => document.getElementById('admin-image-file').click();
  document.querySelectorAll('[data-auto]').forEach(button => {
    button.onclick = async () => {
      try { await sendChatMessage(chatId, button.dataset.auto, true); }
      catch (error) { alert('Auto message send nahi hua: ' + error.message); }
    };
  });
  document.getElementById('admin-chat-form').onsubmit = async event => {
    event.preventDefault();
    const input = document.getElementById('admin-chat-input');
    const fileInput = document.getElementById('admin-image-file');
    const message = input.value.trim();
    const file = fileInput.files[0];
    if (!message && !file) return;
    const sendButton = document.querySelector('.chat-send');
    sendButton.disabled = true;
    try {
      const imageUrl = file ? await uploadChatImage(file, chatId) : '';
      await sendChatMessage(chatId, message, true, imageUrl);
      input.value = '';
      fileInput.value = '';
    } catch (error) {
      alert('Reply/image send nahi hua: ' + error.message);
    } finally {
      sendButton.disabled = false;
    }
  };

  document.getElementById('close-admin-chat').onclick = () => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    holder.innerHTML = '';
    document.body.classList.remove('chat-mode');
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
