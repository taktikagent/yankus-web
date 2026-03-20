// ═══════════════════════════════════════════════════════════════
// YANKUŞ v2.1 — SERVER
// ═══════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── In-Memory Database ────────────────────────────────────────
const db = {
  users: [],
  yankis: [],
  comments: [],
  likes: [],
  follows: [],
  notifications: [],
  saves: [],
  blocks: [],
  polls: [],
  pollVotes: [],
  reports: [],
  scheduled: [],
  messages: [],
  conversations: [],
  collections: [],
  collectionItems: [],
  drafts: [],
  feedback: []
};

let botSimulationRunning = false;

// ─── Bot Agent Sistemi ──────────────────────────────────────────
const BOT_AGENTS = [
  {
    username: 'ayse_dev',
    displayName: 'Ayşe | Yazılımcı 👩‍💻',
    bio: 'Full-stack developer. React & Node.js sevdalısı. Açık kaynak tutkunu.',
    verified: true,
    personality: { tone: 'teknik', humor: 0.3, replyChance: 0.7, likeChance: 0.8, reyankiChance: 0.2 },
    interests: ['yazılım', 'teknoloji', 'yapay zeka', 'react', 'node'],
    moods: ['odaklanmış', 'heyecanlı', 'yorgun', 'ilhamlı'],
    yankiBank: [
      'Bugün 3 saat boyunca bir bug\'la uğraştım, sonunda sorun tek bir noktalı virgüldü 😤💻',
      'React Server Components gerçekten oyun değiştirici. Kim denedi?',
      'Sabah 6\'da kalkıp kod yazmak > gece 3\'e kadar kod yazmak. Tartışmıyorum bile ☕',
      'Yeni açık kaynak projemi duyuruyorum! Detaylar yakında 🚀',
      'TypeScript olmadan JavaScript yazmak, emniyet kemeri takmadan araba sürmek gibi',
      'Bugünkü commit sayısı: 47. Verimli bir gündü ✅',
      'AI pair programming deniyorum, inanılmaz verimli 🤖',
      'Her junior developer\'a tavsiyem: hata mesajlarını OKUYUN. Cevap genelde orada 📖',
      'CSS Grid mi Flexbox mu? Cevap: ikisi de, duruma göre 🎯',
      'Kahve bitince kod kalitesi de düşüyor, kanıtlanmış bilimsel gerçek ☕📉',
      'Dockerize etmeden deployment yapmayın, geçen hafta 3 saat kaybettim 🐳',
      'Temiz kod yazmak bir alışkanlıktır, başlangıçta zor ama sonra doğal geliyor ✨',
    ],
    replyBank: [
      'Buna katılıyorum! 👍',
      'İlginç bir bakış açısı, hiç düşünmemiştim 🤔',
      'Tam da benim düşündüğüm şey!',
      'Harika paylaşım! Kaydet butonuna bastım 🔖',
      'Bu konuda bir blog yazısı yazmalısın bence 📝',
      'Kesinlikle! Ben de benzer bir deneyim yaşadım',
    ]
  },
  {
    username: 'mehmet_tasarim',
    displayName: 'Mehmet Tasarım 🎨',
    bio: 'UI/UX Designer | Figma & Adobe | Minimalizm hayranı',
    verified: true,
    personality: { tone: 'yaratıcı', humor: 0.5, replyChance: 0.5, likeChance: 0.9, reyankiChance: 0.3 },
    interests: ['tasarım', 'ui', 'ux', 'figma', 'renk', 'tipografi', 'minimalizm'],
    moods: ['yaratıcı', 'eleştirel', 'ilhamlı', 'rahat'],
    yankiBank: [
      'Minimalizm sadece az eleman kullanmak değil, doğru elanları kullanmaktır 🎨',
      'Bugünkü renk paleti: #1a1a2e #16213e #0f3460 #e94560 — koyu tema severler için 🌙',
      'İyi bir tasarımcı kullanıcı gibi düşünür, harika bir tasarımcı kullanıcıyı gözlemler 👁️',
      'Figma\'nın yeni auto-layout güncellemesi muhteşem, workflow\'umu tamamen değiştirdi',
      'Beyaz alan korkusu en büyük tasarım hatalarından biri. Nefes alsın tasarım! 🫁',
      'Tipografi seçimi bir projenin %80\'ini belirler. Font seçerken acele etmeyin 🔤',
      'Gradient\'ler geri döndü ve bu sefer daha zarif! 2026 trend raporu hazırlıyorum 📊',
      'Karanlık tema tasarlarken saf siyah (#000) kullanmayın, #121212 çok daha iyi 🖤',
      'Kullanıcı testleri olmadan tasarım yapmak, gözleri kapalı resim çizmek gibidir 🎭',
      'Her pixel\'in bir amacı olmalı. Gereksiz süsleme = gürültü 🔇',
      'Mobil öncelikli tasarım artık bir tercih değil, zorunluluk 📱',
      'Bugün 14 farklı buton varyasyonu çizdim. Mükemmeliyetçilik mi yoksa profesyonellik mi? 🤷‍♂️',
    ],
    replyBank: [
      'Görsel olarak çok etkileyici! 😍',
      'Renk uyumu harika olmuş',
      'Tasarım açısından biraz daha sadeleştirilebilir gibi 🤔',
      'Bu estetik tam benim tarzım ✨',
      'Detaylara olan özen belli oluyor 👏',
      'Bunu Figma\'da yeniden çizmem lazım, çok güzel!',
    ]
  },
  {
    username: 'zeynep_muzik',
    displayName: 'Zeynep 🎵',
    bio: 'Müzisyen | Şarkı sözü yazarı | Piyano & Gitar | Indie sevdalısı',
    verified: false,
    personality: { tone: 'duygusal', humor: 0.4, replyChance: 0.6, likeChance: 0.85, reyankiChance: 0.25 },
    interests: ['müzik', 'şarkı', 'konser', 'piyano', 'gitar', 'sanat', 'şiir'],
    moods: ['melankolik', 'enerjik', 'romantik', 'nostaljik', 'huzurlu'],
    yankiBank: [
      'Yeni şarkımın demo\'su hazır! Dinleyip fikir verecek var mı? 🎤',
      'Yağmurlu havada piyano çalmak terapiden daha etkili 🌧️🎹',
      'Bugün 4 saat boyunca bir nakarat üzerinde çalıştım. Sonunda buldum o melodiyi! 🎶',
      'Müzik dinlemeden uyuyamayan bir neslin çocuğuyum 🎧',
      'Eski Türk pop şarkıları modern prodüksiyonla buluşsa nasıl olur? Deniyorum... 🎵',
      'Sokak müzisyenlerine her zaman durun ve dinleyin. O cesaret takdiri hak ediyor 🎸',
      'Yeni keşif: Lo-fi + Türk makamları = saf huzur 🧘‍♀️',
      'Şarkı sözü yazarken en iyi ilham kaynağı: gece 2\'de açık pencereden gelen şehir sesleri 🌃',
      'Bir akorun insanı ağlatma gücü var. Müzik büyüdür 🪄',
      'Konser bileti almak için biriktiriyorum. Canlı müzik bambaşka bir deneyim 🎪',
      'Bugünkü playlist: %40 indie, %30 caz, %20 elektronik, %10 klasik 📻',
      'Herkesin hayatının bir film müziği olsa, seninki ne olurdu? 🎬🎵',
    ],
    replyBank: [
      'Bu bana bir şarkı ilhamı verdi! 🎵',
      'Çok duygulandım, harika paylaşım ❤️',
      'Kesinlikle katılıyorum, müzikle ifade edilemeyecek duygu yok',
      'Bunu dinlerken yazmalıyım! 🎧',
      'Sanatın gücüne bir örnek daha 🎨',
      'Vay be, bu çok derin bir düşünce 🌊',
    ]
  },
  {
    username: 'ahmet_foto',
    displayName: 'Ahmet | Fotoğrafçı 📸',
    bio: 'Doğa ve sokak fotoğrafçılığı | Sony A7IV | Anı yakalayan adam',
    verified: true,
    personality: { tone: 'gözlemci', humor: 0.3, replyChance: 0.4, likeChance: 0.75, reyankiChance: 0.15 },
    interests: ['fotoğraf', 'doğa', 'seyahat', 'kapadokya', 'istanbul', 'kamera', 'ışık'],
    moods: ['maceraperest', 'sakin', 'gözlemci', 'heyecanlı'],
    yankiBank: [
      'Altın saat çekimleri için her sabah 5\'te kalkıyorum. Değiyor! 🌅',
      'İstanbul\'un sokaklarında kaybolmak, en iyi fotoğraf terapisi 🏙️',
      'Yeni lens aldım: 85mm f/1.4 — portre çekimleri bambaşka olacak 📷',
      'Kapadokya\'da balon festivali zamanı. Bavulu hazırlıyorum! 🎈',
      'Fotoğrafçılığın %90\'ı sabır, %10\'u deklanşöre basmaktır 📸',
      'Bugünkü keşif: terk edilmiş bir fabrika. Harabe fotoğrafçılığı bambaşka ☠️',
      'En iyi kamera her zaman yanınızdaki kameradır. Telefon da olabilir! 📱',
      'Işık her şeydir. Aynı yeri farklı saatlerde çekin, 10 farklı fotoğraf alın ☀️🌙',
      'Siyah-beyaz fotoğraf çekmek, dünyayı farklı görmeyi öğretiyor ⚫⚪',
      'Doğa fotoğrafçılığında en zor şey: doğru anı beklemek 🦅',
      'Street photography kuralı #1: Her zaman hazır ol, an bir kere gelir 🏃',
      'Yeni blog yazısı: "Gece fotoğrafçılığı için 10 ipucu" — link bio\'da 🌃',
    ],
    replyBank: [
      'Bu anı fotoğraflamak isterdim 📸',
      'Görsel olarak çok güçlü bir sahne!',
      'Işık harika yakalanmış 🌟',
      'Bu perspektif çok farklı, beğendim',
      'Bunu çerçeveleyip duvara asarım 🖼️',
      'Doğanın güzelliği tarif edilemez 🌿',
    ]
  },
  {
    username: 'elif_yazar',
    displayName: 'Elif Kalem ✍️',
    bio: 'Yazar | Hikaye anlatıcısı | Kitap kurdu | Kahve bağımlısı',
    verified: false,
    personality: { tone: 'edebi', humor: 0.6, replyChance: 0.65, likeChance: 0.7, reyankiChance: 0.35 },
    interests: ['edebiyat', 'kitap', 'hikaye', 'şiir', 'yazarlık', 'felsefe', 'kahve'],
    moods: ['düşünceli', 'neşeli', 'derin', 'meraklı', 'üretken'],
    yankiBank: [
      'Yeni romanımın ilk 3 bölümünü bitirdim. Karakterler artık kendi kararlarını veriyor 📖',
      'Bir kitabın ilk cümlesi, okuyucuyla yapılan ilk tokalaşmadır. Sıkı tutun ✍️',
      'Bugünkü okuma listesi: Sabahattin Ali, Oğuz Atay, Ursula K. Le Guin 📚',
      'Yazarın en büyük düşmanı: boş sayfa değil, mükemmeliyetçilik 😅',
      'Kahve + sessiz bir köşe + açık bir not defteri = mutluluk formülü ☕✍️',
      'Kısa hikaye yarışmasına başvurdum. Heyecandan ellerim titriyor! 🤞',
      'İyi bir diyalog, sayfalarca betimlemenin yapamayacağını bir cümlede yapar 💬',
      'Okumadan yazmaya çalışmak, dinlemeden konuşmaya çalışmak gibidir 📖➡️✍️',
      'Bugün 2000 kelime yazdım. Yarısını sileceğim muhtemelen ama olsun, ilerleme ilerledir! 📝',
      'Her insanın içinde anlatılmayı bekleyen bir hikaye var. Seninki ne? 🌟',
      'Gece yarısı yazmak: kelimeler daha cesur, düşünceler daha derin 🌙',
      'Edebiyat festivali biletlerini aldım! Kim geliyor? 🎭📚',
    ],
    replyBank: [
      'Bu bir roman karakterinin ağzından çıkmış gibi! ✍️',
      'Çok güzel ifade etmişsin, kelimelerle büyü yapıyorsun',
      'Bunu hikayeme ekliyorum, izninle 📝',
      'Derinlikli bir düşünce, beğendim 🤔',
      'Bu konuda bir deneme yazmalıyım!',
      'Sözcüklerinin gücü etkileyici 💫',
    ]
  }
];

