const CACHE_NAME = 'kukulana-day-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;600&display=swap'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(['/','index.html']))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first, network fallback
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.url.startsWith('http')) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// ─── Intimate day logic (mirrored for SW) ──────────────────────────────────
function isIntimateDay(year, month, day) {
  const date = new Date(year, month, day);
  const dow = date.getDay();
  if (dow === 1 || dow === 3 || dow === 6) return true;
  const lastDay = new Date(year, month + 1, 0).getDate();
  if (day === lastDay) return true;
  return false;
}

function getNextIntimateDate(fromDate) {
  const start = new Date(fromDate);
  start.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (isIntimateDay(d.getFullYear(), d.getMonth(), d.getDate())) return d;
  }
  return null;
}

const DAYS_FULL_SW = ['Jumapili','Jumatatu','Jumanne','Jumatano','Alhamisi','Ijumaa','Jumamosi'];
const MONTHS_SW = ['Januari','Februari','Machi','Aprili','Mei','Juni','Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'];

const TIPS = [
  { name: "Lotus — Farasi wa Maua", advice: "Pumzikeni taratibu, angaliani macho. Sema maneno matamu ya upendo." },
  { name: "Tasa ya Mto", advice: "Mazungumzo mazuri. Mwambie kitu kimoja unachompenda kuhusu yeye." },
  { name: "Mlima Mzuri", advice: "Kabla ya kuanza, bombenani, piga masage mabegani na shingoni." },
  { name: "Ndege wa Pepo", advice: "Jaribuni mwanga laini — mishumaa inafanya mazingira kuwa mazuri zaidi." },
  { name: "Mti wa Amani", advice: "Sikilizaneni vizuri na shirikishana maneno ya moyo wako." },
  { name: "Jua la Asubuhi", advice: "Anza na masage ya vidole — dakika 5 za awali zinafanya tofauti kubwa." },
  { name: "Pembe ya Nyota", advice: "Jaribuni muziki wa polepole — sauti nzuri inabadilisha hali nzima." },
  { name: "Kivuli cha Mwezi", advice: "Baada ya wakati wenu, kaa pamoja dakika 15 bila simu." },
];

// ─── Daily 7AM Notification ─────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleDailyCheck();
  }
});

let notifTimer = null;

function scheduleDailyCheck() {
  if (notifTimer) return;
  const now = new Date();
  const next7AM = new Date(now);
  next7AM.setHours(7, 0, 0, 0);
  if (now >= next7AM) next7AM.setDate(next7AM.getDate() + 1);
  const delay = next7AM - now;
  notifTimer = setTimeout(() => {
    sendDailyNotification();
    setInterval(sendDailyNotification, 24 * 60 * 60 * 1000);
  }, delay);
}

function sendDailyNotification() {
  const now = new Date();
  const today = isIntimateDay(now.getFullYear(), now.getMonth(), now.getDate());
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  const next = getNextIntimateDate(now);
  const dayName = next ? DAYS_FULL_SW[next.getDay()] : '';

  if (today) {
    self.registration.showNotification('💕 Kukulana Day — Leo ni Siku Yenu!', {
      body: `✦ ${tip.name}\n${tip.advice}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'intimacy-daily',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  } else {
    self.registration.showNotification('💕 Kukulana Day — Habari za Asubuhi', {
      body: `Siku inayofuata ya upendo ni ${dayName}. Jiandae! ✦ ${tip.advice}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'intimacy-daily',
      vibrate: [100, 50, 100]
    });
  }
}

// Handle notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
