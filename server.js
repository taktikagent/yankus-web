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
  drafts: [],
  collections: [],
  feedback: [],
  patchNotes: [
    { version: '3.0', date: '2026-03-21', features: [
      '🎨 Social Hub profil tasarımı — iki sütunlu kart (avatar sol, bilgiler sağ)',
      '😊 Mood/Durum sistemi — 12 farklı durum seçeneği',
      '📍 Profil zenginleştirme — konum, web sitesi, ilgi alanları, sosyal linkler',
      '🏆 Profil rozetleri — başarım bazlı otomatik rozet kazanma',
      '📊 Bento grid stat kartları — alınan beğeni, yorum ve reyankı istatistikleri',
      '⭐ Öne çıkan yankılar — en çok beğenilen 3 yankı',
      '✏️ Gelişmiş profil düzenleme — konum, web sitesi, ilgi alanları, sosyal linkler düzenleme',
      '🤖 5 bot agent — otomatik profil ve etkileşim sistemi',
      '🔗 Sosyal link entegrasyonu — Twitter, GitHub, Instagram, LinkedIn'
    ], fixes: [
      'Takipçi/takip listesi görüntüleme hatası düzeltildi',
      'Reyankı boş metin hatası düzeltildi',
      'Profil kaydetme r.success kontrolü düzeltildi',
      'Öneri bölümü undefined hatası düzeltildi',
      'Like/Save durumu isLiked/isSaved uyumsuzluğu düzeltildi',
      '40+ eksik API endpoint eklendi'
    ]},
    { version: '2.1', date: '2025-03-01', features: ['Reyankı sistemi eklendi', 'DM mesajlaşma', 'Anket sistemi'], fixes: ['Profil güncelleme hatası düzeltildi'] },
    { version: '2.0', date: '2025-02-15', features: ['Yeni arayüz tasarımı', 'Tema desteği', 'Bildirim sistemi'], fixes: ['Performans iyileştirmeleri'] }
  ]
};

// ─── Bot Profiles ──────────────────────────────────────────────
const BOT_PROFILES = [
  { username: 'ayse_dev', displayName: 'Ayşe | Yazılımcı 👩‍💻', bio: 'Full-stack developer. React & Node.js sevdalısı. Açık kaynak tutkunu.', verified: true, location: 'İstanbul', interests: ['React','Node.js','Yazılım'], mood: {emoji:'💻',label:'kodluyor'}, socialLinks: {github:'https://github.com',twitter:'https://twitter.com'} },
  { username: 'mehmet_tasarim', displayName: 'Mehmet Tasarım 🎨', bio: 'UI/UX Designer | Figma & Sketch uzmanı. Minimalist tasarım hayranı.', verified: true, location: 'Ankara', interests: ['Tasarım','UI/UX','Figma'], mood: {emoji:'🎨',label:'tasarlıyor'}, socialLinks: {instagram:'https://instagram.com'} },
  { username: 'zeynep_muzik', displayName: 'Zeynep 🎵', bio: 'Müzisyen | Şarkı sözü yazarı. Canlı müzik tutkunu.', verified: false, location: 'İzmir', interests: ['Müzik','Konser','Piyano'], mood: {emoji:'🎵',label:'müzik dinliyor'}, socialLinks: {twitter:'https://twitter.com'} },
  { username: 'ahmet_foto', displayName: 'Ahmet | Fotoğrafçı 📸', bio: 'Doğa ve sokak fotoğrafçılığı. Işığı takip ediyorum.', verified: true, location: 'Antalya', interests: ['Fotoğraf','Doğa','Seyahat'], mood: {emoji:'📷',label:'fotoğraf çekiyor'}, socialLinks: {instagram:'https://instagram.com'} },
  { username: 'elif_yazar', displayName: 'Elif Kalem ✍️', bio: 'Yazar | Hikaye anlatıcısı. Kelimelerle dünyalar kuruyorum.', verified: false, location: 'Bursa', interests: ['Edebiyat','Yazarlık','Kitap'], mood: {emoji:'📚',label:'okuyor'}, socialLinks: {} },
];

