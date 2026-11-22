
import './style.css';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  where,
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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

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
let unsubscribePlayers = null;
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
.join-card{padding:18px 18px 16px;background:linear-gradient(135deg,#f4f4f5,#d9d9de);color:#111;border:1px solid #fff}
.join-card h2{color:#111;margin:4px 0 7px}
.join-card .small{color:#4b4b51}
.join-now-btn{width:auto;min-width:132px;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:10px 18px;font-size:12px;margin:12px 0 0}
.join-now-btn span{font-size:17px;line-height:10px}

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
  if (unsubscribePlayers) unsubscribePlayers();
  if (unsubscribeLive) unsubscribeLive();
  if (unsubscribeScores) unsubscribeScores();

  unsubscribeMessages = null;
  unsubscribeChats = null;
  unsubscribePlayers = null;
  unsubscribeLive = null;
  unsubscribeScores = null;
}

// LOGIN
function showLogin() {
  stopListeners();

  shell(`
    <div class="panel">
      <h2 id="auth-heading">PLAYER LOGIN</h2>
      <input id="username" type="text" maxlength="20" placeholder="Username" autocomplete="username">
      <input id="email" type="email" placeholder="Email address" autocomplete="email">
      <input id="password" type="password" placeholder="Password" autocomplete="current-password">
      <button id="login">LOGIN</button>
      <button id="register" class="secondary">CREATE NEW ACCOUNT</button>
      <button id="cancel-register" class="secondary" hidden>BACK TO LOGIN</button>
      <p class="small">Username, email aur password teeno enter karo. Admin apne registered admin email aur password se login kare.</p>
    </div>
  `);

  let registerMode = false;
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login');
  const registerButton = document.getElementById('register');
  const cancelButton = document.getElementById('cancel-register');

  loginButton.onclick = async () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!username || !email || !password) {
      alert('Username, email aur password teeno enter karo.');
      return;
    }

    try {
      let credential;
      let usedLegacyUsernameLogin = false;

      try {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } catch (emailError) {
        // Try legacy username-based accounts only when the username can form a valid email.
        // Never replace the real email-login error with a misleading auth/invalid-email error.
        const validLegacyUsername = /^[a-zA-Z0-9_]{3,20}$/.test(username);
        if (emailError.code !== 'auth/user-not-found' || !validLegacyUsername) {
          throw emailError;
        }
        const legacyEmail = username.toLowerCase() + '@players.nexzora.app';
        try {
          credential = await signInWithEmailAndPassword(auth, legacyEmail, password);
          usedLegacyUsernameLogin = true;
        } catch {
          throw emailError;
        }
      }

      if (credential.user.uid !== ADMIN_UID) {
        const profileRef = doc(db, 'users', credential.user.uid);
        const profileSnap = await getDoc(profileRef);
        const savedUsername = profileSnap.exists()
          ? (profileSnap.data().username || '')
          : '';

        if (savedUsername && savedUsername.toLowerCase() !== username.toLowerCase()) {
          await signOut(auth);
          alert('Username is email account se match nahi karta.');
          return;
        }

        await setDoc(profileRef, {
          uid: credential.user.uid,
          username,
          usernameLower: username.toLowerCase(),
          ...(usedLegacyUsernameLogin ? {} : { email }),
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }

    } catch (error) {
      alert('Login nahi hua: ' + error.message);
    }
  };

  registerButton.onclick = async () => {
    if (!registerMode) {
      registerMode = true;
      document.getElementById('auth-heading').textContent = 'CREATE PLAYER ACCOUNT';
      loginButton.hidden = true;
      cancelButton.hidden = false;
      registerButton.textContent = 'CREATE ACCOUNT';
      passwordInput.autocomplete = 'new-password';
      return;
    }

    try {
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        alert('Username 3-20 characters ka hona chahiye. Sirf letters, numbers aur _ use karo.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Valid email address enter karo.');
        return;
      }
      if (password.length < 6) {
        alert('Password minimum 6 characters ka hona chahiye.');
        return;
      }

      const usernameLower = username.toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: username });
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        username,
        usernameLower,
        email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      alert('Account ban gaya! Ab username, email aur password se login karo.');
    } catch (error) {
      alert('Account create nahi hua: ' + error.message);
    }
  };

  cancelButton.onclick = () => {
    registerMode = false;
    document.getElementById('auth-heading').textContent = 'PLAYER LOGIN';
    loginButton.hidden = false;
    cancelButton.hidden = true;
    registerButton.textContent = 'CREATE NEW ACCOUNT';
    passwordInput.autocomplete = 'current-password';
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
  document.getElementById('chat').onclick = showPlayerInbox;
  document.getElementById('profile').onclick = showProfile;
  document.getElementById('join-now').onclick = async () => { try { const id = await createPlayerChatThread('I want to join the Free Fire tournament. Please share the details.'); openPlayerChat(id); } catch (error) { alert('Chat nahi khula: ' + error.message); } };

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
      <div class="detail-label">USERNAME</div>
      <div class="detail-value" id="profile-username"></div>
      <div class="detail-label">PLAYER ID</div>
      <div class="detail-value id-value" id="profile-id"></div>
      <button class="game-button" id="profile-chat">💬 CONTACT NEXZORA</button>
      <button class="secondary logout-wide" id="logout">LOGOUT FROM ACCOUNT</button>
    </div>
  `);

  document.getElementById('profile-username').textContent =
    currentUser.displayName || (currentUser.email || 'player').split('@')[0];
  document.getElementById('profile-id').textContent = currentUser.uid;
  document.getElementById('back').onclick = showPlayer;
  document.getElementById('profile-chat').onclick = showPlayerInbox;
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
  document.getElementById('chat').onclick = showPlayerInbox;

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

    button.onclick = async () => {
      try {
        const id = await createPlayerChatThread(`I want to register for ${tournament.name}.`);
        openPlayerChat(id);
      } catch (error) { alert('Registration message send nahi hua: ' + error.message); }
    };

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

  // Instagram-style admin inbox: every player's conversation thread appears here.
  unsubscribeChats = onSnapshot(
    collection(db, 'chats'),
    snapshot => {
      const list = document.getElementById('chat-list');
      if (!list) return;
      list.innerHTML = '';
      const threads = snapshot.docs.map(d => ({ id:d.id, ...d.data() }))
        .sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      if (!threads.length) { list.textContent = 'No player conversations yet.'; return; }
      threads.forEach(thread => {
        const playerUid = thread.playerUid || thread.id;
        if (playerUid === ADMIN_UID) return;
        const button = document.createElement('button');
        button.className = 'inbox-item';
        const title = document.createElement('strong');
        title.textContent = thread.playerUsername || 'Player';
        const preview = document.createElement('span');
        preview.textContent = thread.lastMessage || 'Start conversation';
        button.append(title, preview);
        button.onclick = () => openAdminChat(thread.id, thread.playerUsername || 'Player', playerUid);
        list.appendChild(button);
      });
    },
    error => {
      console.error('Chat inbox error:', error);
      const list = document.getElementById('chat-list');
      if (list) list.textContent = 'Chats load nahi hue. Firestore Rules check karein.';
    }
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
    playerUsername: currentUser.displayName || 'Player',
    lastMessage: message || '📷 Image',
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function deleteChatImages(chatId) {
  const folder = storageRef(storage, `chat-uploads/${chatId}`);
  const files = await listAll(folder);
  await Promise.all(files.items.map(item => deleteObject(item)));
}

async function uploadChatImage(file, playerUid) {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('Sirf image upload kar sakte ho.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image 5 MB se chhoti honi chahiye.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Keep the player UID as the Storage folder so existing Storage permissions remain valid.
  const target = storageRef(storage, `chat-uploads/${playerUid}/${Date.now()}-${safeName}`);
  const uploaded = await uploadBytes(target, file, { contentType: file.type });
  return await getDownloadURL(uploaded.ref);
}

async function createPlayerChatThread(firstMessage = '') {
  const threadRef = doc(collection(db, 'chats'));
  const username = currentUser.displayName || (currentUser.email || 'Player').split('@')[0];
  await setDoc(threadRef, {
    playerUid: currentUser.uid,
    playerUsername: username,
    lastMessage: firstMessage || 'New conversation',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  if (firstMessage) {
    await addDoc(collection(db, 'chats', threadRef.id, 'messages'), {
      senderUid: currentUser.uid,
      senderName: username,
      text: firstMessage,
      imageUrl: '',
      system: false,
      createdAt: serverTimestamp()
    });
  }
  return threadRef.id;
}

async function sendChatMessage(threadId, message, isAdmin = false, imageUrl = '', playerUid = '') {
  const cleanMessage = (message || '').trim();
  if (!cleanMessage && !imageUrl) return;
  let ownerUid = playerUid;
  if (!ownerUid) {
    const threadSnap = await getDoc(doc(db, 'chats', threadId));
    ownerUid = threadSnap.exists() ? (threadSnap.data().playerUid || threadId) : threadId;
  }
  const threadRef = doc(db, 'chats', threadId);
  await setDoc(threadRef, {
    playerUid: ownerUid,
    playerUsername: isAdmin
      ? (document.querySelector('.chat-title')?.textContent || 'Player')
      : (currentUser.displayName || 'Player'),
    lastMessage: cleanMessage || '📷 Image',
    updatedAt: serverTimestamp()
  }, { merge: true });

  await addDoc(collection(db, 'chats', threadId, 'messages'), {
    senderUid: currentUser.uid,
    senderName: isAdmin ? 'NEXZORA ADMIN' : (currentUser.displayName || 'PLAYER'),
    text: cleanMessage,
    imageUrl,
    system: false,
    createdAt: serverTimestamp()
  });
}

function listenToMessages(threadId) {
  if (unsubscribeMessages) unsubscribeMessages();
  unsubscribeMessages = onSnapshot(
    query(collection(db, 'chats', threadId, 'messages'), orderBy('createdAt', 'asc')),
    snapshot => {
      const area = document.getElementById('messages');
      if (!area) return;
      area.innerHTML = '';
      snapshot.forEach(item => {
        const data = item.data();
        const message = document.createElement('div');
        message.className = 'message' + (data.senderUid === currentUser.uid ? ' mine' : '');
        const name = document.createElement('div');
        name.className = 'message-name';
        name.textContent = data.senderName || (data.system ? 'SYSTEM' : 'MESSAGE');
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
      if (area) area.textContent = 'Messages load nahi hue. Firestore Rules check karein.';
    }
  );
}

// PLAYER: Instagram-style conversation inbox
function showPlayerInbox() {
  stopListeners();
  document.body.classList.remove('chat-mode');
  shell(`
    <section class="inbox-page">
      <header class="inbox-header">
        <button class="chat-back" id="inbox-home">‹</button>
        <div><div class="chat-title">Messages</div><div class="chat-subtitle">NEXZORA PRIVATE SUPPORT</div></div>
        <button id="new-player-chat" class="inbox-new">＋</button>
      </header>
      <div class="inbox-heading">YOUR CONVERSATIONS</div>
      <div id="player-chat-list" class="chat-list">Loading chats...</div>
    </section>
  `);
  document.getElementById('inbox-home').onclick = showPlayer;
  document.getElementById('new-player-chat').onclick = async () => {
    try {
      const threadId = await createPlayerChatThread();
      openPlayerChat(threadId);
    } catch (error) { alert('New chat nahi bana: ' + error.message); }
  };
  unsubscribeChats = onSnapshot(
    query(collection(db, 'chats'), where('playerUid', '==', currentUser.uid)),
    snapshot => {
      const list = document.getElementById('player-chat-list');
      if (!list) return;
      list.innerHTML = '';
      const threads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      threads.sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      if (!threads.length) {
        list.textContent = 'Abhi koi chat nahi hai. ＋ dabakar new chat shuru karo.';
        return;
      }
      threads.forEach(thread => {
        const button = document.createElement('button');
        button.className = 'inbox-item';
        const title = document.createElement('strong');
        title.textContent = 'NEXZORA SUPPORT';
        const preview = document.createElement('span');
        preview.textContent = thread.lastMessage || 'Start conversation';
        button.append(title, preview);
        button.onclick = () => openPlayerChat(thread.id);
        list.appendChild(button);
      });
    },
    error => {
      console.error(error);
      const list = document.getElementById('player-chat-list');
      if (list) list.textContent = 'Chat list load nahi hui. Firestore Rules check karo.';
    }
  );
}

function openPlayerChat(threadId, firstMessage = '') {
  stopListeners();
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
        <input id="chat-input" maxlength="2000" placeholder="Message..." autocomplete="off">
        <button type="submit" class="chat-send" aria-label="Send">➤</button>
      </form>
    </section>
  `);
  listenToMessages(threadId);
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
      const imageUrl = file ? await uploadChatImage(file, currentUser.uid) : '';
      await sendChatMessage(threadId, message, false, imageUrl, currentUser.uid);
      input.value = '';
      fileInput.value = '';
    } catch (error) { alert('Message/image send nahi hua: ' + error.message); }
    finally { sendButton.disabled = false; }
  };
  document.getElementById('exit-chat').onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = null;
    document.body.classList.remove('chat-mode');
    showPlayerInbox();
  };
  if (firstMessage) document.getElementById('chat-input').value = firstMessage;
}

