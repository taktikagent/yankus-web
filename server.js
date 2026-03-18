// ═══════════════════════════════════════════════════════════════
// YANKUŞ WEB SERVER — Vercel Uyumlu
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
  contacts: [],
  messages: [],
  feedback: [],
  collections: [],
  saveNotes: [],
  collectionItems: [],
  drafts: [],
  scheduled: [],
  threads: []
};

// ─── Bot Profiles ──────────────────────────────────────────────
const BOT_PROFILES = [
  { username: 'ayse_dev', displayName: 'Ayşe | Yazılımcı 👩‍💻', bio: 'Full-stack developer. React & Node.js', verified: true, personality: 'teknik', interests: ['yazılım', 'teknoloji'], mood: 'helpful', style: 'profesyonel' },
  { username: 'mehmet_tasarim', displayName: 'Mehmet Tasarım 🎨', bio: 'UI/UX Designer | Figma', verified: true, personality: 'yaratıcı', interests: ['tasarım', 'sanat'], mood: 'inspiring', style: 'yaratıcı' },
  { username: 'zeynep_muzik', displayName: 'Zeynep 🎵', bio: 'Müzisyen | Şarkı sözü yazarı', verified: false, personality: 'sanatsal', interests: ['müzik', 'sanat'], mood: 'dreamy', style: 'duygusal' },
  { username: 'ahmet_foto', displayName: 'Ahmet | Fotoğrafçı 📸', bio: 'Doğa ve sokak fotoğrafçılığı', verified: true, personality: 'gözlemci', interests: ['fotoğraf', 'seyahat'], mood: 'calm', style: 'minimal' },
  { username: 'elif_yazar', displayName: 'Elif Kalem ✍️', bio: 'Yazar | Hikaye anlatıcısı', verified: false, personality: 'hikayeci', interests: ['edebiyat', 'yazı'], mood: 'thoughtful', style: 'edebi' },
];

// ─── Init Admin & Bots ─────────────────────────────────────────
function initData() {
  // Admin
  if (!db.users.find(u => u.username === 'admin')) {
    db.users.push({
      id: 'admin_001', username: 'admin', password: 'admin123',
      displayName: 'Admin', bio: '🔧 Yankuş Yöneticisi',
      profileImage: null, bannerImage: null, verified: true, isAdmin: true,
      createdAt: new Date().toISOString()
    });
  }
  
  // Bots
  BOT_PROFILES.forEach((bot, i) => {
    if (!db.users.find(u => u.username === bot.username)) {
      db.users.push({
        id: `bot_${i + 1}`, username: bot.username, password: 'bot123',
        displayName: bot.displayName, bio: bot.bio,
        profileImage: null, bannerImage: null, verified: bot.verified,
        isBot: true, personality: bot.personality,
        createdAt: new Date().toISOString()
      });
    }
  });

  // Sample Yankis
  const sampleYankis = [
    { userId: 'bot_1', text: 'React 19 çıktı! Yeni özellikler harika 🚀 #react #yazılım' },
    { userId: 'bot_2', text: 'Bugünkü UI tasarımım nasıl olmuş? Figma ile yaptım ✨ #tasarım #ui' },
    { userId: 'bot_3', text: 'Yeni şarkımı dinlediniz mi? Link bioda 🎵 #müzik #yenişarkı' },
    { userId: 'bot_4', text: 'Kapadokya\'dan muhteşem bir gün batımı 🌅 #fotoğraf #kapadokya' },
    { userId: 'bot_5', text: 'Yeni hikayem yayında! Okumak ister misiniz? ✍️ #edebiyat #hikaye' },
  ];
  
  sampleYankis.forEach((y, i) => {
    if (db.yankis.length < 5) {
      db.yankis.push({
        id: `yanki_${i + 1}`, ...y,
        image: null, poll: null, deleted: false,
        createdAt: new Date(Date.now() - i * 3600000).toISOString()
      });
    }
  });
}

initData();

// ─── Helper Functions ──────────────────────────────────────────
const send = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