const BOT_YANKIS = [
  'Bugün harika bir gün! ☀️',
  'Yeni projeler üzerinde çalışıyorum 🚀',
  'Kod yazmak bir sanattır 💻',
  'Kahve olmadan olmaz ☕',
  'Minimalizm her şeydir ✨',
  'İlham arıyorum... 🎨',
  'Doğa yürüyüşü vakti 🌿',
  'Yeni bir şeyler öğrenmenin tam zamanı 📚',
  'Müzik ruhun gıdasıdır 🎶',
  'Hayatta küçük şeyler önemli 🌸'
];

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
      location: '',
      mood: null,
      interests: [],
      socialLinks: {},
      website: '',
      createdAt: new Date().toISOString()
    });
  }

  // Bots
  BOT_PROFILES.forEach((bot, i) => {
    if (!db.users.find(u => u.username === bot.username)) {
      const botUser = {
        id: `bot_${i + 1}`,
        username: bot.username,
        password: 'bot123',
        displayName: bot.displayName,
        bio: bot.bio,
        profileImage: null,
        bannerImage: null,
        verified: bot.verified,
        isBot: true,
        theme: null,
        location: bot.location || '',
        mood: bot.mood || null,
        interests: bot.interests || [],
        socialLinks: bot.socialLinks || {},
        website: bot.website || '',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      db.users.push(botUser);

      // Create random yankis for bots
      const numYankis = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < numYankis; j++) {
        const randomText = BOT_YANKIS[Math.floor(Math.random() * BOT_YANKIS.length)];
        db.yankis.push({
          id: `yanki_bot_${i}_${j}`,
          userId: botUser.id,
          text: randomText,
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
}

initData();

// ─── Helper Functions ──────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 15);

const getUser = id => db.users.find(u => u.id === id);
const getUserByUsername = username => db.users.find(u => u.username === username);

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
      mood: user.mood || null,
      location: user.location || '',
      website: user.website || '',
      socialLinks: user.socialLinks || {},
      interests: user.interests || [],
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
    const { userId, displayName, bio, profileImage, bannerImage, theme, mood, location, website, socialLinks, interests } = data;
    const user = getUser(userId);
    if (!user) {
      return { error: 'Kullanıcı bulunamadı' };
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (bannerImage !== undefined) user.bannerImage = bannerImage;
    if (theme !== undefined) user.theme = theme;
    if (mood !== undefined) user.mood = mood;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;
    if (interests !== undefined) user.interests = interests;

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

    if (!text && !image && !poll && !reyankiOfId) {
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
          userId: otherUserId,
          username: otherUser?.username,
          displayName: otherUser?.displayName || 'Kullanıcı',
          profileImage: otherUser?.profileImage || null,
          verified: otherUser?.verified || false,
          isBot: otherUser?.isBot || false,
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
  },

  // ═══ MESSAGE ENDPOINTS ═══
  'messages/get': (data) => {
    const { userId, otherId } = data;
    // Find or conceptually create conversation
    const conv = db.conversations.find(c =>
      c.participants.includes(userId) && c.participants.includes(otherId)
    );
    if (!conv) return { messages: [] };
    const messages = db.messages
      .filter(m => m.conversationId === conv.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { messages };
  },

  'messages/read': (data) => {
    const { userId, otherId } = data;
    const conv = db.conversations.find(c =>
      c.participants.includes(userId) && c.participants.includes(otherId)
    );
    if (conv) {
      db.messages.filter(m => m.conversationId === conv.id && m.userId !== userId)
        .forEach(m => m.read = true);
    }
    return { success: true };
  },

  'messages/send': (data) => {
    const { fromUserId, toUserId, text, image, replyTo } = data;
    if (!fromUserId || !toUserId) return { error: 'Parametreler eksik' };
    if (!text && !image) return { error: 'Mesaj boş olamaz' };

    // Find or create conversation
    let conv = db.conversations.find(c =>
      c.participants.includes(fromUserId) && c.participants.includes(toUserId)
    );
    if (!conv) {
      conv = {
        id: genId(),
        participants: [fromUserId, toUserId],
        createdAt: new Date().toISOString()
      };
      db.conversations.push(conv);
    }

    const message = {
      id: genId(),
      conversationId: conv.id,
      userId: fromUserId,
      fromUserId,
      toUserId,
      text: text || '',
      image: image || null,
      replyTo: replyTo || null,
      reactions: {},
      read: false,
      deleted: false,
      createdAt: new Date().toISOString()
    };
    db.messages.push(message);

    // Notification
    db.notifications.push({
      id: genId(),
      userId: toUserId,
      fromId: fromUserId,
      type: 'message',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { success: true, message };
  },

  'messages/delete': (data) => {
    const { userId, msgId } = data;
    const msg = db.messages.find(m => m.id === msgId && m.fromUserId === userId);
    if (!msg) return { error: 'Mesaj bulunamadı' };
    msg.deleted = true;
    msg.text = '';
    msg.image = null;
    return { success: true };
  },

  'messages/react': (data) => {
    const { userId, msgId, emoji } = data;
    const msg = db.messages.find(m => m.id === msgId);
    if (!msg) return { error: 'Mesaj bulunamadı' };
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx >= 0) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(userId);
    }
    return { success: true, reactions: msg.reactions };
  },

  // ═══ NOTIFICATION EXTRA ENDPOINTS ═══
  'notifications/read': (data) => {
    const { userId } = data;
    db.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
    return { success: true };
  },

  'notifications/read-one': (data) => {
    const { userId, notifId } = data;
    const n = db.notifications.find(x => x.id === notifId && x.userId === userId);
    if (n) n.read = true;
    return { success: true };
  },

  'notifications/clear': (data) => {
    const { userId } = data;
    db.notifications = db.notifications.filter(n => n.userId !== userId);
    return { success: true };
  },

  // ═══ BLOCKED LIST ═══
  'blocked': (data) => {
    const { userId } = data;
    const blockedIds = db.blocks.filter(b => b.userId === userId).map(b => b.blockedId);
    const users = blockedIds.map(id => {
      const u = getUser(id);
      return u ? { ...u, password: undefined } : null;
    }).filter(Boolean);
    return { users };
  },

  // ═══ CONTACT / FEEDBACK ═══
  'contact': (data) => {
    const { userId, subject, message, email } = data;
    if (!message) return { error: 'Mesaj gerekli' };
    db.feedback.push({
      id: genId(),
      userId,
      subject: subject || 'Genel',
      message,
      email: email || '',
      createdAt: new Date().toISOString()
    });
    return { success: true, message: 'Mesajınız iletildi, teşekkürler!' };
  },

  // ═══ PATCH NOTES ═══
  'patchnotes': () => {
    return { patchNotes: db.patchNotes };
  },

  // ═══ EXPLORE (all yankis) ═══
  'explore': (data) => {
    const { viewerId, limit } = data;
    const maxItems = limit || 50;
    const yankis = db.yankis
      .filter(y => !y.replyToId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, maxItems)
      .map(y => enrichYanki(y, viewerId))
      .filter(Boolean);
    return { yankis };
  },

  // ═══ HASHTAG (returns yankis for a tag) ═══
  'hashtag': (data) => {
    const { hashtag, viewerId } = data;
    const tag = hashtag.startsWith('#') ? hashtag : '#' + hashtag;
    const tagLower = tag.toLowerCase();
    const yankis = db.yankis
      .filter(y => y.text.toLowerCase().includes(tagLower))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(y => enrichYanki(y, viewerId))
      .filter(Boolean);
    return { yankis };
  },

  // ═══ ALIASES ═══
  'followers': (data) => { return routes['user/followers'](data); },
  'following': (data) => { return routes['user/following'](data); },
  'yankis/saved': (data) => {
    const { userId, sortBy, collectionId, search } = data;
    let saves = db.saves.filter(s => s.userId === userId);

    // Collection filter
    if (collectionId) {
      const col = db.collections.find(c => c.id === collectionId && c.userId === userId);
      if (col) saves = saves.filter(s => (col.items || []).includes(s.yankiId));
    }

    let yankis = saves
      .map(s => {
        const y = db.yankis.find(y => y.id === s.yankiId);
        if (!y) return null;
        const enriched = enrichYanki(y, userId);
        if (enriched) enriched.note = s.note || '';
        return enriched;
      })
      .filter(Boolean);

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      yankis = yankis.filter(y => y.text?.toLowerCase().includes(q) || y.note?.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === 'oldest') yankis.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else yankis.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { yankis };
  },

  // ═══ DRAFT ENDPOINTS ═══
  'draft/save': (data) => {
    const { userId, text, image, poll, threadItems } = data;
    const draft = {
      id: genId(),
      userId,
      text: text || '',
      image: image || null,
      poll: poll || null,
      threadItems: threadItems || null,
      createdAt: new Date().toISOString()
    };
    db.drafts.push(draft);
    return { success: true, draft };
  },

  'draft/list': (data) => {
    const { userId } = data;
    const drafts = db.drafts.filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { drafts };
  },

  'draft/delete': (data) => {
    const { userId, draftId } = data;
    const idx = db.drafts.findIndex(d => d.id === draftId && d.userId === userId);
    if (idx === -1) return { error: 'Taslak bulunamadı' };
    db.drafts.splice(idx, 1);
    return { success: true };
  },

  // ═══ SCHEDULE ENDPOINTS ═══
  'schedule/list': (data) => {
    const { userId } = data;
    const scheduled = db.scheduled.filter(s => s.userId === userId && s.status === 'pending')
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return { scheduled };
  },

  'schedule/cancel': (data) => {
    const { userId, schedId } = data;
    const idx = db.scheduled.findIndex(s => s.id === schedId && s.userId === userId);
    if (idx === -1) return { error: 'Zamanlama bulunamadı' };
    db.scheduled.splice(idx, 1);
    return { success: true };
  },

  // ═══ COLLECTION ENDPOINTS ═══
  'collections/get': (data) => {
    const { userId } = data;
    const collections = db.collections.filter(c => c.userId === userId);
    return { collections };
  },

  'collection/create': (data) => {
    const { userId, name, emoji } = data;
    if (!name) return { error: 'Koleksiyon adı gerekli' };
    const col = {
      id: genId(),
      userId,
      name,
      emoji: emoji || '📁',
      items: [],
      createdAt: new Date().toISOString()
    };
    db.collections.push(col);
    return { success: true, collection: col };
  },

  'collection/delete': (data) => {
    const { userId, collectionId } = data;
    const idx = db.collections.findIndex(c => c.id === collectionId && c.userId === userId);
    if (idx === -1) return { error: 'Koleksiyon bulunamadı' };
    db.collections.splice(idx, 1);
    return { success: true };
  },

  'collection/item-cols': (data) => {
    const { userId, yankiId } = data;
    const colIds = db.collections
      .filter(c => c.userId === userId && (c.items || []).includes(yankiId))
      .map(c => c.id);
    return { colIds };
  },

  'collection/toggle-item': (data) => {
    const { userId, collectionId, yankiId } = data;
    const col = db.collections.find(c => c.id === collectionId && c.userId === userId);
    if (!col) return { error: 'Koleksiyon bulunamadı' };
    if (!col.items) col.items = [];
    const idx = col.items.indexOf(yankiId);
    if (idx >= 0) {
      col.items.splice(idx, 1);
      return { success: true, added: false };
    } else {
      col.items.push(yankiId);
      return { success: true, added: true };
    }
  },

  'save/note': (data) => {
    const { userId, yankiId, note } = data;
    const save = db.saves.find(s => s.userId === userId && s.yankiId === yankiId);
    if (!save) return { error: 'Kayıt bulunamadı' };
    save.note = note || '';
    return { success: true };
  },

  'saves/bulk-delete': (data) => {
    const { userId, yankiIds } = data;
    if (!yankiIds || !yankiIds.length) return { error: 'Seçim yapılmadı' };
    db.saves = db.saves.filter(s => !(s.userId === userId && yankiIds.includes(s.yankiId)));
    return { success: true, removed: yankiIds.length, deletedCount: yankiIds.length };
  },

  // ═══ ADMIN ENDPOINTS ═══
  'admin/stats': () => {
    return {
      totalUsers: db.users.length,
      totalYankis: db.yankis.length,
      totalLikes: db.likes.length,
      totalComments: db.comments.length,
      totalFollows: db.follows.length,
      totalReports: db.reports.filter(r => r.status === 'pending').length,
      totalMessages: db.messages.length
    };
  },

  'admin/users': (data) => {
    const { filter, search } = data;
    let users = db.users.map(u => ({ ...u, password: undefined }));
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q));
    }
    if (filter === 'admin') users = users.filter(u => u.isAdmin);
    if (filter === 'bot') users = users.filter(u => u.isBot);
    if (filter === 'verified') users = users.filter(u => u.verified);
    if (filter === 'banned') users = users.filter(u => u.banned);
    return { users };
  },

  'admin/user/ban': (data) => {
    const { userId, ban } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    user.banned = !!ban;
    return { success: true, banned: user.banned };
  },

  'admin/user/make-admin': (data) => {
    const { userId, makeAdmin } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    user.isAdmin = !!makeAdmin;
    return { success: true, isAdmin: user.isAdmin };
  },

  'admin/user/delete': (data) => {
    const { userId } = data;
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) return { error: 'Kullanıcı bulunamadı' };
    db.users.splice(idx, 1);
    // Clean up user data
    db.yankis = db.yankis.filter(y => y.userId !== userId);
    db.likes = db.likes.filter(l => l.userId !== userId);
    db.follows = db.follows.filter(f => f.followerId !== userId && f.followingId !== userId);
    db.notifications = db.notifications.filter(n => n.userId !== userId);
    db.saves = db.saves.filter(s => s.userId !== userId);
    return { success: true };
  },

  'admin/user/detail': (data) => {
    const { userId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const yankisCount = db.yankis.filter(y => y.userId === userId).length;
    const followersCount = db.follows.filter(f => f.followingId === userId).length;
    const followingCount = db.follows.filter(f => f.followerId === userId).length;
    const likesReceived = db.yankis.filter(y => y.userId === userId)
      .reduce((sum, y) => sum + db.likes.filter(l => l.yankiId === y.id).length, 0);
    return {
      ...user,
      password: undefined,
      yankisCount,
      followersCount,
      followingCount,
      likesReceived
    };
  },

  'admin/yanki/delete': (data) => {
    const { yankiId } = data;
    const idx = db.yankis.findIndex(y => y.id === yankiId);
    if (idx === -1) return { error: 'Yankı bulunamadı' };
    db.yankis.splice(idx, 1);
    db.likes = db.likes.filter(l => l.yankiId !== yankiId);
    db.comments = db.comments.filter(c => c.yankiId !== yankiId);
    db.saves = db.saves.filter(s => s.yankiId !== yankiId);
    return { success: true };
  },

  'admin/yankis/recent': (data) => {
    const { limit, search } = data;
    let yankis = db.yankis
      .filter(y => !y.replyToId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (search) {
      const q = search.toLowerCase();
      yankis = yankis.filter(y => y.text.toLowerCase().includes(q));
    }
    yankis = yankis.slice(0, limit || 40).map(y => enrichYanki(y, null)).filter(Boolean);
    return { yankis };
  },

  'admin/reports': () => {
    const reports = db.reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(r => {
        const reporter = getUser(r.reporterId);
        const yanki = db.yankis.find(y => y.id === r.yankiId);
        const author = yanki ? getUser(yanki.userId) : null;
        return {
          ...r,
          reporterName: reporter?.displayName || 'Bilinmeyen',
          reporterUsername: reporter?.username || '',
          yankiText: yanki?.text || '[Silinmiş]',
          authorName: author?.displayName || 'Bilinmeyen',
          authorUsername: author?.username || ''
        };
      });
    return { reports };
  },

  'admin/yankis/bulk-delete': (data) => {
    const { yankiIds } = data;
    if (!yankiIds || !yankiIds.length) return { error: 'Seçim yapılmadı' };
    yankiIds.forEach(id => {
      db.yankis = db.yankis.filter(y => y.id !== id);
      db.likes = db.likes.filter(l => l.yankiId !== id);
      db.comments = db.comments.filter(c => c.yankiId !== id);
      db.saves = db.saves.filter(s => s.yankiId !== id);
    });
    return { success: true, deleted: yankiIds.length, deletedCount: yankiIds.length };
  },

  'admin/analytics': () => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const dailyYankis = db.yankis.filter(y => new Date(y.createdAt).getTime() > dayAgo).length;
    const weeklyYankis = db.yankis.filter(y => new Date(y.createdAt).getTime() > weekAgo).length;
    const dailyUsers = new Set(db.yankis.filter(y => new Date(y.createdAt).getTime() > dayAgo).map(y => y.userId)).size;
    const dailyLikes = db.likes.filter(l => new Date(l.createdAt).getTime() > dayAgo).length;

    // Activity by hour
    const hourly = Array(24).fill(0);
    db.yankis.filter(y => new Date(y.createdAt).getTime() > dayAgo).forEach(y => {
      const h = new Date(y.createdAt).getHours();
      hourly[h]++;
    });

    return {
      dailyYankis, weeklyYankis, dailyUsers, dailyLikes,
      hourlyActivity: hourly,
      totalUsers: db.users.length,
      totalYankis: db.yankis.length
    };
  },

  'admin/bots': () => {
    const bots = db.users.filter(u => u.isBot).map(u => ({
      ...u,
      password: undefined,
      yankisCount: db.yankis.filter(y => y.userId === u.id).length
    }));
    return { bots, botActive: true };
  },

  'admin/feedback': () => {
    const feedback = db.feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(f => {
      const u = getUser(f.userId);
      return { ...f, username: u?.username || 'Bilinmeyen', displayName: u?.displayName || 'Bilinmeyen' };
    });
    return { feedback };
  },

  'admin/bot/toggle': () => {
    // Toggle bot activity (in-memory flag)
    return { success: true, active: true };
  },

  'admin/bot/trigger': (data) => {
    const { action, botId } = data;
    if (action === 'post') {
      const bots = botId ? db.users.filter(u => u.id === botId && u.isBot) : db.users.filter(u => u.isBot);
      bots.forEach(bot => {
        const text = BOT_YANKIS[Math.floor(Math.random() * BOT_YANKIS.length)];
        db.yankis.push({
          id: genId(),
          userId: bot.id,
          text,
          image: null,
          poll: null,
          replyToId: null,
          reyankiOfId: null,
          pinned: false,
          createdAt: new Date().toISOString()
        });
      });
      return { success: true, message: `${bots.length} bot yankı paylaştı` };
    }
    return { success: true };
  },

  'profile/stats': ({ userId }) => {
    const userYankis = db.yankis.filter(y => y.userId === userId);
    let totalLikesReceived = 0, totalCommentsReceived = 0, totalReyankis = 0;
    userYankis.forEach(y => {
      totalLikesReceived += (y.likes || []).length;
      totalCommentsReceived += db.yankis.filter(c => c.replyToId === y.id).length;
      totalReyankis += db.yankis.filter(r => r.reyankiOfId === y.id).length;
    });
    return { totalLikesReceived, totalCommentsReceived, totalReyankis };
  },

  'profile/badges': ({ userId }) => {
    const u = db.users.find(x => x.id === userId);
    if (!u) return { badges: [] };
    const yankiCount = db.yankis.filter(y => y.userId === userId).length;
    const followerCount = db.follows.filter(f => f.followingId === userId).length;
    const totalLikes = db.yankis.filter(y => y.userId === userId).reduce((s, y) => s + (y.likes || []).length, 0);
    const badges = [];
    if (yankiCount >= 1) badges.push({ id: 'first_yanki', name: 'İlk Yankı', icon: '🐣' });
    if (yankiCount >= 10) badges.push({ id: 'yanki_10', name: '10 Yankı', icon: '🔥' });
    if (yankiCount >= 50) badges.push({ id: 'yanki_50', name: '50 Yankı', icon: '⚡' });
    if (followerCount >= 5) badges.push({ id: 'followers_5', name: '5 Takipçi', icon: '⭐' });
    if (followerCount >= 10) badges.push({ id: 'followers_10', name: '10 Takipçi', icon: '🌟' });
    if (totalLikes >= 10) badges.push({ id: 'likes_10', name: '10 Beğeni', icon: '💖' });
    if (totalLikes >= 50) badges.push({ id: 'likes_50', name: '50 Beğeni', icon: '💎' });
    if (u.isBot) badges.push({ id: 'bot', name: 'Bot', icon: '🤖' });
    return { badges };
  },

  'profile/featured': ({ userId }) => {
    const userYankis = db.yankis.filter(y => y.userId === userId && !y.replyToId);
    const sorted = userYankis.sort((a, b) => (b.likes || []).length - (a.likes || []).length);
    const top3 = sorted.slice(0, 3).filter(y => (y.likes || []).length > 0);
    return {
      featured: top3.map(y => ({
        id: y.id,
        text: y.text,
        likesCount: (y.likes || []).length,
        commentsCount: db.yankis.filter(c => c.replyToId === y.id).length
      }))
    };
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