function openAdminChat(threadId, username = 'Player', playerUid = '') {
  const holder = document.getElementById('admin-chat');
  if (!holder) return;
  document.body.classList.add('chat-mode');
  if (unsubscribeMessages) unsubscribeMessages();
  holder.innerHTML = `
    <section class="chat-screen">
      <header class="chat-topbar">
        <button class="chat-back" id="close-admin-chat" aria-label="Back">‹</button>
        <div><div class="chat-title"></div><div class="chat-subtitle">NEXZORA ADMIN INBOX</div></div>
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
        <input id="admin-chat-input" maxlength="2000" placeholder="Reply..." autocomplete="off">
        <button type="submit" class="chat-send" aria-label="Send">➤</button>
      </form>
    </section>
  `;
  holder.querySelector('.chat-title').textContent = username;
  listenToMessages(threadId);
  document.getElementById('admin-attach-image').onclick = () => document.getElementById('admin-image-file').click();
  document.querySelectorAll('[data-auto]').forEach(button => {
    button.onclick = async () => {
      try { await sendChatMessage(threadId, button.dataset.auto, true, '', playerUid); }
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
      const imageUrl = file ? await uploadChatImage(file, playerUid) : '';
      await sendChatMessage(threadId, message, true, imageUrl, playerUid);
      input.value = '';
      fileInput.value = '';
    } catch (error) { alert('Reply/image send nahi hua: ' + error.message); }
    finally { sendButton.disabled = false; }
  };
  document.getElementById('close-admin-chat').onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = null;
    holder.innerHTML = '';
    document.body.classList.remove('chat-mode');
  };
}