const enrichYanki = (y, viewerId) => {
  const author = db.users.find(u => u.id === y.userId);
  return {
    ...y,
    // Düz alanlar (frontend uyumluluğu için)
    displayName: author?.displayName || 'Bilinmeyen',
    username: author?.username || 'bilinmeyen',
    profileImage: author?.profileImage || null,
    verified: author?.verified || false,
    isBot: author?.isBot || false,
    // Author objesi (detaylı bilgi için)
    author: author ? { id: author.id, username: author.username, displayName: author.displayName, profileImage: author.profileImage, verified: author.verified, isBot: author.isBot } : null,
    // İstatistikler
    likes: db.likes.filter(l => l.yankiId === y.id).length,
    commentCount: db.comments.filter(c => c.yankiId === y.id && !c.deleted).length,
    comments: db.comments.filter(c => c.yankiId === y.id && !c.deleted).length,
    isLiked: viewerId ? db.likes.some(l => l.yankiId === y.id && l.userId === viewerId) : false,
    isSaved: viewerId ? db.saves.some(s => s.yankiId === y.id && s.userId === viewerId) : false,
    liked: viewerId ? db.likes.some(l => l.yankiId === y.id && l.userId === viewerId) : false,
    saved: viewerId ? db.saves.some(s => s.yankiId === y.id && s.userId === viewerId) : false
  };
};