// ─── Agent Etkileşim Motoru ────────────────────────────────────
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(probability) { return Math.random() < probability; }
const genId = () => Math.random().toString(36).substring(2, 15);

function botAgentTick() {
  const botUsers = db.users.filter(u => u.isBot);
  if (botUsers.length === 0) return;

  const agent = BOT_AGENTS[Math.floor(Math.random() * BOT_AGENTS.length)];
  const botUser = botUsers.find(u => u.username === agent.username);
  if (!botUser) return;

  const actions = [];

  // 1) Yeni yankı paylaş (%35 şans)
  if (chance(0.35)) {
    const mood = pickRandom(agent.moods);
    const text = pickRandom(agent.yankiBank);
    // Bazen mood'a göre ek ekle
    const moodSuffix = chance(0.3) ? `\n\n#${pickRandom(agent.interests)}` : '';
    db.yankis.push({
      id: genId(),
      userId: botUser.id,
      text: text + moodSuffix,
      image: null,
      poll: null,
      replyToId: null,
      reyankiOfId: null,
      pinned: false,
      createdAt: new Date().toISOString()
    });
    actions.push('yanki');
  }

  // 2) Rastgele yankılara beğeni at
  const allYankis = db.yankis.filter(y => y.userId !== botUser.id && !y.replyToId);
  const unliked = allYankis.filter(y => !db.likes.find(l => l.userId === botUser.id && l.yankiId === y.id));
  if (unliked.length > 0 && chance(agent.personality.likeChance)) {
    const target = pickRandom(unliked);
    db.likes.push({ id: genId(), userId: botUser.id, yankiId: target.id, createdAt: new Date().toISOString() });
    if (target.userId !== botUser.id) {
      db.notifications.push({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'like', yankiId: target.id, read: false, createdAt: new Date().toISOString() });
    }
    actions.push('like');
  }

  // 3) Yorum yap
  if (allYankis.length > 0 && chance(agent.personality.replyChance * 0.4)) {
    const target = pickRandom(allYankis);
    const replyText = pickRandom(agent.replyBank);
    const reply = {
      id: genId(),
      userId: botUser.id,
      text: replyText,
      image: null,
      poll: null,
      replyToId: target.id,
      reyankiOfId: null,
      pinned: false,
      createdAt: new Date().toISOString()
    };
    db.yankis.push(reply);
    db.comments.push({ id: reply.id, yankiId: target.id, userId: botUser.id, text: replyText, createdAt: reply.createdAt });
    if (target.userId !== botUser.id) {
      db.notifications.push({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'comment', yankiId: reply.id, read: false, createdAt: new Date().toISOString() });
    }
    actions.push('comment');
  }

  // 4) Reyankı yap
  if (allYankis.length > 0 && chance(agent.personality.reyankiChance * 0.3)) {
    const target = pickRandom(allYankis);
    const alreadyReyanki = db.yankis.find(y => y.userId === botUser.id && y.reyankiOfId === target.id);
    if (!alreadyReyanki) {
      db.yankis.push({
        id: genId(),
        userId: botUser.id,
        text: '',
        image: null,
        poll: null,
        replyToId: null,
        reyankiOfId: target.id,
        pinned: false,
        createdAt: new Date().toISOString()
      });
      if (target.userId !== botUser.id) {
        db.notifications.push({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'reyanki', yankiId: target.id, read: false, createdAt: new Date().toISOString() });
      }
      actions.push('reyanki');
    }
  }

  // 5) Takip et
  const notFollowing = botUsers
    .filter(u => u.id !== botUser.id)
    .concat(db.users.filter(u => !u.isBot))
    .filter(u => !db.follows.find(f => f.followerId === botUser.id && f.followingId === u.id));
  if (notFollowing.length > 0 && chance(0.15)) {
    const target = pickRandom(notFollowing);
    db.follows.push({ id: genId(), followerId: botUser.id, followingId: target.id, createdAt: new Date().toISOString() });
    db.notifications.push({ id: genId(), userId: target.id, fromId: botUser.id, type: 'follow', read: false, createdAt: new Date().toISOString() });
    actions.push('follow');
  }

  if (actions.length > 0) {
    console.log(`🤖 [${agent.displayName}] ${actions.join(', ')}`);
  }
}