// Automatically create/update a Firestore profile and ensure the player is visible in Admin inbox.
async function ensurePlayerProfile(user) {
  const profileRef = doc(db, 'users', user.uid);
  const profileSnap = await getDoc(profileRef);
  const existing = profileSnap.exists() ? profileSnap.data() : {};
  const emailName = (user.email || 'player').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  const isNewUsernameAccount = (user.email || '').endsWith('@players.nexzora.app');
  const fallbackName = isNewUsernameAccount ? emailName.slice(0,20) : (emailName.slice(0,14) + user.uid.slice(-4));
  const username = existing.username || user.displayName || fallbackName;
  if (user.displayName !== username) await updateProfile(user, { displayName: username });
  await setDoc(profileRef, {
    uid:user.uid, username, usernameLower:username.toLowerCase(),
    email:user.email || existing.email || '',
    createdAt:existing.createdAt || serverTimestamp(),
    lastLoginAt:serverTimestamp()
  }, { merge:true });

  const owned = await getDocs(query(collection(db,'chats'), where('playerUid','==',user.uid)));
  if (owned.empty) {
    // Preserve the original one-chat-per-player thread as the first conversation.
    const legacyRef = doc(db,'chats',user.uid);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      await setDoc(legacyRef, {
        playerUid:user.uid, playerUsername:username,
        lastMessage:legacySnap.data().lastMessage || 'Conversation',
        updatedAt:legacySnap.data().updatedAt || serverTimestamp()
      }, { merge:true });
    } else {
      const firstThread = doc(collection(db,'chats'));
      await setDoc(firstThread, {
        playerUid:user.uid, playerUsername:username,
        lastMessage:'You are connected to NEXZORA Support',
        createdAt:serverTimestamp(), updatedAt:serverTimestamp()
      });
    }
  }
}

