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
  },

  // Explore endpoints
  'explore/suggested-users': (d) => {
    const users = db.users
      .filter(u => !u.isAdmin && u.id !== d.userId)
      .slice(0, d.limit || 8)
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        profileImage: u.profileImage,
        verified: u.verified,
        isBot: u.isBot,
        reason: u.isBot ? 'Bot hesap' : 'Yeni kullanıcı'
      }));
    return { users };
  },

  'explore/trending-yankis': (d) => {
    const yankis = db.yankis
      .filter(y => !y.deleted)
      .sort((a, b) => {
        const aLikes = db.likes.filter(l => l.yankiId === a.id).length;
        const bLikes = db.likes.filter(l => l.yankiId === b.id).length;
        return bLikes - aLikes;
      })
      .slice(0, d.limit || 8)
      .map(y => enrichYanki(y, d.viewerId));
    return { yankis };
  },

  // Yanki delete
  'yanki/delete': (d) => {
    const yanki = db.yankis.find(y => y.id === d.yankiId && y.userId === d.userId);
    if (!yanki) return { error: 'Yankı bulunamadı' };
    yanki.deleted = true;
    return { success: true };
  },

  // Yanki pin
  'yanki/pin': (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    user.pinnedYankiId = user.pinnedYankiId === d.yankiId ? null : d.yankiId;
    return { success: true, pinned: user.pinnedYankiId === d.yankiId };
  },

  // Block
  block: (d) => {
    const exists = db.blocks.find(b => b.blockerId === d.blockerId && b.blockedId === d.blockedId);
    if (exists) {
      db.blocks = db.blocks.filter(b => !(b.blockerId === d.blockerId && b.blockedId === d.blockedId));
      return { success: true, blocked: false };
    }
    db.blocks.push({ blockerId: d.blockerId, blockedId: d.blockedId, createdAt: new Date().toISOString() });
    return { success: true, blocked: true };
  },

  // Search
  search: (d) => {
    const q = (d.query || d.q || '').toLowerCase();
    if (!q) return { users: [], yankis: [] };
    const users = db.users
      .filter(u => u.username.includes(q) || u.displayName?.toLowerCase().includes(q))
      .slice(0, 10)
      .map(u => ({ id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage, verified: u.verified }));
    const yankis = db.yankis
      .filter(y => !y.deleted && y.text?.toLowerCase().includes(q))
      .slice(0, 20)
      .map(y => enrichYanki(y, d.viewerId));
    return { users, yankis };
  },

  // Hashtag
  hashtag: (d) => {
    const tag = (d.hashtag || d.tag || '').toLowerCase().replace('#', '');
    const yankis = db.yankis
      .filter(y => !y.deleted && y.text?.toLowerCase().includes('#' + tag))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
      .map(y => enrichYanki(y, d.viewerId));
    return { yankis };
  },

  // Saved yankis
  'yankis/saved': (d) => {
    const savedIds = db.saves.filter(s => s.userId === d.userId).map(s => s.yankiId);
    const yankis = db.yankis
      .filter(y => !y.deleted && savedIds.includes(y.id))
      .map(y => enrichYanki(y, d.userId));
    return { yankis };
  },

  // Poll vote
  'poll/vote': (d) => {
    const exists = db.pollVotes.find(v => v.pollId === d.pollId && v.userId === d.userId);
    if (exists) return { error: 'Zaten oy verdiniz' };
    db.pollVotes.push({ pollId: d.pollId, userId: d.userId, optionId: d.optionId, createdAt: new Date().toISOString() });
    return { success: true };
  },

  // Contact
  contact: (d) => {
    db.contacts.push({ userId: d.userId, subject: d.subject, message: d.message, createdAt: new Date().toISOString() });
    return { success: true };
  },

  // Patch notes
  patchnotes: () => {
    return { patchNotes: [
      { version: '1.8.0', date: '2026-03-19', features: [
        '🐦 Yankıla Butonu — Sidebar\'da büyük buton',
        '💬 Yankıla Popup — Fotoğraf ve anket destekli',
        '🔧 Nick düzeltmesi — Artık undefined göstermiyor',
        '📝 Tüm eksik API endpoint\'leri eklendi'
      ]}
    ]};
  },

  // Blocked users
  blocked: (d) => {
    const blockedIds = db.blocks.filter(b => b.blockerId === d.userId).map(b => b.blockedId);
    const users = db.users
      .filter(u => blockedIds.includes(u.id))
      .map(u => ({ id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage }));
    return { users };
  },

  // Thread create
  'thread/create': (d) => {
    if (!d.items || d.items.length < 2) return { error: 'Thread için en az 2 yankı gerekli' };
    const threadId = 'th_' + Date.now();
    d.items.forEach((item, i) => {
      const yanki = {
        id: 'y_' + Date.now() + '_' + i,
        userId: d.userId,
        text: item.text || '',
        image: item.image || null,
        threadId,
        threadOrder: i,
        deleted: false,
        createdAt: new Date(Date.now() + i).toISOString()
      };
      db.yankis.unshift(yanki);
    });
    return { success: true, count: d.items.length, threadId };
  },

  // Draft endpoints
  'draft/save': (d) => {
    const draft = {
      id: 'dr_' + Date.now(),
      userId: d.userId,
      text: d.text || '',
      image: d.image || null,
      createdAt: new Date().toISOString()
    };
    db.drafts.push(draft);
    return { success: true, draft };
  },

  'draft/list': (d) => {
    const drafts = db.drafts.filter(dr => dr.userId === d.userId);
    return { drafts };
  },

  'draft/delete': (d) => {
    db.drafts = db.drafts.filter(dr => dr.id !== d.draftId);
    return { success: true };
  },

  // Schedule endpoints
  'schedule/create': (d) => {
    const scheduled = {
      id: 'sc_' + Date.now(),
      userId: d.userId,
      text: d.text || '',
      image: d.image || null,
      scheduledAt: d.scheduledAt,
      createdAt: new Date().toISOString()
    };
    db.scheduled.push(scheduled);
    return { success: true, scheduled };
  },

  'schedule/list': (d) => {
    const items = db.scheduled.filter(sc => sc.userId === d.userId);
    return { items };
  },

  'schedule/cancel': (d) => {
    db.scheduled = db.scheduled.filter(sc => sc.id !== d.schedId);
    return { success: true };
  },

  // Report
  'yanki/report': (d) => {
    db.feedback.push({
      id: 'rp_' + Date.now(),
      type: 'report',
      userId: d.userId,
      yankiId: d.yankiId,
      reason: d.reason || 'Şikayet',
      createdAt: new Date().toISOString()
    });
    return { success: true };
  },

  // Admin endpoints
  'admin/users': (d) => {
    const users = db.users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      profileImage: u.profileImage,
      verified: u.verified,
      isBot: u.isBot,
      isAdmin: u.isAdmin,
      banned: u.banned || false,
      createdAt: u.createdAt
    }));
    return { users };
  },

  'admin/user/ban': (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    user.banned = d.ban;
    return { success: true, banned: user.banned };
  },

  'admin/user/delete': (d) => {
    db.users = db.users.filter(u => u.id !== d.userId);
    db.yankis = db.yankis.filter(y => y.userId !== d.userId);
    return { success: true };
  },

  'admin/yankis/recent': (d) => {
    const yankis = db.yankis
      .filter(y => !y.deleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, d.limit || 50)
      .map(y => enrichYanki(y, null));
    return { yankis };
  },

  'admin/yanki/delete': (d) => {
    const yanki = db.yankis.find(y => y.id === d.yankiId);
    if (yanki) yanki.deleted = true;
    return { success: true };
  },

  'admin/feedback': () => {
    return { feedback: db.feedback };
  },

  'admin/bots': () => {
    const bots = db.users.filter(u => u.isBot).map(b => ({
      id: b.id,
      username: b.username,
      displayName: b.displayName,
      active: true
    }));
    return { bots };
  },

  'admin/user/detail': (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return { ...user, password: undefined };
  },

  'admin/user/make-admin': (d) => {
    const user = db.users.find(u => u.id === d.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    user.isAdmin = d.makeAdmin;
    return { success: true };
  },

  'admin/reports': () => {
    return { reports: db.feedback.filter(f => f.type === 'report') };
  },

  'admin/analytics': () => {
    return {
      dailyUsers: 0,
      dailyYankis: db.yankis.filter(y => !y.deleted).length,
      dailyLikes: db.likes.length,
      growth: 0
    };
  },

  'admin/bot/toggle': () => {
    return { success: true, running: true };
  },

  'admin/bot/trigger': (d) => {
    return { success: true, action: d.action };
  },

  'admin/yanki/report': (d) => {
    db.feedback.push({
      id: 'rp_' + Date.now(),
      type: 'report',
      reporterId: d.reporterId,
      yankiId: d.yankiId,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  },

  'admin/yankis/bulk-delete': (d) => {
    (d.yankiIds || []).forEach(id => {
      const y = db.yankis.find(y => y.id === id);
      if (y) y.deleted = true;
    });
    return { success: true };
  },

  // Messages read
  'messages/read': (d) => {
    db.messages.filter(m => m.toUserId === d.userId && m.fromUserId === d.otherId).forEach(m => m.read = true);
    return { success: true };
  },

  'messages/delete': (d) => {
    const msg = db.messages.find(m => m.id === d.msgId);
    if (msg) msg.deleted = true;
    return { success: true };
  },

  'messages/react': (d) => {
    const msg = db.messages.find(m => m.id === d.msgId);
    if (msg) {
      msg.reactions = msg.reactions || [];
      msg.reactions.push({ userId: d.userId, emoji: d.emoji });
    }
    return { success: true };
  },

  'messages/search': (d) => {
    const q = (d.q || '').toLowerCase();
    const messages = db.messages.filter(m => 
      (m.fromUserId === d.userId || m.toUserId === d.userId) && 
      m.text?.toLowerCase().includes(q)
    );
    return { messages };
  },

  // Collection endpoints
  'collections/get': (d) => {
    const collections = db.collections.filter(c => c.userId === d.userId);
    return { collections };
  },

  'collection/create': (d) => {
    const col = {
      id: 'col_' + Date.now(),
      userId: d.userId,
      name: d.name,
      emoji: d.emoji || '📁',
      createdAt: new Date().toISOString()
    };
    db.collections.push(col);
    return { success: true, collection: col };
  },

  'collection/delete': (d) => {
    db.collections = db.collections.filter(c => c.id !== d.collectionId);
    db.collectionItems = db.collectionItems.filter(ci => ci.collectionId !== d.collectionId);
    return { success: true };
  },

  'collection/toggle-item': (d) => {
    const exists = db.collectionItems.find(ci => ci.collectionId === d.collectionId && ci.yankiId === d.yankiId);
    if (exists) {
      db.collectionItems = db.collectionItems.filter(ci => !(ci.collectionId === d.collectionId && ci.yankiId === d.yankiId));
      return { success: true, added: false };
    }
    db.collectionItems.push({ collectionId: d.collectionId, yankiId: d.yankiId, createdAt: new Date().toISOString() });
    return { success: true, added: true };
  },

  'collection/item-cols': (d) => {
    const colIds = db.collectionItems.filter(ci => ci.yankiId === d.yankiId).map(ci => ci.collectionId);
    return { colIds };
  },

  'save/note': (d) => {
    let note = db.saveNotes.find(n => n.userId === d.userId && n.yankiId === d.yankiId);
    if (note) {
      note.note = d.note;
    } else {
      db.saveNotes.push({ userId: d.userId, yankiId: d.yankiId, note: d.note });
    }
    return { success: true };
  },

  'saves/bulk-delete': (d) => {
    (d.yankiIds || []).forEach(id => {
      db.saves = db.saves.filter(s => !(s.userId === d.userId && s.yankiId === id));
    });
    return { success: true };
  },

  // Notifications
  'notifications/read-one': (d) => {
    const notif = db.notifications.find(n => n.id === d.notifId);
    if (notif) notif.read = true;
    return { success: true };
  },

  'notifications/clear': (d) => {
    db.notifications = db.notifications.filter(n => n.userId !== d.userId);
    return { success: true };
  },

  // Hashtag info
  'hashtag/info': (d) => {
    const tag = (d.tag || '').toLowerCase().replace('#', '');
    const count = db.yankis.filter(y => !y.deleted && y.text?.toLowerCase().includes('#' + tag)).length;
    return { tag, count };
  }
};

// ─── Request Handler ───────────────────────────────────────────
const handleRequest = (req, res) => {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = req.url.split('?')[0];

  // MIME types
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  // Serve static files
  if (req.method === 'GET') {
    // Ana sayfa
    if (url === '/' || url === '/index.html') {
      const filePath = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(fs.readFileSync(filePath));
      }
    }
    
    // Diğer static dosyalar (manifest.json, sw.js, icons)
    const staticFiles = ['/manifest.json', '/sw.js', '/icon-192.png', '/icon-512.png'];
    if (staticFiles.includes(url) || url.endsWith('.png') || url.endsWith('.svg')) {
      const filePath = path.join(__dirname, 'public', url);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(url);
        const mime = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        return res.end(fs.readFileSync(filePath));
      }
    }
  }

  // API: GET
  if (req.method === 'GET') {
    if (url === '/ping') return send(res, 200, { status: 'ok', version: '1.8.0' });
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