// ─── API Handlers ──────────────────────────────────────────────
const handlers = {
  // Auth
  register: (d) => {
    const uname = (d.username || '').toLowerCase().replace('@', '').trim();
    if (db.users.find(u => u.username === uname)) return { error: 'Bu kullanıcı adı alınmış' };
    const user = {
      id: Date.now().toString(), username: uname, password: d.password,
      displayName: d.displayName || uname, bio: '', profileImage: null, bannerImage: null,
      verified: false, isAdmin: false, isBot: false, createdAt: new Date().toISOString()
    };
    db.users.push(user);
    return { success: true, user: { ...user, password: undefined } };
  },
  
  login: (d) => {
    const uname = (d.username || '').toLowerCase().replace('@', '').trim();
    const user = db.users.find(u => u.username === uname && u.password === d.password);
    if (!user) return { error: 'Kullanıcı adı veya şifre hatalı' };
    if (user.banned) return { error: 'Hesabınız askıya alınmıştır' };
    return { success: true, user: { ...user, password: undefined } };
  },

  // Profile
  profile: (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return {
      ...user, password: undefined,
      stats: {
        yankis: db.yankis.filter(y => y.userId === d.userId && !y.deleted).length,
        followers: db.follows.filter(f => f.followingId === d.userId).length,
        following: db.follows.filter(f => f.followerId === d.userId).length
      },
      isFollowing: d.viewerId ? db.follows.some(f => f.followerId === d.viewerId && f.followingId === d.userId) : false
    };
  },

  'profile/username': (d) => {
    const user = db.users.find(u => u.username === (d.username || '').toLowerCase().replace('@', ''));
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return handlers.profile({ userId: user.id, viewerId: d.viewerId });
  },

  'profile/update': (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    if (d.displayName) user.displayName = d.displayName;
    if (d.bio !== undefined) user.bio = d.bio;
    if (d.profileImage !== undefined) user.profileImage = d.profileImage;
    if (d.bannerImage !== undefined) user.bannerImage = d.bannerImage;
    return { success: true, user: { ...user, password: undefined } };
  },

  // Yankı
  'yanki/create': (d) => {
    if (!d.text?.trim() && !d.image) return { error: 'Boş yankı gönderilemez' };
    const yanki = {
      id: 'y_' + Date.now(), userId: d.userId, text: d.text?.trim() || '',
      image: d.image || null, poll: d.poll || null, deleted: false,
      createdAt: new Date().toISOString()
    };
    db.yankis.unshift(yanki);
    return { success: true, yanki: enrichYanki(yanki, d.userId) };
  },

  'yanki/get': (d) => {
    const yanki = db.yankis.find(y => y.id === d.yankiId && !y.deleted);
    if (!yanki) return { error: 'Yankı bulunamadı' };
    const comments = db.comments
      .filter(c => c.yankiId === d.yankiId && !c.deleted)
      .map(c => {
        const author = db.users.find(u => u.id === c.userId);
        return {
          ...c,
          displayName: author?.displayName || 'Bilinmeyen',
          username: author?.username || 'bilinmeyen',
          profileImage: author?.profileImage || null,
          isBot: author?.isBot || false
        };
      });
    return { yanki: enrichYanki(yanki, d.viewerId), comments };
  },

  feed: (d) => {
    const followingIds = db.follows.filter(f => f.followerId === d.userId).map(f => f.followingId);
    followingIds.push(d.userId);
    const yankis = db.yankis
      .filter(y => !y.deleted && followingIds.includes(y.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, d.limit || 50)
      .map(y => enrichYanki(y, d.userId));
    return { yankis };
  },

  explore: (d) => {
    const yankis = db.yankis
      .filter(y => !y.deleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, d.limit || 50)
      .map(y => enrichYanki(y, d.viewerId));
    return { yankis };
  },

  yankis: (d) => {
    const yankis = db.yankis
      .filter(y => !y.deleted && (!d.userId || y.userId === d.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, d.limit || 50)
      .map(y => enrichYanki(y, d.viewerId));
    return { yankis };
  },

  'yanki/like': (d) => {
    const exists = db.likes.find(l => l.userId === d.userId && l.yankiId === d.yankiId);
    if (exists) {
      db.likes = db.likes.filter(l => !(l.userId === d.userId && l.yankiId === d.yankiId));
      return { success: true, liked: false };
    }
    db.likes.push({ userId: d.userId, yankiId: d.yankiId, createdAt: new Date().toISOString() });
    return { success: true, liked: true };
  },

  'yanki/save': (d) => {
    const exists = db.saves.find(s => s.userId === d.userId && s.yankiId === d.yankiId);
    if (exists) {
      db.saves = db.saves.filter(s => !(s.userId === d.userId && s.yankiId === d.yankiId));
      return { success: true, saved: false };
    }
    db.saves.push({ userId: d.userId, yankiId: d.yankiId, createdAt: new Date().toISOString() });
    return { success: true, saved: true };
  },

  // Follow
  follow: (d) => {
    if (d.followerId === d.followingId) return { error: 'Kendinizi takip edemezsiniz' };
    const exists = db.follows.find(f => f.followerId === d.followerId && f.followingId === d.followingId);
    if (exists) {
      db.follows = db.follows.filter(f => !(f.followerId === d.followerId && f.followingId === d.followingId));
      return { success: true, following: false };
    }
    db.follows.push({ followerId: d.followerId, followingId: d.followingId, createdAt: new Date().toISOString() });
    return { success: true, following: true };
  },

  followers: (d) => {
    const ids = db.follows.filter(f => f.followingId === d.userId).map(f => f.followerId);
    return { followers: db.users.filter(u => ids.includes(u.id)).map(u => ({ id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage, verified: u.verified })) };
  },

  following: (d) => {
    const ids = db.follows.filter(f => f.followerId === d.userId).map(f => f.followingId);
    return { following: db.users.filter(u => ids.includes(u.id)).map(u => ({ id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage, verified: u.verified })) };
  },

  // Comments
  'comment/create': (d) => {
    const comment = {
      id: 'c_' + Date.now(), userId: d.userId, yankiId: d.yankiId,
      text: d.text, deleted: false, createdAt: new Date().toISOString()
    };
    db.comments.push(comment);
    return { success: true, comment };
  },

  comments: (d) => {
    const comments = db.comments
      .filter(c => c.yankiId === d.yankiId && !c.deleted)
      .map(c => {
        const author = db.users.find(u => u.id === c.userId);
        return { ...c, author: author ? { id: author.id, username: author.username, displayName: author.displayName, profileImage: author.profileImage, verified: author.verified } : null };
      });
    return { comments };
  },

  // Notifications
  notifications: (d) => {
    return { notifications: db.notifications.filter(n => n.userId === d.userId).slice(0, 50), unreadCount: db.notifications.filter(n => n.userId === d.userId && !n.read).length };
  },

  'notifications/read': (d) => {
    db.notifications.filter(n => n.userId === d.userId).forEach(n => n.read = true);
    return { success: true };
  },

  // Messages
  'messages/conversations': (d) => {
    const userMsgs = db.messages.filter(m => (m.fromUserId === d.userId || m.toUserId === d.userId) && !m.deleted);
    const convos = {};
    userMsgs.forEach(m => {
      const otherId = m.fromUserId === d.userId ? m.toUserId : m.fromUserId;
      if (!convos[otherId] || new Date(m.createdAt) > new Date(convos[otherId].createdAt)) {
        convos[otherId] = m;
      }
    });
    return {
      conversations: Object.entries(convos).map(([oderId, msg]) => {
        const other = db.users.find(u => u.id === oderId);
        return { userId: oderId, displayName: other?.displayName, username: other?.username, profileImage: other?.profileImage, lastMessage: msg };
      })
    };
  },

  'messages/get': (d) => {
    return {
      messages: db.messages
        .filter(m => (m.fromUserId === d.userId && m.toUserId === d.otherId) || (m.fromUserId === d.otherId && m.toUserId === d.userId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    };
  },

  'messages/send': (d) => {
    const msg = {
      id: 'msg_' + Date.now(), fromUserId: d.fromUserId, toUserId: d.toUserId,
      text: d.text, deleted: false, read: false, createdAt: new Date().toISOString()
    };
    db.messages.push(msg);
    return { success: true, message: msg };
  },

  // Trending
  trending: () => {
    const counts = {};
    db.yankis.filter(y => !y.deleted).forEach(y => {
      (y.text?.match(/#[\wğüşıöçĞÜŞİÖÇ]+/gi) || []).forEach(tag => {
        counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] || 0) + 1;
      });
    });
    const trends = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count], i) => ({ rank: i + 1, topic: tag, count: count + ' yankı' }));
    if (trends.length < 3) {
      trends.push({ rank: trends.length + 1, topic: '#yankuş', count: 'Yeni' });
      trends.push({ rank: trends.length + 1, topic: '#merhaba', count: 'Popüler' });
    }
    return { trends };
  },

  // Admin Stats
  'admin/stats': () => ({
    totalUsers: db.users.filter(u => !u.isBot && !u.isAdmin).length,
    totalBots: db.users.filter(u => u.isBot).length,
    totalYankis: db.yankis.filter(y => !y.deleted).length,
    totalComments: db.comments.filter(c => !c.deleted).length,
    totalLikes: db.likes.length,
    totalFollows: db.follows.length
  }),

  // Clan
  clan: (d) => {
    const followerCount = db.follows.filter(f => f.followingId === d.userId).length;
    const tiers = [
      { min: 0, max: 4, name: 'Yalnız Gezgin', icon: '🏕️' },
      { min: 5, max: 19, name: 'Küçük Köy', icon: '🏘️' },
      { min: 20, max: 49, name: 'Kasaba', icon: '🏙️' },
      { min: 50, max: 99, name: 'Şehir', icon: '🌆' },
      { min: 100, max: 249, name: 'Büyük Şehir', icon: '🌃' },
      { min: 250, max: 499, name: 'Metropol', icon: '🌇' },
      { min: 500, max: 999, name: 'İmparatorluk', icon: '👑' },
      { min: 1000, max: Infinity, name: 'Efsane', icon: '⚡' },
    ];
    const tier = tiers.find(t => followerCount >= t.min && followerCount <= t.max) || tiers[0];
    return { followerCount, tier };
  },

  // DNA
  dna: (d) => {
    const yankis = db.yankis.filter(y => y.userId === d.userId && !y.deleted);
    return { totalYankis: yankis.length, dna: [], topTopics: [] };
  }
};

// ─── Request Handler ───────────────────────────────────────────
const handleRequest = (req, res) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return send(res, 200, {});
  }

  const url = req.url.split('?')[0];

  // Serve static files
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    const filePath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(fs.readFileSync(filePath));
    }
  }

  // API: GET
  if (req.method === 'GET') {
    if (url === '/ping') return send(res, 200, { status: 'ok', version: '1.7.3' });
    if (url === '/trending') return send(res, 200, handlers.trending());
  }

  // API: POST
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body || '{}');
        const route = url.replace(/^\//, '');
        
        if (handlers[route]) {
          return send(res, 200, handlers[route](d));
        }
        
        send(res, 404, { error: 'Bulunamadı' });
      } catch (e) {
        send(res, 500, { error: e.message });
      }
    });
    return;
  }

  send(res, 404, { error: 'Bulunamadı' });
};

// ─── Server ────────────────────────────────────────────────────
const server = http.createServer(handleRequest);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🐦 Yankuş: http://localhost:${PORT}`);
});

// Vercel serverless export
module.exports = handleRequest;