// AUTH ROUTING
onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (!user) {
    stopListeners();
    showLogin();
    return;
  }
  if (user.uid === ADMIN_UID) {
    showAdmin();
  } else {
    try {
      await ensurePlayerProfile(user);
    } catch (error) {
      console.error('Player profile sync failed:', error);
    }
    showPlayer();
  }
});


/* Multi-chat inbox */
.inbox-page{min-height:100dvh;background:#09090b;color:#fff}
.inbox-header{display:flex;align-items:center;gap:14px;padding:18px 14px;border-bottom:1px solid #29292e}
.inbox-header .chat-title{font-size:22px;font-weight:900}
.inbox-header .chat-back{width:42px;height:42px;padding:0;font-size:28px;background:#19191d}
.inbox-new{margin-left:auto;width:44px;height:44px;padding:0;font-size:27px}
.inbox-heading{padding:18px 16px 8px;color:#aaa;font-size:11px;letter-spacing:2px;font-weight:800}
.chat-list{display:flex;flex-direction:column;gap:2px}
.chat-list .inbox-item{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;padding:17px 16px;margin:0;border:0;border-bottom:1px solid #29292e;border-radius:0;background:#101013}
.chat-list .inbox-item strong{font-size:15px;color:#fff}
.chat-list .inbox-item span{font-size:13px;color:#aaa;font-weight:400;letter-spacing:0}
.chat-mode #app{padding:0}


/* Full-height Instagram-like admin inbox list */
#admin-inbox>.panel{margin:0 -16px;padding:18px 0 0;border-left:0;border-right:0;border-radius:0;min-height:calc(100dvh - 170px)}
#admin-inbox>.panel>.section-kicker,#admin-inbox>.panel>h2,#admin-inbox>.panel>p{margin-left:16px;margin-right:16px}
#admin-inbox #chat-list{margin-top:18px}
#admin-inbox #chat-list .inbox-item{min-height:76px}