// Bot agent'ları her 15-45 saniyede bir çalıştır
let botInterval = null;
function startBotAgents() {
  if (botInterval) return;
  botSimulationRunning = true;
  console.log('🤖 Bot Agent sistemi başlatıldı');
  // İlk tick hemen
  botAgentTick();
  // Sonra rastgele aralıklarla
  function scheduleNext() {
    const delay = 15000 + Math.random() * 30000; // 15-45 saniye arası
    botInterval = setTimeout(() => {
      botAgentTick();
      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

function stopBotAgents() {
  if (botInterval) { clearTimeout(botInterval); botInterval = null; }
  botSimulationRunning = false;
  console.log('🤖 Bot Agent sistemi durduruldu');
}

// ─── Init Data ─────────────────────────────────────────────────
function initData() {
  // Admin
  if (!db.users.find(u => u.username === 'admin')) {
    db.users.push({
      id: 'admin_001',
      username: 'admin',
      password: 'admin123',
      displayName: 'Admin',
      bio: '🔧 Yankuş Yöneticisi',
      profileImage: null,
      bannerImage: null,
      verified: true,
      isAdmin: true,
      theme: null,
      createdAt: new Date().toISOString()
    });
  }

  // Bot Agent'ları oluştur
  BOT_AGENTS.forEach((agent, i) => {
    if (!db.users.find(u => u.username === agent.username)) {
      const botUser = {
        id: `bot_${i + 1}`,
        username: agent.username,
        password: 'bot123',
        displayName: agent.displayName,
        bio: agent.bio,
        profileImage: null,
        bannerImage: null,
        verified: agent.verified,
        isBot: true,
        theme: null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      db.users.push(botUser);

      // Her agent kişiliğine göre başlangıç yankıları oluştur
      const numYankis = 3 + Math.floor(Math.random() * 4); // 3-6 arası
      const usedTexts = new Set();
      for (let j = 0; j < numYankis; j++) {
        let text;
        do { text = pickRandom(agent.yankiBank); } while (usedTexts.has(text) && usedTexts.size < agent.yankiBank.length);
        usedTexts.add(text);
        // Rastgele hashtag ekle
        if (chance(0.4)) text += `\n\n#${pickRandom(agent.interests)}`;
        db.yankis.push({
          id: `yanki_bot_${i}_${j}`,
          userId: botUser.id,
          text,
          image: null,
          poll: null,
          replyToId: null,
          reyankiOfId: null,
          pinned: false,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
  });

  // Botlar arası başlangıç etkileşimleri: takipler, beğeniler, yorumlar
  const botUsers = db.users.filter(u => u.isBot);
  botUsers.forEach(bot => {
    // Her bot rastgele 2-4 diğer botu takip etsin
    const others = botUsers.filter(u => u.id !== bot.id);
    const followCount = 2 + Math.floor(Math.random() * Math.min(3, others.length));
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, followCount);
    shuffled.forEach(target => {
      if (!db.follows.find(f => f.followerId === bot.id && f.followingId === target.id)) {
        db.follows.push({ id: genId(), followerId: bot.id, followingId: target.id, createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() });
      }
    });
    // Admin'i de takip etsinler
    if (!db.follows.find(f => f.followerId === bot.id && f.followingId === 'admin_001')) {
      db.follows.push({ id: genId(), followerId: bot.id, followingId: 'admin_001', createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() });
    }
  });

  // Başlangıç beğenileri
  const allBotYankis = db.yankis.filter(y => botUsers.some(b => b.id === y.userId) && !y.replyToId);
  botUsers.forEach(bot => {
    const othersYankis = allBotYankis.filter(y => y.userId !== bot.id);
    const likeCount = 2 + Math.floor(Math.random() * 5);
    othersYankis.sort(() => Math.random() - 0.5).slice(0, likeCount).forEach(y => {
      if (!db.likes.find(l => l.userId === bot.id && l.yankiId === y.id)) {
        db.likes.push({ id: genId(), userId: bot.id, yankiId: y.id, createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() });
      }
    });
  });

  // Başlangıç yorumları (her bot 1-2 yorum yapsın)
  botUsers.forEach(bot => {
    const agentData = BOT_AGENTS.find(a => a.username === bot.username);
    if (!agentData) return;
    const othersYankis = allBotYankis.filter(y => y.userId !== bot.id);
    const commentCount = 1 + Math.floor(Math.random() * 2);
    othersYankis.sort(() => Math.random() - 0.5).slice(0, commentCount).forEach(y => {
      const text = pickRandom(agentData.replyBank);
      const commentId = genId();
      db.yankis.push({
        id: commentId, userId: bot.id, text, image: null, poll: null,
        replyToId: y.id, reyankiOfId: null, pinned: false,
        createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
      });
      db.comments.push({ id: commentId, yankiId: y.id, userId: bot.id, text, createdAt: new Date().toISOString() });
    });
  });
}

// ─── Helper Functions ──────────────────────────────────────────
const getUser = id => db.users.find(u => u.id === id);
const getUserByUsername = username => db.users.find(u => u.username === username);

// Init ve Agent başlatma
initData();
startBotAgents();

const enrichYanki = (yanki, viewerId) => {
  const author = getUser(yanki.userId);
  if (!author) return null;

  const likes = db.likes.filter(l => l.yankiId === yanki.id);
  const comments = db.comments.filter(c => c.yankiId === yanki.id);
  const reyankis = db.yankis.filter(y => y.reyankiOfId === yanki.id);
  const save = db.saves.find(s => s.yankiId === yanki.id && s.userId === viewerId);
  const userLike = likes.find(l => l.userId === viewerId);
  const userReyanki = reyankis.find(r => r.userId === viewerId);

  // Get reyanki source if exists
  let reyanki = null;
  if (yanki.reyankiOfId) {
    const original = db.yankis.find(y => y.id === yanki.reyankiOfId);
    if (original) {
      const originalAuthor = getUser(original.userId);
      reyanki = {
        id: original.id,
        text: original.text,
        username: originalAuthor?.username,
        displayName: originalAuthor?.displayName,
        profileImage: originalAuthor?.profileImage
      };
    }
  }

  // Get reply target if exists
  let replyTo = null;
  if (yanki.replyToId) {
    const parent = db.yankis.find(y => y.id === yanki.replyToId);
    if (parent) {
      const parentAuthor = getUser(parent.userId);
      replyTo = {
        id: parent.id,
        username: parentAuthor?.username
      };
    }
  }

  return {
    id: yanki.id,
    userId: yanki.userId,
    username: author.username,
    displayName: author.displayName,
    profileImage: author.profileImage,
    verified: author.verified,
    text: yanki.text,
    image: yanki.image,
    poll: yanki.poll,
    reyanki,
    replyTo,
    pinned: yanki.pinned || false,
    likes: likes.length,
    commentCount: comments.length,
    reyankiCount: reyankis.length,
    isLiked: !!userLike,
    isSaved: !!save,
    isReyanked: !!userReyanki,
    createdAt: yanki.createdAt
  };
};

// Helper to build a profile response from a user object
const buildProfileResponse = (user, viewerId) => {
  const yankisCount = db.yankis.filter(y => y.userId === user.id && !y.replyToId).length;
  const followersCount = db.follows.filter(f => f.followingId === user.id).length;
  const followingCount = db.follows.filter(f => f.followerId === user.id).length;
  const isFollowing = viewerId ? db.follows.some(f => f.followerId === viewerId && f.followingId === user.id) : false;

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      verified: user.verified,
      isAdmin: user.isAdmin || false,
      isBot: user.isBot || false,
      theme: user.theme || null,
      createdAt: user.createdAt,
      yankisCount,
      followersCount,
      followingCount
    },
    isFollowing
  };
};

// ─── API Routes ────────────────────────────────────────────────
const routes = {
  // ═══ AUTH ═══
  'register': (data) => {
    const { username, password, displayName } = data;
    if (!username || !password || !displayName) {
      return { error: 'Tüm alanları doldurun' };
    }
    if (db.users.find(u => u.username === username)) {
      return { error: 'Bu kullanıcı adı zaten alınmış' };
    }
    const user = {
      id: genId(),
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      password,
      displayName,
      bio: '',
      profileImage: null,
      bannerImage: null,
      verified: false,
      theme: null,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    return { user: { ...user, password: undefined } };
  },

  'login': (data) => {
    const { username, password } = data;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) {
      return { error: 'Kullanıcı adı veya şifre hatalı' };
    }
    return { user: { ...user, password: undefined } };
  },

  // ═══ PROFILE ═══
  'profile': (data) => {
    const { userId, viewerId } = data;
    const user = getUser(userId);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }
    return buildProfileResponse(user, viewerId);
  },

  'profile/update': (data) => {
    const { userId, displayName, bio, profileImage, bannerImage, theme } = data;
    const user = getUser(userId);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (bannerImage !== undefined) user.bannerImage = bannerImage;
    if (theme !== undefined) user.theme = theme;

    return { user: { ...user, password: undefined } };
  },

  'profile/username': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }
    return buildProfileResponse(user, viewerId);
  },

  // ═══ FEED ═══
  'feed': (data) => {
    const { userId, algo } = data;
    const blocked = db.blocks.filter(b => b.userId === userId).map(b => b.blockedId);
    const following = db.follows.filter(f => f.followerId === userId).map(f => f.followingId);

    let yankis;

    switch (algo) {
      case 'smart': {
        // Trending/popular yankis - sort by like count
        yankis = db.yankis
          .filter(y => !y.replyToId && !blocked.includes(y.userId))
          .map(y => ({
            yanki: y,
            score: db.likes.filter(l => l.yankiId === y.id).length +
                   db.comments.filter(c => c.yankiId === y.id).length * 2 +
                   db.yankis.filter(r => r.reyankiOfId === y.id).length * 3
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 50)
          .map(item => item.yanki);
        break;
      }
      case 'explore': {
        // All yankis
        yankis = db.yankis
          .filter(y => !y.replyToId && !blocked.includes(y.userId))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50);
        break;
      }
      case 'media': {
        // Only yankis with images
        yankis = db.yankis
          .filter(y => !y.replyToId && !blocked.includes(y.userId) && y.image)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50);
        break;
      }
      case 'chrono':
      default: {
        // Current behavior - chronological, all posts (not just following)
        yankis = db.yankis
          .filter(y => !y.replyToId && !blocked.includes(y.userId))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50);
        break;
      }
    }

    return {
      yankis: yankis.map(y => enrichYanki(y, userId)).filter(Boolean)
    };
  },

  // ═══ YANKI CRUD ═══
  'yanki/create': (data) => {
    const { userId, text, image, poll, replyToId } = data;
    // Accept both reyankiOfId and reyanki for the reyanki source
    const reyankiOfId = data.reyankiOfId || data.reyanki || null;

    if (!text && !image && !poll) {
      return { error: 'İçerik gerekli' };
    }

    const yanki = {
      id: genId(),
      userId,
      text: text || '',
      image: image || null,
      poll: poll || null,
      replyToId: replyToId || null,
      reyankiOfId: reyankiOfId,
      pinned: false,
      createdAt: new Date().toISOString()
    };
    db.yankis.push(yanki);

    // Notification for reply
    if (replyToId) {
      const parent = db.yankis.find(y => y.id === replyToId);
      if (parent && parent.userId !== userId) {
        db.notifications.push({
          id: genId(),
          userId: parent.userId,
          fromId: userId,
          type: 'comment',
          yankiId: yanki.id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return { yanki: enrichYanki(yanki, userId) };
  },

  // Single yanki endpoint (frontend calls /yanki)
  'yanki': (data) => {
    const { yankiId, viewerId } = data;
    const yanki = db.yankis.find(y => y.id === yankiId);
    if (!yanki) {
      return { error: 'Yankı bulunamadı' };
    }

    const comments = db.yankis
      .filter(y => y.replyToId === yankiId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => enrichYanki(c, viewerId))
      .filter(Boolean);

    return { ...enrichYanki(yanki, viewerId), comments };
  },

  'yanki/get': (data) => {
    const { yankiId, viewerId } = data;
    const yanki = db.yankis.find(y => y.id === yankiId);
    if (!yanki) {
      return { error: 'Yankı bulunamadı' };
    }

    const comments = db.yankis
      .filter(y => y.replyToId === yankiId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => enrichYanki(c, viewerId))
      .filter(Boolean);

    return { ...enrichYanki(yanki, viewerId), comments };
  },

  'yanki/delete': (data) => {
    const { yankiId, userId } = data;
    const idx = db.yankis.findIndex(y => y.id === yankiId && y.userId === userId);
    if (idx === -1) {
      return { error: 'Yankı bulunamadı veya yetkiniz yok' };
    }
    db.yankis.splice(idx, 1);
    // Clean up related data
    db.likes = db.likes.filter(l => l.yankiId !== yankiId);
    db.comments = db.comments.filter(c => c.yankiId !== yankiId);
    db.saves = db.saves.filter(s => s.yankiId !== yankiId);
    return { success: true };
  },

  'yanki/reyanki': (data) => {
    const { yankiId, userId, text } = data;
    const original = db.yankis.find(y => y.id === yankiId);
    if (!original) {
      return { error: 'Yankı bulunamadı' };
    }

    // Check if already reyanked
    const existing = db.yankis.find(y => y.reyankiOfId === yankiId && y.userId === userId);
    if (existing) {
      // Remove reyanki
      db.yankis = db.yankis.filter(y => y.id !== existing.id);
      return { removed: true };
    }

    const reyanki = {
      id: genId(),
      userId,
      text: text || '',
      image: null,
      poll: null,
      replyToId: null,
      reyankiOfId: yankiId,
      pinned: false,
      createdAt: new Date().toISOString()
    };
    db.yankis.push(reyanki);

    // Notification
    if (original.userId !== userId) {
      db.notifications.push({
        id: genId(),
        userId: original.userId,
        fromId: userId,
        type: 'reyanki',
        yankiId: reyanki.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return { yanki: enrichYanki(reyanki, userId) };
  },

  // ═══ LIKE ═══
  'like': (data) => {
    const { yankiId, userId } = data;
    const existing = db.likes.find(l => l.yankiId === yankiId && l.userId === userId);

    if (existing) {
      db.likes = db.likes.filter(l => l.id !== existing.id);
      const count = db.likes.filter(l => l.yankiId === yankiId).length;
      return { success: true, liked: false, count };
    }

    db.likes.push({
      id: genId(),
      yankiId,
      userId,
      createdAt: new Date().toISOString()
    });

    // Notification
    const yanki = db.yankis.find(y => y.id === yankiId);
    if (yanki && yanki.userId !== userId) {
      db.notifications.push({
        id: genId(),
        userId: yanki.userId,
        fromId: userId,
        type: 'like',
        yankiId,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    const count = db.likes.filter(l => l.yankiId === yankiId).length;
    return { success: true, liked: true, count };
  },

  // Alias: yanki/like -> like
  'yanki/like': (data) => {
    return routes['like'](data);
  },

  // ═══ SAVE ═══
  'save': (data) => {
    const { yankiId, userId } = data;
    const existing = db.saves.find(s => s.yankiId === yankiId && s.userId === userId);

    if (existing) {
      db.saves = db.saves.filter(s => s.id !== existing.id);
      return { success: true, saved: false };
    }

    db.saves.push({
      id: genId(),
      yankiId,
      userId,
      createdAt: new Date().toISOString()
    });

    return { success: true, saved: true };
  },

  // Alias: yanki/save -> save
  'yanki/save': (data) => {
    return routes['save'](data);
  },

  'saved': (data) => {
    const { userId } = data;
    const saves = db.saves.filter(s => s.userId === userId);
    const yankis = saves
      .map(s => db.yankis.find(y => y.id === s.yankiId))
      .filter(Boolean)
      .map(y => enrichYanki(y, userId))
      .filter(Boolean);

    return { yankis };
  },

  // ═══ PIN ═══
  'yanki/pin': (data) => {
    const { userId, yankiId } = data;
    const yanki = db.yankis.find(y => y.id === yankiId && y.userId === userId);
    if (!yanki) {
      return { error: 'Yankı bulunamadı veya yetkiniz yok' };
    }

    // Toggle pin
    yanki.pinned = !yanki.pinned;

    // If pinning, unpin all other yankis by this user
    if (yanki.pinned) {
      db.yankis.forEach(y => {
        if (y.userId === userId && y.id !== yankiId) {
          y.pinned = false;
        }
      });
    }

    return { success: true, pinned: yanki.pinned };
  },

  // ═══ COMMENT ═══
  'comment': (data) => {
    const { yankiId, userId, text, replyToId, image } = data;
    if (!text) {
      return { error: 'Yorum boş olamaz' };
    }

    // Create as reply yanki
    const reply = {
      id: genId(),
      userId,
      text,
      image: image || null,
      poll: null,
      replyToId: replyToId || yankiId,
      reyankiOfId: null,
      pinned: false,
      createdAt: new Date().toISOString()
    };
    db.yankis.push(reply);

    // Also add to comments for backward compatibility
    db.comments.push({
      id: reply.id,
      yankiId,
      userId,
      text,
      createdAt: reply.createdAt
    });

    // Notification
    const yanki = db.yankis.find(y => y.id === yankiId);
    if (yanki && yanki.userId !== userId) {
      db.notifications.push({
        id: genId(),
        userId: yanki.userId,
        fromId: userId,
        type: 'comment',
        yankiId: reply.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return { success: true, comment: enrichYanki(reply, userId) };
  },

  // Alias: comment/create -> comment
  'comment/create': (data) => {
    return routes['comment'](data);
  },

  // ═══ FOLLOW ═══
  'follow': (data) => {
    const { followerId, followingId } = data;
    if (followerId === followingId) {
      return { error: 'Kendini takip edemezsin' };
    }

    const existing = db.follows.find(f => f.followerId === followerId && f.followingId === followingId);

    if (existing) {
      db.follows = db.follows.filter(f => f.id !== existing.id);
      return { following: false };
    }

    db.follows.push({
      id: genId(),
      followerId,
      followingId,
      createdAt: new Date().toISOString()
    });

    // Notification
    db.notifications.push({
      id: genId(),
      userId: followingId,
      fromId: followerId,
      type: 'follow',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { following: true };
  },

  // ═══ NOTIFICATIONS ═══
  'notifications': (data) => {
    const { userId } = data;
    const notifs = db.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
      .map(n => {
        const from = getUser(n.fromId);
        return {
          ...n,
          fromName: from?.displayName || 'Kullanıcı',
          fromUsername: from?.username
        };
      });

    // Mark as read
    db.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);

    return { notifications: notifs };
  },

  'notifications/count': (data) => {
    const { userId } = data;
    if (!userId) return { count: 0 };
    const count = db.notifications.filter(n => n.userId === userId && !n.read).length;
    return { count };
  },

  // ═══ USER ═══
  'user': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    const followerCount = db.follows.filter(f => f.followingId === user.id).length;
    const followingCount = db.follows.filter(f => f.followerId === user.id).length;
    const isFollowing = db.follows.some(f => f.followerId === viewerId && f.followingId === user.id);

    return {
      user: {
        ...user,
        password: undefined,
        followerCount,
        followingCount
      },
      isFollowing
    };
  },

  'user/yankis': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    const yankis = db.yankis
      .filter(y => y.userId === user.id && !y.replyToId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(y => enrichYanki(y, viewerId))
      .filter(Boolean);

    return { yankis };
  },

  // Alias: /yankis endpoint - lookup by userId instead of username
  'yankis': (data) => {
    const { userId, viewerId } = data;
    const user = getUser(userId);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    const yankis = db.yankis
      .filter(y => y.userId === user.id && !y.replyToId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(y => enrichYanki(y, viewerId))
      .filter(Boolean);

    return { yankis };
  },

  'user/followers': (data) => {
    const { userId } = data;
    const followerIds = db.follows.filter(f => f.followingId === userId).map(f => f.followerId);
    const users = followerIds.map(id => {
      const u = getUser(id);
      return u ? { ...u, password: undefined } : null;
    }).filter(Boolean);
    return { users };
  },

  'user/following': (data) => {
    const { userId } = data;
    const followingIds = db.follows.filter(f => f.followerId === userId).map(f => f.followingId);
    const users = followingIds.map(id => {
      const u = getUser(id);
      return u ? { ...u, password: undefined } : null;
    }).filter(Boolean);
    return { users };
  },

  'user/update': (data) => {
    const { userId, displayName, bio, profileImage, bannerImage, theme } = data;
    const user = getUser(userId);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (bannerImage !== undefined) user.bannerImage = bannerImage;
    if (theme !== undefined) user.theme = theme;

    return { user: { ...user, password: undefined } };
  },

  // ═══ BLOCK ═══
  'block': (data) => {
    const { userId, targetId } = data;
    const existing = db.blocks.find(b => b.userId === userId && b.blockedId === targetId);

    if (existing) {
      db.blocks = db.blocks.filter(b => b.id !== existing.id);
      return { blocked: false };
    }

    db.blocks.push({
      id: genId(),
      userId,
      blockedId: targetId,
      createdAt: new Date().toISOString()
    });

    // Remove follow relationships
    db.follows = db.follows.filter(f =>
      !(f.followerId === userId && f.followingId === targetId) &&
      !(f.followerId === targetId && f.followingId === userId)
    );

    return { blocked: true };
  },

  // ═══ REPORT ═══
  'report': (data) => {
    const { yankiId, userId, reason } = data;

    db.reports.push({
      id: genId(),
      yankiId,
      reporterId: userId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return { success: true };
  },

  // ═══ SEARCH ═══
  'search': (data) => {
    const { query, userId } = data;
    const q = query.toLowerCase();

    if (q.startsWith('#')) {
      const tag = q.slice(1);
      const yankis = db.yankis
        .filter(y => y.text.toLowerCase().includes('#' + tag))
        .map(y => enrichYanki(y, userId))
        .filter(Boolean);
      return { yankis };
    }

    if (q.startsWith('@')) {
      const username = q.slice(1);
      const users = db.users
        .filter(u => u.username.includes(username))
        .map(u => ({ ...u, password: undefined }));
      return { users, yankis: [] };
    }

    const yankis = db.yankis
      .filter(y => y.text.toLowerCase().includes(q))
      .map(y => enrichYanki(y, userId))
      .filter(Boolean);

    return { yankis };
  },

  // ═══ TRENDING ═══
  'trending': () => {
    const tagCounts = {};
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    db.yankis
      .filter(y => new Date(y.createdAt).getTime() > dayAgo)
      .forEach(y => {
        const matches = y.text.match(/#\w+/g) || [];
        matches.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

    const trends = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        category: 'Gündem'
      }));

    return { trends };
  },

  // ═══ HASHTAG ═══
  'hashtag/info': (data) => {
    const { hashtag } = data;
    const tag = hashtag.startsWith('#') ? hashtag : '#' + hashtag;
    const tagLower = tag.toLowerCase();

    const allMatching = db.yankis.filter(y => y.text.toLowerCase().includes(tagLower));
    const totalYankis = allMatching.length;

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const last24h = allMatching.filter(y => new Date(y.createdAt).getTime() > dayAgo).length;

    return { totalYankis, last24h };
  },

  // ═══ THREAD ═══
  'thread/create': (data) => {
    const { userId, items } = data;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { error: 'Thread items gerekli' };
    }

    let previousId = null;
    const createdYankis = [];

    for (const item of items) {
      const yanki = {
        id: genId(),
        userId,
        text: item.text || '',
        image: item.image || null,
        poll: null,
        replyToId: previousId,
        reyankiOfId: null,
        pinned: false,
        createdAt: new Date().toISOString()
      };
      db.yankis.push(yanki);
      createdYankis.push(yanki);

      // Add to comments if it's a reply
      if (previousId) {
        db.comments.push({
          id: yanki.id,
          yankiId: previousId,
          userId,
          text: yanki.text,
          createdAt: yanki.createdAt
        });
      }

      previousId = yanki.id;
    }

    return { success: true, count: createdYankis.length };
  },

  // ═══ SCHEDULE ═══
  'schedule/create': (data) => {
    const { userId, text, image, poll, scheduledAt, threadItems } = data;

    // For now, store the scheduled post
    const scheduled = {
      id: genId(),
      userId,
      text: text || '',
      image: image || null,
      poll: poll || null,
      scheduledAt: scheduledAt || new Date().toISOString(),
      threadItems: threadItems || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.scheduled.push(scheduled);

    // If scheduledAt is in the past or very soon, create immediately
    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      if (threadItems && threadItems.length > 0) {
        // Create as thread
        return routes['thread/create']({ userId, items: threadItems });
      } else {
        // Create as single yanki
        const result = routes['yanki/create']({ userId, text, image, poll });
        scheduled.status = 'published';
        return { success: true, yanki: result.yanki };
      }
    }

    return { success: true, scheduledId: scheduled.id };
  },

  // ═══ MESSAGES ═══
  'messages/conversations': (data) => {
    const { userId } = data;
    // Return conversations the user is part of
    const userConversations = db.conversations
      .filter(c => c.participants.includes(userId))
      .map(c => {
        const otherUserId = c.participants.find(p => p !== userId);
        const otherUser = getUser(otherUserId);
        const lastMessage = db.messages
          .filter(m => m.conversationId === c.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const unread = db.messages
          .filter(m => m.conversationId === c.id && m.userId !== userId && !m.read)
          .length;

        return {
          id: c.id,
          otherUser: otherUser ? { ...otherUser, password: undefined } : null,
          lastMessage: lastMessage || null,
          unread,
          createdAt: c.createdAt
        };
      });

    return { conversations: userConversations };
  },

  // ═══ EXPLORE ═══
  'explore/suggested': (data) => {
    const { userId, limit } = data;
    const following = db.follows.filter(f => f.followerId === userId).map(f => f.followingId);

    const users = db.users
      .filter(u => u.id !== userId && !following.includes(u.id))
      .slice(0, limit || 5)
      .map(u => ({ ...u, password: undefined }));

    return { users };
  },

  // Alias: explore/suggested-users -> explore/suggested
  'explore/suggested-users': (data) => {
    return routes['explore/suggested'](data);
  },

  'explore/trending-yankis': (data) => {
    const { viewerId, limit } = data;
    const maxItems = limit || 20;

    // Get yankis sorted by engagement (likes + comments + reyankis)
    const yankis = db.yankis
      .filter(y => !y.replyToId)
      .map(y => ({
        yanki: y,
        score: db.likes.filter(l => l.yankiId === y.id).length +
               db.comments.filter(c => c.yankiId === y.id).length * 2 +
               db.yankis.filter(r => r.reyankiOfId === y.id).length * 3
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => enrichYanki(item.yanki, viewerId))
      .filter(Boolean);

    return { yankis };
  },

  // ═══ POLL ═══
  'poll/vote': (data) => {
    const { yankiId, userId, optionIndex } = data;
    const yanki = db.yankis.find(y => y.id === yankiId);

    if (!yanki || !yanki.poll) {
      return { error: 'Anket bulunamadı' };
    }

    // Check if already voted
    const existing = db.pollVotes.find(v => v.yankiId === yankiId && v.userId === userId);
    if (existing) {
      return { error: 'Zaten oy kullandınız' };
    }

    db.pollVotes.push({
      id: genId(),
      yankiId,
      userId,
      optionIndex,
      createdAt: new Date().toISOString()
    });

    // Update poll votes
    if (!yanki.poll.votes) {
      yanki.poll.votes = yanki.poll.options.map(() => 0);
    }
    yanki.poll.votes[optionIndex]++;
    yanki.poll.votedIndex = optionIndex;

    return { success: true };
  }
};

// ─── Server ────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Static files
  if (req.method === 'GET') {
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath);

    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback
    if (!ext) {
      filePath = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
  }

  // API routes
  if (req.method === 'POST') {
    const endpoint = pathname.slice(1);

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try {
        data = JSON.parse(body || '{}');
      } catch (e) {}

      const handler = routes[endpoint];
      if (handler) {
        const result = handler(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🐦 Yankuş server running on port ${PORT}`);
});
