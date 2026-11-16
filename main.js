
import './style.css';

const tournaments = [
  {
    name: 'FREE FIRE SOLO',
    mode: 'Solo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 7:00 PM'
  },
  {
    name: 'FREE FIRE DUO',
    mode: 'Duo',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Today - 8:00 PM'
  },
  {
    name: 'FREE FIRE SQUAD',
    mode: 'Squad',
    entry: 'FREE',
    prize: 'Sponsor Prize',
    time: 'Tomorrow - 7:00 PM'
  }
];

const app = document.getElementById('app');

function render() {
  app.innerHTML = `
    <header class="header">
      <div class="logo">NEXZORA ESPORTS</div>
      <div class="subtitle">PLAY • COMPETE • WIN</div>
    </header>

    <main class="container">
      <div class="notice">
        Welcome to NEXZORA ESPORTS! All tournaments in this demo
        have free entry. Prizes are subject to sponsor terms and
        tournament rules.
      </div>

      <h2 class="section-title">Available Tournaments</h2>

      <div id="tournament-list"></div>

      <h2 class="section-title">My Registrations</h2>
      <div id="my-registrations" class="notice">
        You have not registered for any tournament yet.
      </div>

      <h2 class="section-title">Player Points</h2>
      <div class="tournament">
        <h3>Demo Points: 0</h3>
        <p>These are non-cash demonstration points.</p>
      </div>
    </main>

    <footer class="footer">
      © 2026 NEXZORA ESPORTS
    </footer>
  `;

  const list = document.getElementById('tournament-list');

  tournaments.forEach((tournament, index) => {
    const card = document.createElement('div');
    card.className = 'tournament';

    card.innerHTML = `
      <h3>${tournament.name}</h3>
      <p>Mode: ${tournament.mode}</p>
      <p>Entry Fee: ${tournament.entry}</p>
      <p>Prize: ${tournament.prize}</p>
      <p>Time: ${tournament.time}</p>
      <button class="join-btn">REGISTER FREE</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      registerTournament(index);
    });

    list.appendChild(card);
  });

  showRegistrations();
}

function registerTournament(index) {
  const registrations = JSON.parse(
    localStorage.getItem('nexzora_registrations') || '[]'
  );

  const tournament = tournaments[index];

  if (registrations.some(item => item.name === tournament.name)) {
    alert('You are already registered!');
    return;
  }

  registrations.push({
    name: tournament.name,
    time: tournament.time
  });

  localStorage.setItem(
    'nexzora_registrations',
    JSON.stringify(registrations)
  );

  alert('Free registration successful!');
  showRegistrations();
}

function showRegistrations() {
  const area = document.getElementById('my-registrations');
  if (!area) return;

  const registrations = JSON.parse(
    localStorage.getItem('nexzora_registrations') || '[]'
  );

  if (registrations.length === 0) {
    area.textContent =
      'You have not registered for any tournament yet.';
    return;
  }

  area.innerHTML = '';

  registrations.forEach(item => {
    const p = document.createElement('p');
    p.textContent = `${item.name} - ${item.time}`;
    area.appendChild(p);
  });
}

render();
      
