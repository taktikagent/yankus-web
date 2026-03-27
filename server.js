// ═══════════════════════════════════════════════════════════════
// YANKUŞ v3.3 — SERVER (SQLite)
// ═══════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');

// ─── E-posta Ayarları ────────────────────────────────────────
const SMTP_EMAIL = process.env.SMTP_EMAIL || 'kurumsalibrahim@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'fxyf skum vlol rudd';
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SMTP_EMAIL, pass: SMTP_PASS }
});
const sendMail = async (to, subject, html) => {
  try {
    await mailTransporter.sendMail({ from: `"Yankuş" <${SMTP_EMAIL}>`, to, subject, html });
    return true;
  } catch(e) { console.error('E-posta gönderilemedi:', e.message); return false; }
};

// ─── SQLite Database Setup ─────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'yankus.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ─── Create Tables ─────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL,
    bio TEXT DEFAULT '',
    profileImage TEXT,
    bannerImage TEXT,
    verified INTEGER DEFAULT 0,
    isAdmin INTEGER DEFAULT 0,
    isBot INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    theme TEXT,
    mood TEXT,
    moodEmoji TEXT,
    moodUpdatedAt TEXT,
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    socialLinks TEXT DEFAULT '{}',
    interests TEXT DEFAULT '[]',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS yankis (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    text TEXT DEFAULT '',
    image TEXT,
    images TEXT DEFAULT '[]',
    poll TEXT,
    replyToId TEXT,
    reyankiOfId TEXT,
    quoteOfId TEXT,
    pinned INTEGER DEFAULT 0,
    editedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    yankiId TEXT NOT NULL,
    userId TEXT NOT NULL,
    emoji TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (yankiId) REFERENCES yankis(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_reactions_yankiId ON reactions(yankiId);
  CREATE INDEX IF NOT EXISTS idx_reactions_userId ON reactions(userId);

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    yankiId TEXT NOT NULL,
    userId TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (yankiId) REFERENCES yankis(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    yankiId TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (yankiId) REFERENCES yankis(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    followerId TEXT NOT NULL,
    followingId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (followerId) REFERENCES users(id),
    FOREIGN KEY (followingId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    fromId TEXT NOT NULL,
    type TEXT NOT NULL,
    yankiId TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saves (
    id TEXT PRIMARY KEY,
    yankiId TEXT NOT NULL,
    userId TEXT NOT NULL,
    note TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (yankiId) REFERENCES yankis(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    blockedId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pollVotes (
    id TEXT PRIMARY KEY,
    yankiId TEXT NOT NULL,
    userId TEXT NOT NULL,
    optionIndex INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    yankiId TEXT,
    reporterId TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scheduled (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    text TEXT DEFAULT '',
    image TEXT,
    poll TEXT,
    scheduledAt TEXT,
    threadItems TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    userId TEXT NOT NULL,
    text TEXT DEFAULT '',
    image TEXT,
    read INTEGER DEFAULT 0,
    reactions TEXT DEFAULT '[]',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participants TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collectionItems (
    id TEXT PRIMARY KEY,
    collectionId TEXT NOT NULL,
    saveId TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    text TEXT DEFAULT '',
    image TEXT,
    poll TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    userId TEXT,
    subject TEXT,
    message TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS patchNotes (
    id TEXT PRIMARY KEY,
    version TEXT,
    title TEXT,
    content TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_yankis_userId ON yankis(userId);
  CREATE INDEX IF NOT EXISTS idx_yankis_replyToId ON yankis(replyToId);
  CREATE INDEX IF NOT EXISTS idx_yankis_reyankiOfId ON yankis(reyankiOfId);
  CREATE INDEX IF NOT EXISTS idx_yankis_createdAt ON yankis(createdAt);
  CREATE INDEX IF NOT EXISTS idx_likes_yankiId ON likes(yankiId);
  CREATE INDEX IF NOT EXISTS idx_likes_userId ON likes(userId);
  CREATE INDEX IF NOT EXISTS idx_comments_yankiId ON comments(yankiId);
  CREATE INDEX IF NOT EXISTS idx_follows_followerId ON follows(followerId);
  CREATE INDEX IF NOT EXISTS idx_follows_followingId ON follows(followingId);
  CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
  CREATE INDEX IF NOT EXISTS idx_saves_userId ON saves(userId);
  CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
  CREATE INDEX IF NOT EXISTS idx_blocks_userId ON blocks(userId);
`);

// Migration: featured sütunu ekle
try { sqlite.prepare('ALTER TABLE yankis ADD COLUMN featured INTEGER DEFAULT 0').run(); } catch(e) { /* zaten var */ }
try { sqlite.prepare('ALTER TABLE users ADD COLUMN lastSeen TEXT').run(); } catch(e) { /* zaten var */ }
try { sqlite.prepare('ALTER TABLE users ADD COLUMN email TEXT').run(); } catch(e) { /* zaten var */ }
try { sqlite.prepare('ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0').run(); } catch(e) { /* zaten var */ }

// Doğrulama & sıfırlama kodları tablosu
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    userId TEXT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  )
`);

// ─── Prepared Statements ───────────────────────────────────────
const stmts = {
  // Users
  getUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByUsername: sqlite.prepare('SELECT * FROM users WHERE username = ?'),
  insertUser: sqlite.prepare(`INSERT INTO users (id, username, password, displayName, bio, profileImage, bannerImage, verified, isAdmin, isBot, banned, theme, mood, moodEmoji, moodUpdatedAt, location, website, socialLinks, interests, email, emailVerified, createdAt) VALUES (@id, @username, @password, @displayName, @bio, @profileImage, @bannerImage, @verified, @isAdmin, @isBot, @banned, @theme, @mood, @moodEmoji, @moodUpdatedAt, @location, @website, @socialLinks, @interests, @email, @emailVerified, @createdAt)`),
  getAllUsers: sqlite.prepare('SELECT * FROM users'),
  getBotUsers: sqlite.prepare('SELECT * FROM users WHERE isBot = 1'),
  getUserCount: sqlite.prepare('SELECT COUNT(*) as count FROM users'),

  // Yankis
  getYankiById: sqlite.prepare('SELECT * FROM yankis WHERE id = ?'),
  insertYanki: sqlite.prepare(`INSERT INTO yankis (id, userId, text, image, images, poll, replyToId, reyankiOfId, quoteOfId, pinned, editedAt, createdAt) VALUES (@id, @userId, @text, @image, @images, @poll, @replyToId, @reyankiOfId, @quoteOfId, @pinned, @editedAt, @createdAt)`),
  deleteYanki: sqlite.prepare('DELETE FROM yankis WHERE id = ?'),
  getYankisByUser: sqlite.prepare('SELECT * FROM yankis WHERE userId = ? AND replyToId IS NULL ORDER BY createdAt DESC'),
  getReplies: sqlite.prepare('SELECT * FROM yankis WHERE replyToId = ? ORDER BY createdAt ASC'),
  getReyankis: sqlite.prepare('SELECT * FROM yankis WHERE reyankiOfId = ?'),
  getUserReyanki: sqlite.prepare('SELECT * FROM yankis WHERE reyankiOfId = ? AND userId = ?'),
  getAllYankisNoReply: sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL ORDER BY createdAt DESC LIMIT ?'),

  // Likes
  getLikesByYanki: sqlite.prepare('SELECT * FROM likes WHERE yankiId = ?'),
  getLikeCount: sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE yankiId = ?'),
  getUserLike: sqlite.prepare('SELECT * FROM likes WHERE yankiId = ? AND userId = ?'),
  insertLike: sqlite.prepare('INSERT INTO likes (id, yankiId, userId, createdAt) VALUES (@id, @yankiId, @userId, @createdAt)'),
  deleteLike: sqlite.prepare('DELETE FROM likes WHERE id = ?'),
  deleteLikesByYanki: sqlite.prepare('DELETE FROM likes WHERE yankiId = ?'),
  deleteLikesByUser: sqlite.prepare('DELETE FROM likes WHERE userId = ?'),

  // Comments
  getCommentsByYanki: sqlite.prepare('SELECT * FROM comments WHERE yankiId = ?'),
  getCommentCount: sqlite.prepare('SELECT COUNT(*) as count FROM comments WHERE yankiId = ?'),
  insertComment: sqlite.prepare('INSERT INTO comments (id, yankiId, userId, text, createdAt) VALUES (@id, @yankiId, @userId, @text, @createdAt)'),
  deleteCommentsByYanki: sqlite.prepare('DELETE FROM comments WHERE yankiId = ?'),
  deleteCommentsByUser: sqlite.prepare('DELETE FROM comments WHERE userId = ?'),

  // Follows
  getFollowers: sqlite.prepare('SELECT followerId FROM follows WHERE followingId = ?'),
  getFollowing: sqlite.prepare('SELECT followingId FROM follows WHERE followerId = ?'),
  getFollowerCount: sqlite.prepare('SELECT COUNT(*) as count FROM follows WHERE followingId = ?'),
  getFollowingCount: sqlite.prepare('SELECT COUNT(*) as count FROM follows WHERE followerId = ?'),
  getFollow: sqlite.prepare('SELECT * FROM follows WHERE followerId = ? AND followingId = ?'),
  insertFollow: sqlite.prepare('INSERT INTO follows (id, followerId, followingId, createdAt) VALUES (@id, @followerId, @followingId, @createdAt)'),
  deleteFollow: sqlite.prepare('DELETE FROM follows WHERE id = ?'),
  deleteFollowsByUser: sqlite.prepare('DELETE FROM follows WHERE followerId = ? OR followingId = ?'),

  // Notifications
  getNotifications: sqlite.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50'),
  getUnreadCount: sqlite.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0'),
  insertNotification: sqlite.prepare('INSERT INTO notifications (id, userId, fromId, type, yankiId, read, createdAt) VALUES (@id, @userId, @fromId, @type, @yankiId, @read, @createdAt)'),
  markNotificationsRead: sqlite.prepare('UPDATE notifications SET read = 1 WHERE userId = ?'),
  markNotificationRead: sqlite.prepare('UPDATE notifications SET read = 1 WHERE id = ?'),
  deleteNotificationsByUser: sqlite.prepare('DELETE FROM notifications WHERE userId = ? OR fromId = ?'),
  clearNotifications: sqlite.prepare('DELETE FROM notifications WHERE userId = ?'),

  // Saves
  getSavesByUser: sqlite.prepare('SELECT * FROM saves WHERE userId = ?'),
  getSave: sqlite.prepare('SELECT * FROM saves WHERE yankiId = ? AND userId = ?'),
  insertSave: sqlite.prepare('INSERT INTO saves (id, yankiId, userId, note, createdAt) VALUES (@id, @yankiId, @userId, @note, @createdAt)'),
  deleteSave: sqlite.prepare('DELETE FROM saves WHERE id = ?'),
  deleteSavesByYanki: sqlite.prepare('DELETE FROM saves WHERE yankiId = ?'),
  deleteSavesByUser: sqlite.prepare('DELETE FROM saves WHERE userId = ?'),

  // Blocks
  getBlocksByUser: sqlite.prepare('SELECT * FROM blocks WHERE userId = ?'),
  getBlock: sqlite.prepare('SELECT * FROM blocks WHERE userId = ? AND blockedId = ?'),
  insertBlock: sqlite.prepare('INSERT INTO blocks (id, userId, blockedId, createdAt) VALUES (@id, @userId, @blockedId, @createdAt)'),
  deleteBlock: sqlite.prepare('DELETE FROM blocks WHERE id = ?'),
  deleteFollowPair: sqlite.prepare('DELETE FROM follows WHERE (followerId = ? AND followingId = ?) OR (followerId = ? AND followingId = ?)'),

  // Polls
  getPollVotes: sqlite.prepare('SELECT * FROM pollVotes WHERE yankiId = ?'),
  getUserPollVote: sqlite.prepare('SELECT * FROM pollVotes WHERE yankiId = ? AND userId = ?'),
  insertPollVote: sqlite.prepare('INSERT INTO pollVotes (id, yankiId, userId, optionIndex, createdAt) VALUES (@id, @yankiId, @userId, @optionIndex, @createdAt)'),
  getPollVoteCount: sqlite.prepare('SELECT optionIndex, COUNT(*) as count FROM pollVotes WHERE yankiId = ? GROUP BY optionIndex'),

  // Reactions
  getReactionsByYanki: sqlite.prepare('SELECT * FROM reactions WHERE yankiId = ?'),
  getReactionCounts: sqlite.prepare('SELECT emoji, COUNT(*) as count FROM reactions WHERE yankiId = ? GROUP BY emoji'),
  getUserReaction: sqlite.prepare('SELECT * FROM reactions WHERE yankiId = ? AND userId = ? AND emoji = ?'),
  insertReaction: sqlite.prepare('INSERT INTO reactions (id, yankiId, userId, emoji, createdAt) VALUES (@id, @yankiId, @userId, @emoji, @createdAt)'),
  deleteReaction: sqlite.prepare('DELETE FROM reactions WHERE id = ?'),
  deleteReactionsByYanki: sqlite.prepare('DELETE FROM reactions WHERE yankiId = ?'),
  getLikersByYanki: sqlite.prepare('SELECT u.id, u.username, u.displayName, u.profileImage, u.verified FROM likes l JOIN users u ON l.userId = u.id WHERE l.yankiId = ? ORDER BY l.createdAt DESC LIMIT 50'),

  // Reports
  insertReport: sqlite.prepare('INSERT INTO reports (id, yankiId, reporterId, reason, status, createdAt) VALUES (@id, @yankiId, @reporterId, @reason, @status, @createdAt)'),
  getAllReports: sqlite.prepare('SELECT * FROM reports ORDER BY createdAt DESC'),

  // Messages
  getMessagesByConv: sqlite.prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC'),
  insertMessage: sqlite.prepare('INSERT INTO messages (id, conversationId, userId, text, image, read, reactions, createdAt) VALUES (@id, @conversationId, @userId, @text, @image, @read, @reactions, @createdAt)'),
  deleteMessage: sqlite.prepare('DELETE FROM messages WHERE id = ? AND userId = ?'),
  markMessagesRead: sqlite.prepare('UPDATE messages SET read = 1 WHERE conversationId = ? AND userId = ? AND read = 0'),

  // Conversations
  getAllConversations: sqlite.prepare('SELECT * FROM conversations'),
  insertConversation: sqlite.prepare('INSERT INTO conversations (id, participants, createdAt) VALUES (@id, @participants, @createdAt)'),

  // Collections
  getCollectionsByUser: sqlite.prepare('SELECT * FROM collections WHERE userId = ?'),
  insertCollection: sqlite.prepare('INSERT INTO collections (id, userId, name, emoji, createdAt) VALUES (@id, @userId, @name, @emoji, @createdAt)'),
  deleteCollection: sqlite.prepare('DELETE FROM collections WHERE id = ? AND userId = ?'),
  getCollectionItemCount: sqlite.prepare('SELECT COUNT(*) as count FROM collectionItems WHERE collectionId = ?'),
  getCollectionItems: sqlite.prepare('SELECT * FROM collectionItems WHERE collectionId = ?'),
  insertCollectionItem: sqlite.prepare('INSERT INTO collectionItems (id, collectionId, saveId, createdAt) VALUES (@id, @collectionId, @saveId, @createdAt)'),
  deleteCollectionItem: sqlite.prepare('DELETE FROM collectionItems WHERE collectionId = ? AND saveId = ?'),
  getCollectionItem: sqlite.prepare('SELECT * FROM collectionItems WHERE collectionId = ? AND saveId = ?'),
  deleteCollectionItemsByCol: sqlite.prepare('DELETE FROM collectionItems WHERE collectionId = ?'),

  // Drafts
  getDraftsByUser: sqlite.prepare('SELECT * FROM drafts WHERE userId = ? ORDER BY createdAt DESC'),
  insertDraft: sqlite.prepare('INSERT INTO drafts (id, userId, text, image, poll, createdAt) VALUES (@id, @userId, @text, @image, @poll, @createdAt)'),
  deleteDraft: sqlite.prepare('DELETE FROM drafts WHERE id = ? AND userId = ?'),

  // Scheduled
  getScheduledByUser: sqlite.prepare("SELECT * FROM scheduled WHERE userId = ? AND status = 'pending' ORDER BY scheduledAt ASC"),
  insertScheduled: sqlite.prepare('INSERT INTO scheduled (id, userId, text, image, poll, scheduledAt, threadItems, status, createdAt) VALUES (@id, @userId, @text, @image, @poll, @scheduledAt, @threadItems, @status, @createdAt)'),
  deleteScheduled: sqlite.prepare('DELETE FROM scheduled WHERE id = ? AND userId = ?'),

  // Feedback
  insertFeedback: sqlite.prepare('INSERT INTO feedback (id, userId, subject, message, createdAt) VALUES (@id, @userId, @subject, @message, @createdAt)'),
  getAllFeedback: sqlite.prepare('SELECT * FROM feedback ORDER BY createdAt DESC'),

  // PatchNotes
  getAllPatchNotes: sqlite.prepare('SELECT * FROM patchNotes ORDER BY createdAt DESC'),
};

// ─── Helper ────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 15);
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(probability) { return Math.random() < probability; }

// Parse JSON fields from SQLite rows
function parseUser(row) {
  if (!row) return null;
  return {
    ...row,
    verified: !!row.verified,
    isAdmin: !!row.isAdmin,
    isBot: !!row.isBot,
    banned: !!row.banned,
    socialLinks: JSON.parse(row.socialLinks || '{}'),
    interests: JSON.parse(row.interests || '[]')
  };
}

function parseYanki(row) {
  if (!row) return null;
  return {
    ...row,
    pinned: !!row.pinned,
    featured: !!row.featured,
    poll: row.poll ? JSON.parse(row.poll) : null
  };
}

function parseMessage(row) {
  if (!row) return null;
  return {
    ...row,
    read: !!row.read,
    reactions: JSON.parse(row.reactions || '[]')
  };
}

function parseConversation(row) {
  if (!row) return null;
  return {
    ...row,
    participants: JSON.parse(row.participants || '[]')
  };
}

// ─── Core Functions ────────────────────────────────────────────
const getUser = (id) => parseUser(stmts.getUserById.get(id));
const getUserByUsername = (username) => parseUser(stmts.getUserByUsername.get(username));

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
function botAgentTick() {
  const botUsers = stmts.getBotUsers.all().map(parseUser);
  if (botUsers.length === 0) return;

  const agent = BOT_AGENTS[Math.floor(Math.random() * BOT_AGENTS.length)];
  const botUser = botUsers.find(u => u.username === agent.username);
  if (!botUser) return;

  const actions = [];

  // 1) Yeni yankı paylaş (%35 şans)
  if (chance(0.35)) {
    const text = pickRandom(agent.yankiBank) + (chance(0.3) ? `\n\n#${pickRandom(agent.interests)}` : '');
    stmts.insertYanki.run({
      id: genId(), userId: botUser.id, text, image: null, images: '[]', poll: null,
      replyToId: null, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null, createdAt: new Date().toISOString()
    });
    actions.push('yanki');
  }

  // 2) Rastgele yankılara beğeni at
  const allYankis = sqlite.prepare('SELECT * FROM yankis WHERE userId != ? AND replyToId IS NULL').all(botUser.id);
  const unlikedYankis = allYankis.filter(y => !stmts.getUserLike.get(y.id, botUser.id));
  if (unlikedYankis.length > 0 && chance(agent.personality.likeChance)) {
    const target = pickRandom(unlikedYankis);
    stmts.insertLike.run({ id: genId(), yankiId: target.id, userId: botUser.id, createdAt: new Date().toISOString() });
    if (target.userId !== botUser.id) {
      stmts.insertNotification.run({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'like', yankiId: target.id, read: 0, createdAt: new Date().toISOString() });
    }
    actions.push('like');
  }

  // 3) Yorum yap
  if (allYankis.length > 0 && chance(agent.personality.replyChance * 0.4)) {
    const target = pickRandom(allYankis);
    const replyText = pickRandom(agent.replyBank);
    const replyId = genId();
    stmts.insertYanki.run({
      id: replyId, userId: botUser.id, text: replyText, image: null, images: '[]', poll: null,
      replyToId: target.id, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null, createdAt: new Date().toISOString()
    });
    stmts.insertComment.run({ id: replyId, yankiId: target.id, userId: botUser.id, text: replyText, createdAt: new Date().toISOString() });
    if (target.userId !== botUser.id) {
      stmts.insertNotification.run({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'comment', yankiId: replyId, read: 0, createdAt: new Date().toISOString() });
    }
    actions.push('comment');
  }

  // 4) Reyankı yap
  if (allYankis.length > 0 && chance(agent.personality.reyankiChance * 0.3)) {
    const target = pickRandom(allYankis);
    if (!stmts.getUserReyanki.get(target.id, botUser.id)) {
      const reyankiId = genId();
      stmts.insertYanki.run({
        id: reyankiId, userId: botUser.id, text: '', image: null, images: '[]', poll: null,
        replyToId: null, reyankiOfId: target.id, quoteOfId: null, pinned: 0, editedAt: null, createdAt: new Date().toISOString()
      });
      if (target.userId !== botUser.id) {
        stmts.insertNotification.run({ id: genId(), userId: target.userId, fromId: botUser.id, type: 'reyanki', yankiId: target.id, read: 0, createdAt: new Date().toISOString() });
      }
      actions.push('reyanki');
    }
  }

  // 5) Takip et
  const allUsers = stmts.getAllUsers.all().map(parseUser);
  const notFollowing = allUsers.filter(u => u.id !== botUser.id && !stmts.getFollow.get(botUser.id, u.id));
  if (notFollowing.length > 0 && chance(0.15)) {
    const target = pickRandom(notFollowing);
    stmts.insertFollow.run({ id: genId(), followerId: botUser.id, followingId: target.id, createdAt: new Date().toISOString() });
    stmts.insertNotification.run({ id: genId(), userId: target.id, fromId: botUser.id, type: 'follow', read: 0, yankiId: null, createdAt: new Date().toISOString() });
    actions.push('follow');
  }

  if (actions.length > 0) {
    console.log(`🤖 [${agent.displayName}] ${actions.join(', ')}`);
  }
}

let botInterval = null;
function startBotAgents() {
  if (botInterval) return;
  botSimulationRunning = true;
  console.log('🤖 Bot Agent sistemi başlatıldı');
  botAgentTick();
  function scheduleNext() {
    const delay = 15000 + Math.random() * 30000;
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
  const existingAdmin = stmts.getUserByUsername.get('admin');
  if (!existingAdmin) {
    stmts.insertUser.run({
      id: 'admin_001', username: 'admin', password: 'admin123',
      displayName: 'Admin', bio: '🔧 Yankuş Yöneticisi',
      profileImage: null, bannerImage: null,
      verified: 1, isAdmin: 1, isBot: 0, banned: 0,
      theme: null, mood: null, moodEmoji: null, moodUpdatedAt: null,
      location: '', website: '', socialLinks: '{}', interests: '[]',
      email: null, emailVerified: 0,
      createdAt: new Date().toISOString()
    });
  }

  const locations = { ayse_dev: 'İstanbul', mehmet_tasarim: 'Ankara', zeynep_muzik: 'İzmir', ahmet_foto: 'Kapadokya', elif_yazar: 'Bursa' };

  BOT_AGENTS.forEach((agent, i) => {
    const existing = stmts.getUserByUsername.get(agent.username);
    if (!existing) {
      const botId = `bot_${i + 1}`;
      stmts.insertUser.run({
        id: botId, username: agent.username, password: 'bot123',
        displayName: agent.displayName, bio: agent.bio,
        profileImage: null, bannerImage: null,
        verified: agent.verified ? 1 : 0, isAdmin: 0, isBot: 1, banned: 0,
        theme: null, mood: agent.moods?.[0] || null, moodEmoji: '💭',
        moodUpdatedAt: new Date().toISOString(),
        location: locations[agent.username] || '', website: '',
        socialLinks: '{}', interests: JSON.stringify(agent.interests || []),
        email: null, emailVerified: 0,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Başlangıç yankıları
      const numYankis = 3 + Math.floor(Math.random() * 4);
      const usedTexts = new Set();
      for (let j = 0; j < numYankis; j++) {
        let text;
        do { text = pickRandom(agent.yankiBank); } while (usedTexts.has(text) && usedTexts.size < agent.yankiBank.length);
        usedTexts.add(text);
        if (chance(0.4)) text += `\n\n#${pickRandom(agent.interests)}`;
        stmts.insertYanki.run({
          id: `yanki_bot_${i}_${j}`, userId: botId, text,
          image: null, images: '[]', poll: null, replyToId: null, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
  });

  // Botlar arası başlangıç etkileşimleri
  const botUsers = stmts.getBotUsers.all().map(parseUser);
  botUsers.forEach(bot => {
    const others = botUsers.filter(u => u.id !== bot.id);
    const followCount = 2 + Math.floor(Math.random() * Math.min(3, others.length));
    others.sort(() => Math.random() - 0.5).slice(0, followCount).forEach(target => {
      if (!stmts.getFollow.get(bot.id, target.id)) {
        stmts.insertFollow.run({ id: genId(), followerId: bot.id, followingId: target.id, createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() });
      }
    });
    // Admin'i takip etsinler
    if (!stmts.getFollow.get(bot.id, 'admin_001')) {
      stmts.insertFollow.run({ id: genId(), followerId: bot.id, followingId: 'admin_001', createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() });
    }
  });

  // Başlangıç beğenileri
  const allBotYankis = sqlite.prepare('SELECT * FROM yankis WHERE userId IN (SELECT id FROM users WHERE isBot = 1) AND replyToId IS NULL').all();
  botUsers.forEach(bot => {
    const othersYankis = allBotYankis.filter(y => y.userId !== bot.id);
    const likeCount = 2 + Math.floor(Math.random() * 5);
    othersYankis.sort(() => Math.random() - 0.5).slice(0, likeCount).forEach(y => {
      if (!stmts.getUserLike.get(y.id, bot.id)) {
        stmts.insertLike.run({ id: genId(), yankiId: y.id, userId: bot.id, createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() });
      }
    });
  });

  // Başlangıç yorumları
  botUsers.forEach(bot => {
    const agentData = BOT_AGENTS.find(a => a.username === bot.username);
    if (!agentData) return;
    const othersYankis = allBotYankis.filter(y => y.userId !== bot.id);
    const commentCount = 1 + Math.floor(Math.random() * 2);
    othersYankis.sort(() => Math.random() - 0.5).slice(0, commentCount).forEach(y => {
      const text = pickRandom(agentData.replyBank);
      const commentId = genId();
      stmts.insertYanki.run({
        id: commentId, userId: bot.id, text, image: null, images: '[]', poll: null,
        replyToId: y.id, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null,
        createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
      });
      stmts.insertComment.run({ id: commentId, yankiId: y.id, userId: bot.id, text, createdAt: new Date().toISOString() });
    });
  });

  // Yama notları
  const patchCount = sqlite.prepare('SELECT COUNT(*) as count FROM patchNotes').get().count;
  // v3.2 yoksa yeni notları ekle
  const has35 = sqlite.prepare("SELECT COUNT(*) as c FROM patchNotes WHERE version = '3.5'").get().c;
  if (!has35 && patchCount > 0) {
    const insertPatch35 = sqlite.prepare('INSERT INTO patchNotes (id, version, title, content, createdAt) VALUES (@id, @version, @title, @content, @createdAt)');
    insertPatch35.run({
      id: genId(), version: '3.5', title: 'Keşfet Yenileme + Öne Çıkanlar + Sabitleme Kaldırma',
      content: JSON.stringify({ date: '27 Mart 2026', features: ['Keşfet sayfası tamamen yenilendi: hero header, tab sistemi (Senin İçin / Trend / Kişiler / Hashtagler)','Gelişmiş arama: debounced instant search, birleşik sonuçlar (kişiler/hashtagler/yankılar)','Hashtag algoritması güncellendi: kategori tespiti, etkileşim skoru, hız bonusu','Gündem sidebar kısaltıldı: ilk 3 trend + "Daha fazla göster" butonu','Drag-to-scroll: keşfet önerileri, hashtagler ve profil öne çıkanlarda sürükleyerek kaydırma','Öne çıkanlar devir daim: CSS marquee animasyonu ile sürekli kayma','Öne çıkarma limiti 5\'ten 3\'e düşürüldü','Geri butonu SVG ok ikonu ile yenilendi'], fixes: ['Yankı sabitleme özelliği tamamen kaldırıldı','Öne çıkarma dropdown metni düzeltildi (Öne Çıkar → Öne Çıkarmayı Kaldır)','Öne çıkarma anında güncelleniyor (profil + feed)','enrichYanki\'ye featured alanı eklendi','Geri butonu ortalama düzeltmesi (display:flex)','Kullanıcı silmede DM ve taslak temizliği eklendi'] }),
      createdAt: new Date().toISOString()
    });
  }
  const has34 = sqlite.prepare("SELECT COUNT(*) as c FROM patchNotes WHERE version = '3.4'").get().c;
  if (!has34 && patchCount > 0) {
    const insertPatch34 = sqlite.prepare('INSERT INTO patchNotes (id, version, title, content, createdAt) VALUES (@id, @version, @title, @content, @createdAt)');
    insertPatch34.run({
      id: genId(), version: '3.4', title: 'E-posta Doğrulama + Şifre Sıfırlama',
      content: JSON.stringify({ date: '27 Mart 2026', features: ['Kayıt sırasında e-posta doğrulama sistemi (6 haneli kod)','Şifre sıfırlama: e-posta ile kod gönderimi + yeni şifre belirleme','Doğrulama kodu otomatik odaklama ve yapıştırma desteği','Spam koruması: 1 dakika bekleme süresi','Kapsamlı UI/UX iyileştirmeleri ve kod optimizasyonu'], fixes: ['Cache-Control header eklendi (tarayıcı cache sorunu)','Giriş/Kayıt ekranı UI/UX yenilendi + Lara\'s Engine branding'] }),
      createdAt: new Date().toISOString()
    });
  }
  const has33 = sqlite.prepare("SELECT COUNT(*) as c FROM patchNotes WHERE version = '3.3'").get().c;
  if (!has33 && patchCount > 0) {
    const insertPatch33 = sqlite.prepare('INSERT INTO patchNotes (id, version, title, content, createdAt) VALUES (@id, @version, @title, @content, @createdAt)');
    insertPatch33.run({
      id: genId(), version: '3.3', title: 'DM Yenileme + Son Görülme + Okundu Bilgisi',
      content: JSON.stringify({ date: '26 Mart 2026', features: ['DM mesaj baloncukları yenilendi: gradient arka plan, gölge efekti, farklı renk paleti','Sohbet başlığında son görülme bilgisi (çevrimiçi/uzakta/çevrimdışı)','WhatsApp tarzı okundu bilgisi: gri ✓ (gönderildi), mavi ✓✓ (okundu)','Online durum göstergesi: yeşil pulsing dot, sarı uzakta, otomatik güncelleme','Boş sohbet ekranı yenilendi: animasyonlu illüstrasyon ve Yeni Mesaj butonu','Heartbeat sistemi: 60sn periyodik lastSeen güncelleme','Konuşma listesinde online/away durum göstergesi'], fixes: ['DM parametre uyumsuzluğu düzeltildi (fromUserId→senderId)','Konuşma listesinde "undefined" isim hatası düzeltildi','Mesaj gönderen/alıcı ayrımı (fromUserId/userId) düzeltildi','Dropdown menü pozisyon hatası düzeltildi (profil sayfası)'] }),
      createdAt: new Date().toISOString()
    });
  }
  const has32 = sqlite.prepare("SELECT COUNT(*) as c FROM patchNotes WHERE version = '3.2'").get().c;
  if (!has32 && patchCount > 0) {
    const insertPatch = sqlite.prepare('INSERT INTO patchNotes (id, version, title, content, createdAt) VALUES (@id, @version, @title, @content, @createdAt)');
    insertPatch.run({
      id: genId(), version: '3.2', title: 'Öne Çıkar + Light Tema + Bug Fix',
      content: JSON.stringify({ date: '26 Mart 2026', features: ['Yankı menüsüne ⭐ Öne Çıkar özelliği eklendi (maks 5)','Profilde öne çıkan kartlar gradient kenarlıkla belirginleştirildi','Bildirimlerde gerçek kullanıcı adları gösteriliyor','Dropdown menü viewport sınır kontrolü eklendi'], fixes: ['Light/dark tema geçişinde 30+ renk uyumsuzluğu düzeltildi','Composer, reyankı popup, yorum kutusu tema uyumlu hale getirildi','Dropdown menü overflow sorunu çözüldü','Skeleton kartlar ve sidebar tema uyumu düzeltildi'] }),
      createdAt: new Date().toISOString()
    });
    insertPatch.run({
      id: genId(), version: '3.1', title: 'Anasayfa UI/UX + 18 Yeni Özellik',
      content: JSON.stringify({ date: '24 Mart 2026', features: ['Floating Bubble yankı kutusu tasarımı','Dairesel karakter sayacı','Canlı önizleme (hashtag/mention)','Mood seçici','Taslak otomatik kayıt','Sonsuz scroll + Başa dön','Skeleton loading','Feed takip önerisi kartları','Animasyonlu sekme göstergesi','Gündem sparkline grafikleri','Sidebar canlı aktivite','Scroll ilerleme çubuğu','Yumuşak tema geçişi','Özel reyankı popup','Glassmorphism kartlar'], fixes: ['Profil mood düzeltildi','Öne çıkanlar Yankılar sekmesine taşındı','Reyankı özel popup'] }),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  if (patchCount === 0) {
    const notes = [
      {
        id: genId(), version: '3.5', title: 'Keşfet Yenileme + Öne Çıkanlar + Sabitleme Kaldırma',
        content: JSON.stringify({
          date: '27 Mart 2026',
          features: [
            'Keşfet sayfası tamamen yenilendi: hero header, tab sistemi (Senin İçin / Trend / Kişiler / Hashtagler)',
            'Gelişmiş arama: debounced instant search, birleşik sonuçlar (kişiler/hashtagler/yankılar)',
            'Hashtag algoritması güncellendi: kategori tespiti, etkileşim skoru, hız bonusu',
            'Gündem sidebar kısaltıldı: ilk 3 trend + "Daha fazla göster" butonu',
            'Drag-to-scroll: keşfet önerileri, hashtagler ve profil öne çıkanlarda sürükleyerek kaydırma',
            'Öne çıkanlar devir daim: CSS marquee animasyonu ile sürekli kayma',
            'Öne çıkarma limiti 5\'ten 3\'e düşürüldü',
            'Geri butonu SVG ok ikonu ile yenilendi'
          ],
          fixes: [
            'Yankı sabitleme özelliği tamamen kaldırıldı',
            'Öne çıkarma dropdown metni düzeltildi (Öne Çıkar → Öne Çıkarmayı Kaldır)',
            'Öne çıkarma anında güncelleniyor (profil + feed)',
            'enrichYanki\'ye featured alanı eklendi',
            'Geri butonu ortalama düzeltmesi (display:flex)',
            'Kullanıcı silmede DM ve taslak temizliği eklendi'
          ]
        }),
        createdAt: new Date().toISOString()
      },
      {
        id: genId(), version: '3.4', title: 'E-posta Doğrulama + Şifre Sıfırlama',
        content: JSON.stringify({
          date: '27 Mart 2026',
          features: [
            'Kayıt sırasında e-posta doğrulama sistemi (6 haneli kod)',
            'Şifre sıfırlama: e-posta ile kod gönderimi + yeni şifre belirleme',
            'Doğrulama kodu otomatik odaklama ve yapıştırma desteği',
            'Spam koruması: 1 dakika bekleme süresi',
            'Kapsamlı UI/UX iyileştirmeleri ve kod optimizasyonu'
          ],
          fixes: [
            'Cache-Control header eklendi (tarayıcı cache sorunu)',
            'Giriş/Kayıt ekranı UI/UX yenilendi + Lara\'s Engine branding'
          ]
        }),
        createdAt: new Date().toISOString()
      },
      {
        id: genId(), version: '3.3', title: 'DM Yenileme + Son Görülme + Okundu Bilgisi',
        content: JSON.stringify({
          date: '26 Mart 2026',
          features: [
            'DM mesaj baloncukları yenilendi: gradient arka plan, gölge efekti, farklı renk paleti',
            'Sohbet başlığında son görülme bilgisi (çevrimiçi/uzakta/çevrimdışı)',
            'WhatsApp tarzı okundu bilgisi: gri ✓ (gönderildi), mavi ✓✓ (okundu)',
            'Online durum göstergesi: yeşil pulsing dot, sarı uzakta, otomatik güncelleme',
            'Boş sohbet ekranı yenilendi: animasyonlu illüstrasyon ve Yeni Mesaj butonu',
            'Heartbeat sistemi: 60sn periyodik lastSeen güncelleme',
            'Konuşma listesinde online/away durum göstergesi'
          ],
          fixes: [
            'DM parametre uyumsuzluğu düzeltildi (fromUserId→senderId)',
            'Konuşma listesinde "undefined" isim hatası düzeltildi',
            'Mesaj gönderen/alıcı ayrımı (fromUserId/userId) düzeltildi',
            'Dropdown menü pozisyon hatası düzeltildi (profil sayfası)'
          ]
        }),
        createdAt: new Date().toISOString()
      },
      {
        id: genId(), version: '3.2', title: 'Öne Çıkar + Light Tema + Bug Fix',
        content: JSON.stringify({
          date: '26 Mart 2026',
          features: [
            'Yankı menüsüne ⭐ Öne Çıkar özelliği eklendi (maks 5)',
            'Profilde öne çıkan kartlar gradient kenarlıkla belirginleştirildi',
            'Bildirimlerde gerçek kullanıcı adları gösteriliyor',
            'Dropdown menü viewport sınır kontrolü eklendi'
          ],
          fixes: [
            'Light/dark tema geçişinde 30+ renk uyumsuzluğu düzeltildi',
            'Composer, reyankı popup, yorum kutusu tema uyumlu hale getirildi',
            'Dropdown menü overflow sorunu çözüldü (position:fixed)',
            'Skeleton kartlar ve sidebar tema uyumu düzeltildi'
          ]
        }),
        createdAt: new Date().toISOString()
      },
      {
        id: genId(), version: '3.1', title: 'Anasayfa UI/UX + 18 Yeni Özellik',
        content: JSON.stringify({
          date: '24 Mart 2026',
          features: [
            'Floating Bubble yankı kutusu tasarımı',
            'Dairesel karakter sayacı (SVG ring)',
            'Canlı önizleme (hashtag/mention renklendirme)',
            'Mood/ruh hali seçici',
            'Taslak otomatik kayıt göstergesi',
            'Sonsuz scroll + Başa dön butonu',
            'Skeleton loading kartları',
            'Feed içi takip önerisi kartları',
            'Animasyonlu sekme göstergesi',
            'Gündem sparkline grafikleri',
            'Sidebar kişi önerisi ve canlı aktivite',
            'Scroll ilerleme çubuğu',
            'Yumuşak tema geçiş animasyonu',
            'Özel reyankı popup tasarımı (glassmorphism)',
            'Glassmorphism yankı kartları'
          ],
          fixes: [
            'Profil durum (mood) özelliği düzeltildi',
            'Öne çıkan yankılar Hakkında\'dan Yankılar sekmesine taşındı',
            'Reyankı tarayıcı popup yerine özel popup kullanıyor'
          ]
        }),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: genId(), version: '3.0', title: 'SQLite Veritabanı + Social Hub',
        content: JSON.stringify({
          date: '21 Mart 2026',
          features: [
            'SQLite veritabanı entegrasyonu — veriler artık kalıcı',
            'Social Hub profil tasarımı (two-column layout)',
            'Stat kartları (beğeni, yorum, reyankı)',
            'Profil rozetleri sistemi',
            'Öne çıkan yankılar bölümü',
            'Mood/durum göstergesi',
            'Hakkında bölümü (konum, website, sosyal linkler, ilgi alanları)',
            'Sunucu hata yakalama iyileştirmesi'
          ],
          fixes: []
        }),
        createdAt: new Date().toISOString()
      },
      {
        id: genId(), version: '2.1', title: 'Bot Agent Sistemi + Bug Fix',
        content: JSON.stringify({
          date: '14 Mart 2026',
          features: [
            '5 bot agent (Ayşe, Mehmet, Zeynep, Ahmet, Elif)',
            'Otomatik yankı, beğeni, yorum, reyankı, takip',
            'Profil düzenleme iyileştirmesi'
          ],
          fixes: [
            '46+ bug düzeltmesi',
            'Takipçi/takip listesi düzeltmesi',
            'Reyankı düzeltmesi',
            'DM sistemi düzeltmesi'
          ]
        }),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: genId(), version: '1.8', title: 'Mobile PWA',
        content: JSON.stringify({
          date: '7 Mart 2026',
          features: [
            'Progressive Web App desteği',
            'Mobil uyumlu tasarım',
            'Çevrimdışı destek',
            'Ana ekrana ekleme'
          ],
          fixes: []
        }),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: genId(), version: '1.0', title: 'İlk Sürüm',
        content: JSON.stringify({
          date: '21 Şubat 2026',
          features: [
            'Yankı paylaşma',
            'Beğeni ve yorum',
            'Takip sistemi',
            'Bildirimler',
            'Mesajlaşma',
            'Arama ve keşfet',
            'Anket oluşturma',
            'Karanlık tema'
          ],
          fixes: []
        }),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    const insertPatch = sqlite.prepare('INSERT INTO patchNotes (id, version, title, content, createdAt) VALUES (@id, @version, @title, @content, @createdAt)');
    notes.forEach(n => insertPatch.run(n));
  }
}

// Init
initData();
startBotAgents();

// ─── enrichYanki ───────────────────────────────────────────────
const enrichYanki = (yanki, viewerId) => {
  if (typeof yanki === 'string') yanki = parseYanki(stmts.getYankiById.get(yanki));
  else if (yanki && !yanki.hasOwnProperty('pinned_parsed')) yanki = parseYanki(yanki);
  if (!yanki) return null;

  const author = getUser(yanki.userId);
  if (!author) return null;

  const likeCount = stmts.getLikeCount.get(yanki.id).count;
  const commentCount = stmts.getCommentCount.get(yanki.id).count;
  const reyankis = stmts.getReyankis.all(yanki.id);
  const userLike = viewerId ? stmts.getUserLike.get(yanki.id, viewerId) : null;
  const save = viewerId ? stmts.getSave.get(yanki.id, viewerId) : null;
  const userReyanki = viewerId ? stmts.getUserReyanki.get(yanki.id, viewerId) : null;

  // Get reyanki source
  let reyanki = null;
  if (yanki.reyankiOfId) {
    const original = parseYanki(stmts.getYankiById.get(yanki.reyankiOfId));
    if (original) {
      const originalAuthor = getUser(original.userId);
      reyanki = {
        id: original.id, text: original.text,
        username: originalAuthor?.username, displayName: originalAuthor?.displayName,
        profileImage: originalAuthor?.profileImage
      };
    }
  }

  // Get reply target
  let replyTo = null;
  if (yanki.replyToId) {
    const parent = parseYanki(stmts.getYankiById.get(yanki.replyToId));
    if (parent) {
      const parentAuthor = getUser(parent.userId);
      replyTo = { id: parent.id, username: parentAuthor?.username };
    }
  }

  // Poll enrichment
  let pollData = null;
  if (yanki.poll) {
    const pollVotes = stmts.getPollVotes.all(yanki.id);
    const myVoteEntry = viewerId ? pollVotes.find(v => v.userId === viewerId) : null;
    const createdTime = new Date(yanki.createdAt).getTime();
    const durationMs = (yanki.poll.duration || 24) * 60 * 60 * 1000;
    pollData = {
      id: yanki.id,
      options: (yanki.poll.options || []).map((opt, idx) => ({
        id: idx, text: opt,
        votes: pollVotes.filter(v => v.optionIndex === idx).length
      })),
      totalVotes: pollVotes.length,
      myVote: myVoteEntry ? myVoteEntry.optionIndex : null,
      expired: Date.now() > createdTime + durationMs
    };
  }

  // Reactions
  const reactionCounts = stmts.getReactionCounts.all(yanki.id);
  const userReactions = viewerId ? stmts.getReactionsByYanki.all(yanki.id).filter(r => r.userId === viewerId).map(r => r.emoji) : [];

  // Quote
  let quote = null;
  if (yanki.quoteOfId) {
    const qOriginal = parseYanki(stmts.getYankiById.get(yanki.quoteOfId));
    if (qOriginal) {
      const qAuthor = getUser(qOriginal.userId);
      quote = {
        id: qOriginal.id, text: qOriginal.text, image: qOriginal.image,
        username: qAuthor?.username, displayName: qAuthor?.displayName,
        profileImage: qAuthor?.profileImage, verified: qAuthor?.verified || false
      };
    }
  }

  // Images array
  const images = yanki.images ? (typeof yanki.images === 'string' ? JSON.parse(yanki.images) : yanki.images) : [];

  return {
    id: yanki.id, userId: yanki.userId,
    username: author.username, displayName: author.displayName,
    profileImage: author.profileImage, verified: author.verified,
    isBot: author.isBot || false,
    text: yanki.text, image: yanki.image, images,
    poll: pollData,
    reyanki, replyTo, quote,
    pinned: yanki.pinned || false,
    featured: yanki.featured || false,
    editedAt: yanki.editedAt || null,
    likes: likeCount, commentCount, reyankiCount: reyankis.length,
    reactions: reactionCounts, userReactions,
    isLiked: !!userLike, isSaved: !!save, isReyanked: !!userReyanki,
    createdAt: yanki.createdAt
  };
};

// Build profile response
const buildProfileResponse = (user, viewerId) => {
  const yankisCount = sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(user.id).count;
  const followersCount = stmts.getFollowerCount.get(user.id).count;
  const followingCount = stmts.getFollowingCount.get(user.id).count;
  const isFollowing = viewerId ? !!stmts.getFollow.get(viewerId, user.id) : false;

  return {
    user: {
      id: user.id, username: user.username, displayName: user.displayName,
      bio: user.bio, profileImage: user.profileImage, bannerImage: user.bannerImage,
      verified: user.verified, isAdmin: user.isAdmin || false, isBot: user.isBot || false,
      theme: user.theme || null, mood: user.mood || null,
      moodEmoji: user.moodEmoji || null, moodUpdatedAt: user.moodUpdatedAt || null,
      location: user.location || '', website: user.website || '',
      socialLinks: user.socialLinks || {}, interests: user.interests || [],
      createdAt: user.createdAt, yankisCount, followersCount, followingCount
    },
    isFollowing
  };
};

// ─── API Routes ────────────────────────────────────────────────
const routes = {
  // ═══ AUTH ═══
  'register': async (data) => {
    const { username, password, displayName, email } = data;
    if (!username || !password || !displayName) return { error: 'Tüm alanları doldurun' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Geçerli bir e-posta adresi girin' };
    if (password.length < 6) return { error: 'Şifre en az 6 karakter olmalı' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { error: 'Kullanıcı adı sadece harf, rakam ve _ içerebilir' };
    if (stmts.getUserByUsername.get(username)) return { error: 'Bu kullanıcı adı zaten alınmış' };
    const existingEmail = sqlite.prepare('SELECT id FROM users WHERE email = ? AND emailVerified = 1').get(email);
    if (existingEmail) return { error: 'Bu e-posta adresi zaten kullanılıyor' };

    const user = {
      id: genId(), username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      password, displayName, bio: '', profileImage: null, bannerImage: null,
      verified: 0, isAdmin: 0, isBot: 0, banned: 0, theme: null,
      mood: null, moodEmoji: null, moodUpdatedAt: null,
      location: '', website: '', socialLinks: '{}', interests: '[]',
      email, emailVerified: 0,
      createdAt: new Date().toISOString()
    };
    stmts.insertUser.run(user);

    // Doğrulama kodu gönder
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sqlite.prepare('INSERT INTO verification_codes (id, userId, email, code, type, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)').run(
      genId(), user.id, email, code, 'email_verify',
      new Date(Date.now() + 10 * 60000).toISOString(), new Date().toISOString()
    );
    await sendMail(email, 'Yankuş - E-posta Doğrulama', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:16px">
        <h2 style="text-align:center;color:#e74c3c;margin-bottom:8px">🐦 Yankuş</h2>
        <p style="text-align:center;color:#ccc;margin-bottom:24px">Hesabını doğrulamak için aşağıdaki kodu gir</p>
        <div style="text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#fff;background:#2a2a4a;padding:20px;border-radius:12px;margin-bottom:24px">${code}</div>
        <p style="text-align:center;color:#888;font-size:13px">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
      </div>
    `);

    return { needsVerification: true, userId: user.id, email };
  },

  'verify-email': (data) => {
    const { userId, code } = data;
    if (!userId || !code) return { error: 'Kod gerekli' };
    const vc = sqlite.prepare('SELECT * FROM verification_codes WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1').get(userId, 'email_verify');
    if (!vc) return { error: 'Doğrulama kodu bulunamadı' };
    if (new Date(vc.expiresAt) < new Date()) return { error: 'Kodun süresi dolmuş. Yeni kod isteyin.' };
    if (vc.code !== code) return { error: 'Kod hatalı' };
    sqlite.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(vc.id);
    sqlite.prepare('UPDATE users SET emailVerified = 1 WHERE id = ?').run(userId);
    const user = parseUser(stmts.getUserById.get(userId));
    return { success: true, user: { ...user, password: undefined } };
  },

  'resend-verification': async (data) => {
    const { userId } = data;
    if (!userId) return { error: 'userId gerekli' };
    const user = stmts.getUserById.get(userId);
    if (!user || !user.email) return { error: 'Kullanıcı bulunamadı' };
    if (user.emailVerified) return { error: 'E-posta zaten doğrulanmış' };
    // Son 60sn içinde kod gönderilmiş mi
    const recent = sqlite.prepare('SELECT * FROM verification_codes WHERE userId = ? AND type = ? AND createdAt > ? ORDER BY createdAt DESC LIMIT 1').get(userId, 'email_verify', new Date(Date.now() - 60000).toISOString());
    if (recent) return { error: 'Lütfen 1 dakika bekleyin' };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sqlite.prepare('INSERT INTO verification_codes (id, userId, email, code, type, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)').run(
      genId(), userId, user.email, code, 'email_verify',
      new Date(Date.now() + 10 * 60000).toISOString(), new Date().toISOString()
    );
    await sendMail(user.email, 'Yankuş - E-posta Doğrulama', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:16px">
        <h2 style="text-align:center;color:#e74c3c;margin-bottom:8px">🐦 Yankuş</h2>
        <p style="text-align:center;color:#ccc;margin-bottom:24px">Yeni doğrulama kodun</p>
        <div style="text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#fff;background:#2a2a4a;padding:20px;border-radius:12px;margin-bottom:24px">${code}</div>
        <p style="text-align:center;color:#888;font-size:13px">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
      </div>
    `);
    return { success: true };
  },

  'forgot-password': async (data) => {
    const { email } = data;
    if (!email) return { error: 'E-posta adresi gerekli' };
    const user = sqlite.prepare('SELECT * FROM users WHERE email = ? AND emailVerified = 1').get(email);
    if (!user) return { success: true }; // Güvenlik: kullanıcı var mı yok mu belli etme
    // Son 60sn içinde kod gönderilmiş mi
    const recent = sqlite.prepare('SELECT * FROM verification_codes WHERE email = ? AND type = ? AND createdAt > ? ORDER BY createdAt DESC LIMIT 1').get(email, 'password_reset', new Date(Date.now() - 60000).toISOString());
    if (recent) return { error: 'Lütfen 1 dakika bekleyin' };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sqlite.prepare('INSERT INTO verification_codes (id, userId, email, code, type, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)').run(
      genId(), user.id, email, code, 'password_reset',
      new Date(Date.now() + 10 * 60000).toISOString(), new Date().toISOString()
    );
    await sendMail(email, 'Yankuş - Şifre Sıfırlama', `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:16px">
        <h2 style="text-align:center;color:#e74c3c;margin-bottom:8px">🐦 Yankuş</h2>
        <p style="text-align:center;color:#ccc;margin-bottom:24px">Şifreni sıfırlamak için aşağıdaki kodu gir</p>
        <div style="text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#fff;background:#2a2a4a;padding:20px;border-radius:12px;margin-bottom:24px">${code}</div>
        <p style="text-align:center;color:#888;font-size:13px">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
      </div>
    `);
    return { success: true };
  },

  'reset-password': (data) => {
    const { email, code, newPassword } = data;
    if (!email || !code || !newPassword) return { error: 'Tüm alanları doldurun' };
    if (newPassword.length < 6) return { error: 'Şifre en az 6 karakter olmalı' };
    const vc = sqlite.prepare('SELECT * FROM verification_codes WHERE email = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1').get(email, 'password_reset');
    if (!vc) return { error: 'Sıfırlama kodu bulunamadı' };
    if (new Date(vc.expiresAt) < new Date()) return { error: 'Kodun süresi dolmuş' };
    if (vc.code !== code) return { error: 'Kod hatalı' };
    sqlite.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(vc.id);
    sqlite.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, vc.userId);
    return { success: true };
  },

  'login': (data) => {
    const { username, password } = data;
    const row = stmts.getUserByUsername.get(username);
    if (!row || row.password !== password) return { error: 'Kullanıcı adı veya şifre hatalı' };
    if (row.email && !row.emailVerified) return { needsVerification: true, userId: row.id, email: row.email };
    sqlite.prepare('UPDATE users SET lastSeen = ? WHERE id = ?').run(new Date().toISOString(), row.id);
    const user = parseUser(stmts.getUserById.get(row.id));
    return { user: { ...user, password: undefined } };
  },

  'heartbeat': (data) => {
    const { userId } = data;
    if (!userId) return { error: 'userId gerekli' };
    sqlite.prepare('UPDATE users SET lastSeen = ? WHERE id = ?').run(new Date().toISOString(), userId);
    return { success: true };
  },

  // ═══ PROFILE ═══
  'profile': (data) => {
    const { userId, viewerId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return buildProfileResponse(user, viewerId);
  },

  'profile/update': (data) => {
    const { userId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };

    const updates = [];
    const params = { id: userId };

    if (data.displayName) { updates.push('displayName = @displayName'); params.displayName = data.displayName; }
    if (data.bio !== undefined) { updates.push('bio = @bio'); params.bio = data.bio; }
    if (data.profileImage !== undefined) { updates.push('profileImage = @profileImage'); params.profileImage = data.profileImage; }
    if (data.bannerImage !== undefined) { updates.push('bannerImage = @bannerImage'); params.bannerImage = data.bannerImage; }
    if (data.theme !== undefined) { updates.push('theme = @theme'); params.theme = data.theme; }
    if (data.mood !== undefined) { updates.push('mood = @mood'); params.mood = data.mood; }
    if (data.moodEmoji !== undefined) { updates.push('moodEmoji = @moodEmoji'); params.moodEmoji = data.moodEmoji; }
    if (data.moodUpdatedAt !== undefined) { updates.push('moodUpdatedAt = @moodUpdatedAt'); params.moodUpdatedAt = data.moodUpdatedAt; }
    if (data.location !== undefined) { updates.push('location = @location'); params.location = data.location; }
    if (data.website !== undefined) { updates.push('website = @website'); params.website = data.website; }
    if (data.socialLinks !== undefined) { updates.push('socialLinks = @socialLinks'); params.socialLinks = JSON.stringify(data.socialLinks); }
    if (data.interests !== undefined) { updates.push('interests = @interests'); params.interests = JSON.stringify(data.interests); }

    if (updates.length > 0) {
      sqlite.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = @id`).run(params);
    }

    const updated = getUser(userId);
    return { user: { ...updated, password: undefined } };
  },

  'profile/username': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return buildProfileResponse(user, viewerId);
  },

  // ═══ FEED ═══
  'feed': (data) => {
    const { userId, algo } = data;
    const blockedIds = stmts.getBlocksByUser.all(userId).map(b => b.blockedId);

    let yankis;
    switch (algo) {
      case 'smart': {
        const all = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL ORDER BY createdAt DESC LIMIT 200').all();
        const now = Date.now();
        yankis = all
          .filter(y => !blockedIds.includes(y.userId))
          .map(y => {
            const likes = stmts.getLikeCount.get(y.id).count;
            const comments = stmts.getCommentCount.get(y.id).count;
            const reyankis = stmts.getReyankis.all(y.id).length;
            // Etkileşim puanı
            const engagement = likes + comments * 2 + reyankis * 3;
            // Zaman faktörü — son 1 saat: x4, son 6 saat: x2, son 24 saat: x1.5, eski: x1
            const ageH = (now - new Date(y.createdAt).getTime()) / 3600000;
            const timeFactor = ageH < 1 ? 4 : ageH < 6 ? 2 : ageH < 24 ? 1.5 : Math.max(0.5, 1 - (ageH - 24) / 120);
            // Hız bonusu — etkileşim/saat
            const velocity = ageH > 0 ? engagement / ageH : engagement * 10;
            // Çeşitlilik — farklı kaynaklardan etkileşim
            const diversity = (likes > 0 ? 1 : 0) + (comments > 0 ? 1 : 0) + (reyankis > 0 ? 1 : 0);
            const score = (engagement * timeFactor) + (velocity * 0.5) + (diversity * 2);
            return { yanki: y, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 50)
          .map(item => item.yanki);
        break;
      }
      case 'media': {
        yankis = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL AND image IS NOT NULL ORDER BY createdAt DESC LIMIT 50').all()
          .filter(y => !blockedIds.includes(y.userId));
        break;
      }
      case 'explore':
      case 'chrono':
      default: {
        yankis = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL ORDER BY createdAt DESC LIMIT 50').all()
          .filter(y => !blockedIds.includes(y.userId));
        break;
      }
    }

    return { yankis: yankis.map(y => enrichYanki(y, userId)).filter(Boolean) };
  },

  // ═══ YANKI CRUD ═══
  'yanki/create': (data) => {
    const { userId, text, image, images, poll, replyToId } = data;
    const reyankiOfId = data.reyankiOfId || data.reyanki || null;
    const quoteOfId = data.quoteOfId || null;
    if (!text && !image && !poll && !quoteOfId && (!images || images.length === 0)) return { error: 'İçerik gerekli' };

    const yanki = {
      id: genId(), userId, text: text || '', image: image || null,
      images: images ? JSON.stringify(images) : '[]',
      poll: poll ? JSON.stringify(poll) : null,
      replyToId: replyToId || null, reyankiOfId, quoteOfId, pinned: 0, editedAt: null,
      createdAt: new Date().toISOString()
    };
    stmts.insertYanki.run(yanki);

    if (replyToId) {
      const parent = parseYanki(stmts.getYankiById.get(replyToId));
      if (parent && parent.userId !== userId) {
        stmts.insertNotification.run({ id: genId(), userId: parent.userId, fromId: userId, type: 'comment', yankiId: yanki.id, read: 0, createdAt: new Date().toISOString() });
      }
    }

    return { yanki: enrichYanki(yanki, userId) };
  },

  'yanki': (data) => {
    const { yankiId, viewerId } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki) return { error: 'Yankı bulunamadı' };
    const comments = stmts.getReplies.all(yankiId).map(c => enrichYanki(c, viewerId)).filter(Boolean);
    return { ...enrichYanki(yanki, viewerId), comments };
  },

  'yanki/get': (data) => routes['yanki'](data),

  'yanki/delete': (data) => {
    const { yankiId, userId } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki || yanki.userId !== userId) return { error: 'Yankı bulunamadı veya yetkiniz yok' };
    stmts.deleteYanki.run(yankiId);
    stmts.deleteLikesByYanki.run(yankiId);
    stmts.deleteCommentsByYanki.run(yankiId);
    stmts.deleteSavesByYanki.run(yankiId);
    return { success: true };
  },

  'yanki/reyanki': (data) => {
    const { yankiId, userId, text } = data;
    const original = parseYanki(stmts.getYankiById.get(yankiId));
    if (!original) return { error: 'Yankı bulunamadı' };

    const existing = stmts.getUserReyanki.get(yankiId, userId);
    if (existing) {
      stmts.deleteYanki.run(existing.id);
      return { removed: true };
    }

    const reyanki = {
      id: genId(), userId, text: text || '', image: null, images: '[]', poll: null,
      replyToId: null, reyankiOfId: yankiId, quoteOfId: null, pinned: 0, editedAt: null, createdAt: new Date().toISOString()
    };
    stmts.insertYanki.run(reyanki);

    if (original.userId !== userId) {
      stmts.insertNotification.run({ id: genId(), userId: original.userId, fromId: userId, type: 'reyanki', yankiId: reyanki.id, read: 0, createdAt: new Date().toISOString() });
    }
    return { yanki: enrichYanki(reyanki, userId) };
  },

  // ═══ LIKE ═══
  'like': (data) => {
    const { yankiId, userId } = data;
    const existing = stmts.getUserLike.get(yankiId, userId);
    if (existing) {
      stmts.deleteLike.run(existing.id);
      return { success: true, liked: false, count: stmts.getLikeCount.get(yankiId).count };
    }
    stmts.insertLike.run({ id: genId(), yankiId, userId, createdAt: new Date().toISOString() });
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (yanki && yanki.userId !== userId) {
      stmts.insertNotification.run({ id: genId(), userId: yanki.userId, fromId: userId, type: 'like', yankiId, read: 0, createdAt: new Date().toISOString() });
    }
    return { success: true, liked: true, count: stmts.getLikeCount.get(yankiId).count };
  },

  'yanki/like': (data) => routes['like'](data),

  // ═══ SAVE ═══
  'save': (data) => {
    const { yankiId, userId } = data;
    const existing = stmts.getSave.get(yankiId, userId);
    if (existing) {
      stmts.deleteSave.run(existing.id);
      return { success: true, saved: false };
    }
    stmts.insertSave.run({ id: genId(), yankiId, userId, note: '', createdAt: new Date().toISOString() });
    return { success: true, saved: true };
  },

  'yanki/save': (data) => routes['save'](data),

  'saved': (data) => {
    const { userId } = data;
    const saves = stmts.getSavesByUser.all(userId);
    const yankis = saves.map(s => {
      const y = parseYanki(stmts.getYankiById.get(s.yankiId));
      return y ? enrichYanki(y, userId) : null;
    }).filter(Boolean);
    return { yankis };
  },

  // ═══ PIN ═══
  'yanki/pin': (data) => {
    const { userId, yankiId } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki || yanki.userId !== userId) return { error: 'Yankı bulunamadı veya yetkiniz yok' };

    const newPinned = yanki.pinned ? 0 : 1;
    if (newPinned) {
      sqlite.prepare('UPDATE yankis SET pinned = 0 WHERE userId = ? AND id != ?').run(userId, yankiId);
    }
    sqlite.prepare('UPDATE yankis SET pinned = ? WHERE id = ?').run(newPinned, yankiId);
    return { success: true, pinned: !!newPinned };
  },

  // ═══ FEATURE (Öne Çıkar) ═══
  'yanki/feature': (data) => {
    const { userId, yankiId } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki || yanki.userId !== userId) return { error: 'Yankı bulunamadı veya yetkiniz yok' };
    const newFeatured = yanki.featured ? 0 : 1;
    // Maksimum 3 öne çıkarılmış yankı
    if (newFeatured) {
      const count = sqlite.prepare('SELECT COUNT(*) as c FROM yankis WHERE userId = ? AND featured = 1').get(userId).c;
      if (count >= 3) return { error: 'En fazla 3 yankı öne çıkarabilirsiniz' };
    }
    sqlite.prepare('UPDATE yankis SET featured = ? WHERE id = ?').run(newFeatured, yankiId);
    return { success: true, featured: !!newFeatured };
  },

  // ═══ COMMENT ═══
  'comment': (data) => {
    const { yankiId, userId, text, replyToId, image } = data;
    if (!text) return { error: 'Yorum boş olamaz' };

    const reply = {
      id: genId(), userId, text, image: image || null, images: '[]', poll: null,
      replyToId: replyToId || yankiId, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null,
      createdAt: new Date().toISOString()
    };
    stmts.insertYanki.run(reply);
    stmts.insertComment.run({ id: reply.id, yankiId, userId, text, createdAt: reply.createdAt });

    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (yanki && yanki.userId !== userId) {
      stmts.insertNotification.run({ id: genId(), userId: yanki.userId, fromId: userId, type: 'comment', yankiId: reply.id, read: 0, createdAt: new Date().toISOString() });
    }
    return { success: true, comment: enrichYanki(reply, userId) };
  },

  'comment/create': (data) => routes['comment'](data),

  // ═══ FOLLOW ═══
  'follow': (data) => {
    const { followerId, followingId } = data;
    if (followerId === followingId) return { error: 'Kendini takip edemezsin' };

    const existing = stmts.getFollow.get(followerId, followingId);
    if (existing) {
      stmts.deleteFollow.run(existing.id);
      return { following: false };
    }
    stmts.insertFollow.run({ id: genId(), followerId, followingId, createdAt: new Date().toISOString() });
    stmts.insertNotification.run({ id: genId(), userId: followingId, fromId: followerId, type: 'follow', read: 0, yankiId: null, createdAt: new Date().toISOString() });
    return { following: true };
  },

  // ═══ NOTIFICATIONS ═══
  'notifications': (data) => {
    const { userId } = data;
    const notifs = stmts.getNotifications.all(userId).map(n => {
      const from = getUser(n.fromId);
      return { ...n, read: !!n.read, fromName: from?.displayName || 'Kullanıcı', fromUsername: from?.username, fromProfileImage: from?.profileImage || null };
    });
    const unreadCount = stmts.getUnreadCount.get(userId).count;
    return { notifications: notifs, unreadCount };
  },

  'notifications/count': (data) => {
    const { userId } = data;
    if (!userId) return { count: 0 };
    return { count: stmts.getUnreadCount.get(userId).count };
  },

  'notifications/read': (data) => {
    stmts.markNotificationsRead.run(data.userId);
    return { success: true };
  },

  'notifications/read-one': (data) => {
    stmts.markNotificationRead.run(data.notifId);
    return { success: true };
  },

  'notifications/clear': (data) => {
    stmts.clearNotifications.run(data.userId);
    return { success: true };
  },

  // ═══ USER ═══
  'user': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const followerCount = stmts.getFollowerCount.get(user.id).count;
    const followingCount = stmts.getFollowingCount.get(user.id).count;
    const isFollowing = viewerId ? !!stmts.getFollow.get(viewerId, user.id) : false;
    return { user: { ...user, password: undefined, followerCount, followingCount }, isFollowing };
  },

  'user/yankis': (data) => {
    const { username, viewerId } = data;
    const user = getUserByUsername(username);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const yankis = stmts.getYankisByUser.all(user.id).map(y => enrichYanki(y, viewerId)).filter(Boolean);
    return { yankis };
  },

  'yankis': (data) => {
    const { userId, viewerId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const yankis = stmts.getYankisByUser.all(user.id).map(y => enrichYanki(y, viewerId)).filter(Boolean);
    return { yankis };
  },

  'user/followers': (data) => {
    const { userId } = data;
    const followerIds = stmts.getFollowers.all(userId).map(f => f.followerId);
    const users = followerIds.map(id => { const u = getUser(id); return u ? { ...u, password: undefined } : null; }).filter(Boolean);
    return { users };
  },

  'user/following': (data) => {
    const { userId } = data;
    const followingIds = stmts.getFollowing.all(userId).map(f => f.followingId);
    const users = followingIds.map(id => { const u = getUser(id); return u ? { ...u, password: undefined } : null; }).filter(Boolean);
    return { users };
  },

  'user/update': (data) => routes['profile/update'](data),

  // ═══ BLOCK ═══
  'block': (data) => {
    const { userId, targetId } = data;
    const existing = stmts.getBlock.get(userId, targetId);
    if (existing) {
      stmts.deleteBlock.run(existing.id);
      return { blocked: false };
    }
    stmts.insertBlock.run({ id: genId(), userId, blockedId: targetId, createdAt: new Date().toISOString() });
    stmts.deleteFollowPair.run(userId, targetId, targetId, userId);
    return { blocked: true };
  },

  // ═══ REPORT ═══
  'report': (data) => {
    const { yankiId, userId, reason } = data;
    stmts.insertReport.run({ id: genId(), yankiId, reporterId: userId, reason, status: 'pending', createdAt: new Date().toISOString() });
    return { success: true };
  },

  // ═══ SEARCH ═══
  'search': (data) => {
    const { query, userId, type } = data;
    if (!query || !query.trim()) return { users: [], yankis: [], hashtags: [] };
    const q = query.trim().toLowerCase();

    // Kullanıcı arama
    const users = sqlite.prepare("SELECT * FROM users WHERE LOWER(username) LIKE ? OR LOWER(displayName) LIKE ? LIMIT 15").all(`%${q.replace('@','')}%`, `%${q.replace('@','')}%`)
      .map(u => ({ ...parseUser(u), password: undefined }));

    // Hashtag arama
    const dayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const allYankis = sqlite.prepare('SELECT text, createdAt FROM yankis WHERE createdAt > ?').all(dayAgo);
    const tagCounts = {};
    allYankis.forEach(y => {
      (y.text.match(/#[\wğüşöçıİĞÜŞÖÇ]+/gi) || []).forEach(tag => {
        if (tag.toLowerCase().includes(q.replace('#',''))) tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1;
      });
    });
    const hashtags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

    // Yankı arama
    const yankis = sqlite.prepare("SELECT * FROM yankis WHERE LOWER(text) LIKE ? ORDER BY createdAt DESC LIMIT 30").all(`%${q}%`)
      .map(y => enrichYanki(y, userId)).filter(Boolean);

    return { users, yankis, hashtags };
  },

  // ═══ TRENDING ═══
  'trending': () => {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3600000).toISOString();
    const hourAgo = new Date(now - 3600000).toISOString();
    const sixHourAgo = new Date(now - 6 * 3600000).toISOString();

    // Hashtag kategori eşleştirme
    const catMap = {
      spor: ['futbol','basketbol','voleybol','maç','gol','şampiyon','lig','derbi','transfer','stadyum','fenerbahçe','galatasaray','beşiktaş','trabzonspor','milli','olimpiyat','spor','fifa','nba'],
      teknoloji: ['yazılım','kod','react','python','ai','yapay','zeka','tech','web','uygulama','startup','kripto','bitcoin','blockchain','robot','algorithm','api','developer','programlama','teknoloji','bilgisayar','telefon','iphone','android','linux'],
      müzik: ['müzik','şarkı','albüm','konser','spotify','playlist','melodi','rap','pop','rock','jazz','piyano','gitar','sanatçı','feat','single','klip'],
      sanat: ['sanat','resim','tablo','sergi','tasarım','fotoğraf','sinema','film','dizi','kitap','roman','yazar','edebiyat','şiir','tiyatro'],
      yemek: ['yemek','tarif','mutfak','lezzet','restoran','kahve','çay','pizza','burger','tatlı','pasta','iftar','sahur','gurme','aşçı'],
      seyahat: ['seyahat','gezi','tatil','otel','uçak','istanbul','ankara','izmir','antalya','plaj','deniz','doğa','kamp','tur','vize']
    };
    const detectCat = (tag) => {
      const t = tag.replace('#','').toLowerCase();
      for (const [cat, keys] of Object.entries(catMap)) {
        if (keys.some(k => t.includes(k))) return cat;
      }
      return 'genel';
    };

    // Yankıları çek (hashtag + etkileşim bilgisiyle)
    const recentYankis = sqlite.prepare('SELECT id, text, createdAt FROM yankis WHERE createdAt > ?').all(dayAgo);

    const tagData = {};
    recentYankis.forEach(y => {
      const matches = y.text.match(/#[\wğüşöçıİĞÜŞÖÇ]+/gi) || [];
      const isHour = y.createdAt > hourAgo;
      const isSixHour = y.createdAt > sixHourAgo;
      // Etkileşim skoru
      const likes = stmts.getLikeCount.get(y.id)?.count || 0;
      const comments = stmts.getCommentCount.get(y.id)?.count || 0;
      const engagement = likes + comments * 2;

      matches.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (!tagData[tagLower]) tagData[tagLower] = { tag: tagLower, topic: tag, countDay: 0, countHour: 0, countSixHour: 0, engagement: 0, uniqueUsers: new Set(), bars: Array(8).fill(0) };
        tagData[tagLower].countDay++;
        tagData[tagLower].engagement += engagement;
        if (isHour) tagData[tagLower].countHour++;
        if (isSixHour) tagData[tagLower].countSixHour++;
        // 3 saatlik dilimler (8 bar = 24 saat)
        const hoursAgo = (now - new Date(y.createdAt).getTime()) / 3600000;
        const barIdx = Math.min(7, Math.floor(hoursAgo / 3));
        tagData[tagLower].bars[7 - barIdx]++;
      });
    });

    const trends = Object.values(tagData)
      .map(t => {
        const category = detectCat(t.tag);
        // Gelişmiş skor: kullanım + etkileşim + hız bonusu
        const velocityBonus = t.countHour * 5; // Son 1 saat ağırlıklı
        const engagementBonus = Math.min(t.engagement, 50); // Max 50 bonus
        const score = t.countDay + velocityBonus + engagementBonus;
        const rising = t.countHour > (t.countDay / 24) * 1.5; // Ortalamanın 1.5 katı
        return { topic: t.topic, count: t.countDay, category, countHour: t.countHour, countDay: t.countDay, countSixHour: t.countSixHour, engagement: t.engagement, rising, score, bars: t.bars };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return { trends };
  },

  // ═══ HASHTAG ═══
  'hashtag/info': (data) => {
    const { hashtag } = data;
    const tag = hashtag.startsWith('#') ? hashtag : '#' + hashtag;
    const tagLower = tag.toLowerCase();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const totalYankis = sqlite.prepare("SELECT COUNT(*) as count FROM yankis WHERE LOWER(text) LIKE ?").get(`%${tagLower}%`).count;
    const last24h = sqlite.prepare("SELECT COUNT(*) as count FROM yankis WHERE LOWER(text) LIKE ? AND createdAt > ?").get(`%${tagLower}%`, dayAgo).count;
    return { totalYankis, last24h };
  },

  'hashtag': (data) => {
    const { hashtag, viewerId } = data;
    const tag = hashtag.startsWith('#') ? hashtag : '#' + hashtag;
    const tagLower = tag.toLowerCase();
    const yankis = sqlite.prepare("SELECT * FROM yankis WHERE LOWER(text) LIKE ? AND replyToId IS NULL ORDER BY createdAt DESC").all(`%${tagLower}%`)
      .map(y => enrichYanki(y, viewerId)).filter(Boolean);
    const info = routes['hashtag/info']({ hashtag });
    return { yankis, ...info };
  },

  // ═══ THREAD ═══
  'thread/create': (data) => {
    const { userId, items } = data;
    if (!items || !Array.isArray(items) || items.length === 0) return { error: 'Thread items gerekli' };

    let previousId = null;
    let count = 0;
    for (const item of items) {
      const yanki = {
        id: genId(), userId, text: item.text || '', image: item.image || null,
        images: '[]', poll: null, replyToId: previousId, reyankiOfId: null, quoteOfId: null, pinned: 0, editedAt: null,
        createdAt: new Date().toISOString()
      };
      stmts.insertYanki.run(yanki);
      if (previousId) {
        stmts.insertComment.run({ id: yanki.id, yankiId: previousId, userId, text: yanki.text, createdAt: yanki.createdAt });
      }
      previousId = yanki.id;
      count++;
    }
    return { success: true, count };
  },

  // ═══ SCHEDULE ═══
  'schedule/create': (data) => {
    const { userId, text, image, poll, scheduledAt, threadItems } = data;
    const scheduled = {
      id: genId(), userId, text: text || '', image: image || null,
      poll: poll ? JSON.stringify(poll) : null,
      scheduledAt: scheduledAt || new Date().toISOString(),
      threadItems: threadItems ? JSON.stringify(threadItems) : null,
      status: 'pending', createdAt: new Date().toISOString()
    };
    stmts.insertScheduled.run(scheduled);

    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      if (threadItems && threadItems.length > 0) {
        return routes['thread/create']({ userId, items: threadItems });
      } else {
        const result = routes['yanki/create']({ userId, text, image, poll });
        sqlite.prepare("UPDATE scheduled SET status = 'published' WHERE id = ?").run(scheduled.id);
        return { success: true, yanki: result.yanki };
      }
    }
    return { success: true, scheduledId: scheduled.id };
  },

  'schedule/list': (data) => {
    const { userId } = data;
    const scheduled = stmts.getScheduledByUser.all(userId).map(s => ({
      ...s, poll: s.poll ? JSON.parse(s.poll) : null,
      threadItems: s.threadItems ? JSON.parse(s.threadItems) : null
    }));
    return { scheduled };
  },

  'schedule/cancel': (data) => {
    stmts.deleteScheduled.run(data.scheduleId, data.userId);
    return { success: true };
  },

  // ═══ MESSAGES ═══
  'messages/conversations': (data) => {
    const { userId } = data;
    const allConvs = stmts.getAllConversations.all().map(parseConversation);
    const userConversations = allConvs
      .filter(c => c.participants.includes(userId))
      .map(c => {
        const otherUserId = c.participants.find(p => p !== userId);
        const otherUser = getUser(otherUserId);
        const msgs = stmts.getMessagesByConv.all(c.id).map(parseMessage);
        const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const unread = msgs.filter(m => m.userId !== userId && !m.read).length;
        return { id: c.id, otherUser: otherUser ? { ...otherUser, password: undefined } : null, lastMessage, unread, createdAt: c.createdAt };
      });
    return { conversations: userConversations };
  },

  'messages/get': (data) => {
    const { userId, otherId } = data;
    const allConvs = stmts.getAllConversations.all().map(parseConversation);
    const conv = allConvs.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
    if (!conv) return { messages: [], conversationId: null };
    const messages = stmts.getMessagesByConv.all(conv.id).map(m => {
      const pm = parseMessage(m);
      const sender = getUser(pm.userId);
      return { ...pm, username: sender?.username, displayName: sender?.displayName, profileImage: sender?.profileImage };
    });
    return { messages, conversationId: conv.id };
  },

  'messages/send': (data) => {
    const { senderId, receiverId, text, image } = data;
    if (!text && !image) return { error: 'Mesaj boş olamaz' };

    const allConvs = stmts.getAllConversations.all().map(parseConversation);
    let conv = allConvs.find(c => c.participants.includes(senderId) && c.participants.includes(receiverId));
    if (!conv) {
      conv = { id: genId(), participants: [senderId, receiverId], createdAt: new Date().toISOString() };
      stmts.insertConversation.run({ id: conv.id, participants: JSON.stringify(conv.participants), createdAt: conv.createdAt });
    }

    const msg = {
      id: genId(), conversationId: conv.id, userId: senderId,
      text: text || '', image: image || null, read: 0, reactions: '[]',
      createdAt: new Date().toISOString()
    };
    stmts.insertMessage.run(msg);
    stmts.insertNotification.run({ id: genId(), userId: receiverId, fromId: senderId, type: 'message', read: 0, yankiId: null, createdAt: new Date().toISOString() });
    return { success: true, message: parseMessage(msg) };
  },

  'messages/read': (data) => {
    const { userId, otherId } = data;
    const allConvs = stmts.getAllConversations.all().map(parseConversation);
    const conv = allConvs.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
    if (conv) stmts.markMessagesRead.run(conv.id, otherId);
    return { success: true };
  },

  'messages/delete': (data) => {
    const result = stmts.deleteMessage.run(data.msgId, data.userId);
    if (result.changes === 0) return { error: 'Mesaj bulunamadı' };
    return { success: true };
  },

  'messages/react': (data) => {
    const { userId, msgId, emoji } = data;
    const row = sqlite.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    if (!row) return { error: 'Mesaj bulunamadı' };
    const msg = parseMessage(row);
    const existing = msg.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existing) {
      msg.reactions = msg.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
    } else {
      msg.reactions.push({ userId, emoji, createdAt: new Date().toISOString() });
    }
    sqlite.prepare('UPDATE messages SET reactions = ? WHERE id = ?').run(JSON.stringify(msg.reactions), msgId);
    return { success: true, reactions: msg.reactions };
  },

  // ═══ EXPLORE ═══
  'explore/suggested': (data) => {
    const { userId, limit } = data;
    const followingIds = stmts.getFollowing.all(userId).map(f => f.followingId);
    const allUsers = stmts.getAllUsers.all().map(parseUser);
    const users = allUsers.filter(u => u.id !== userId && !followingIds.includes(u.id))
      .slice(0, limit || 5).map(u => ({ ...u, password: undefined }));
    return { users };
  },

  'explore/suggested-users': (data) => routes['explore/suggested'](data),

  'explore/trending-yankis': (data) => {
    const { viewerId, limit } = data;
    const dayAgo = new Date(Date.now() - 48 * 3600000).toISOString(); // Son 48 saat
    const all = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL AND createdAt > ? ORDER BY createdAt DESC').all(dayAgo);
    const yankis = all.map(y => {
      const likes = stmts.getLikeCount.get(y.id)?.count || 0;
      const comments = stmts.getCommentCount.get(y.id)?.count || 0;
      const reyankis = stmts.getReyankis.all(y.id)?.length || 0;
      // Zaman ağırlığı: yeni içerikler bonus alır
      const ageHours = (Date.now() - new Date(y.createdAt).getTime()) / 3600000;
      const timeDecay = Math.max(0.3, 1 - (ageHours / 48));
      const score = (likes + comments * 2 + reyankis * 3) * timeDecay;
      return { yanki: y, score };
    }).sort((a, b) => b.score - a.score).slice(0, limit || 20)
      .map(item => enrichYanki(item.yanki, viewerId)).filter(Boolean);
    return { yankis };
  },

  'explore/categories': (data) => {
    const { viewerId } = data;
    const dayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const catMap = { spor: ['futbol','maç','gol','lig','spor'], teknoloji: ['yazılım','kod','ai','tech','teknoloji'], müzik: ['müzik','şarkı','konser','spotify'], sanat: ['sanat','resim','film','dizi','kitap','şiir'], yemek: ['yemek','tarif','lezzet','kahve'], seyahat: ['seyahat','gezi','tatil','istanbul'] };
    const categories = {};
    for (const [cat, keywords] of Object.entries(catMap)) {
      const pattern = keywords.map(k => `%${k}%`);
      let catYankis = [];
      pattern.forEach(p => {
        const rows = sqlite.prepare('SELECT * FROM yankis WHERE LOWER(text) LIKE ? AND replyToId IS NULL AND createdAt > ? ORDER BY createdAt DESC LIMIT 5').all(p, dayAgo);
        catYankis.push(...rows);
      });
      // Tekrarları kaldır
      const seen = new Set();
      catYankis = catYankis.filter(y => { if (seen.has(y.id)) return false; seen.add(y.id); return true; });
      if (catYankis.length > 0) {
        categories[cat] = catYankis.slice(0, 5).map(y => enrichYanki(y, viewerId)).filter(Boolean);
      }
    }
    return { categories };
  },

  // ═══ POLL ═══
  'poll/vote': (data) => {
    const { yankiId, userId, optionIndex } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki || !yanki.poll) return { error: 'Anket bulunamadı' };
    if (stmts.getUserPollVote.get(yankiId, userId)) return { error: 'Zaten oy kullandınız' };
    stmts.insertPollVote.run({ id: genId(), yankiId, userId, optionIndex, createdAt: new Date().toISOString() });
    return { success: true };
  },

  // ═══ ADMIN ═══
  'admin/stats': () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return {
      userCount: sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count,
      yankiCount: sqlite.prepare('SELECT COUNT(*) as count FROM yankis').get().count,
      reportCount: sqlite.prepare('SELECT COUNT(*) as count FROM reports').get().count,
      activeCount: sqlite.prepare('SELECT COUNT(DISTINCT userId) as count FROM yankis WHERE createdAt > ?').get(dayAgo).count
    };
  },

  'admin/users': () => {
    const users = stmts.getAllUsers.all().map(u => {
      const pu = parseUser(u);
      return {
        ...pu, password: undefined,
        yankiCount: sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(u.id).count,
        followerCount: stmts.getFollowerCount.get(u.id).count,
        followingCount: stmts.getFollowingCount.get(u.id).count
      };
    });
    return { users };
  },

  'admin/user/ban': (data) => {
    const user = getUser(data.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const newBanned = user.banned ? 0 : 1;
    sqlite.prepare('UPDATE users SET banned = ? WHERE id = ?').run(newBanned, data.userId);
    return { success: true, banned: !!newBanned };
  },

  'admin/user/make-admin': (data) => {
    const user = getUser(data.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const newAdmin = user.isAdmin ? 0 : 1;
    sqlite.prepare('UPDATE users SET isAdmin = ? WHERE id = ?').run(newAdmin, data.userId);
    return { success: true, isAdmin: !!newAdmin };
  },

  'admin/user/delete': (data) => {
    const { userId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId);
    sqlite.prepare('DELETE FROM yankis WHERE userId = ?').run(userId);
    stmts.deleteLikesByUser.run(userId);
    stmts.deleteFollowsByUser.run(userId, userId);
    stmts.deleteNotificationsByUser.run(userId, userId);
    stmts.deleteCommentsByUser.run(userId);
    stmts.deleteSavesByUser.run(userId);
    sqlite.prepare('DELETE FROM messages WHERE userId = ?').run(userId);
    sqlite.prepare('DELETE FROM blocks WHERE userId = ? OR blockedId = ?').run(userId, userId);
    try { sqlite.prepare('DELETE FROM drafts WHERE userId = ?').run(userId); } catch(e) {}
    return { success: true };
  },

  'admin/user/detail': (data) => {
    const user = getUser(data.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return {
      user: {
        ...user, password: undefined,
        yankiCount: sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(user.id).count,
        commentCount: sqlite.prepare('SELECT COUNT(*) as count FROM comments WHERE userId = ?').get(user.id).count,
        likeCount: sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE userId = ?').get(user.id).count,
        followerCount: stmts.getFollowerCount.get(user.id).count,
        followingCount: stmts.getFollowingCount.get(user.id).count,
        reportCount: sqlite.prepare('SELECT COUNT(*) as count FROM reports WHERE reporterId = ?').get(user.id).count
      }
    };
  },

  'admin/yanki/delete': (data) => {
    const { yankiId } = data;
    stmts.deleteYanki.run(yankiId);
    stmts.deleteLikesByYanki.run(yankiId);
    stmts.deleteCommentsByYanki.run(yankiId);
    stmts.deleteSavesByYanki.run(yankiId);
    return { success: true };
  },

  'admin/yankis/recent': (data) => {
    const yankis = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL ORDER BY createdAt DESC LIMIT ?').all(data.limit || 50)
      .map(y => {
        const author = getUser(y.userId);
        return {
          ...parseYanki(y), username: author?.username, displayName: author?.displayName,
          profileImage: author?.profileImage,
          likes: stmts.getLikeCount.get(y.id).count,
          commentCount: stmts.getCommentCount.get(y.id).count
        };
      });
    return { yankis };
  },

  'admin/reports': () => {
    const reports = stmts.getAllReports.all().map(r => {
      const reporter = getUser(r.reporterId);
      const yanki = parseYanki(stmts.getYankiById.get(r.yankiId));
      const yankiAuthor = yanki ? getUser(yanki.userId) : null;
      return { ...r, reporterName: reporter?.displayName, reporterUsername: reporter?.username, yankiText: yanki?.text, yankiAuthor: yankiAuthor?.username };
    });
    return { reports };
  },

  'admin/yankis/bulk-delete': (data) => {
    const { yankiIds } = data;
    if (!Array.isArray(yankiIds)) return { error: 'yankiIds gerekli' };
    const del = sqlite.transaction(() => {
      yankiIds.forEach(id => {
        stmts.deleteYanki.run(id);
        stmts.deleteLikesByYanki.run(id);
        stmts.deleteCommentsByYanki.run(id);
        stmts.deleteSavesByYanki.run(id);
      });
    });
    del();
    return { success: true, deletedCount: yankiIds.length };
  },

  'admin/analytics': () => {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - (i + 1) * 24 * 60 * 60 * 1000).toISOString();
      const dayEnd = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
      dailyActivity.push({
        date: dayEnd.split('T')[0],
        yankis: sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE createdAt > ? AND createdAt <= ?').get(dayStart, dayEnd).count,
        likes: sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE createdAt > ? AND createdAt <= ?').get(dayStart, dayEnd).count,
        users: sqlite.prepare('SELECT COUNT(*) as count FROM users WHERE createdAt > ? AND createdAt <= ?').get(dayStart, dayEnd).count
      });
    }

    return {
      totalUsers: sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count,
      totalYankis: sqlite.prepare('SELECT COUNT(*) as count FROM yankis').get().count,
      totalLikes: sqlite.prepare('SELECT COUNT(*) as count FROM likes').get().count,
      totalComments: sqlite.prepare('SELECT COUNT(*) as count FROM comments').get().count,
      newUsersToday: sqlite.prepare('SELECT COUNT(*) as count FROM users WHERE createdAt > ?').get(dayAgo).count,
      newYankisToday: sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE createdAt > ?').get(dayAgo).count,
      newUsersWeek: sqlite.prepare('SELECT COUNT(*) as count FROM users WHERE createdAt > ?').get(weekAgo).count,
      dailyActivity
    };
  },

  'admin/bots': () => {
    const bots = stmts.getBotUsers.all().map(b => {
      const pb = parseUser(b);
      return {
        ...pb, password: undefined,
        yankiCount: sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(b.id).count,
        likeCount: sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE userId = ?').get(b.id).count,
        commentCount: sqlite.prepare('SELECT COUNT(*) as count FROM comments WHERE userId = ?').get(b.id).count,
        followerCount: stmts.getFollowerCount.get(b.id).count
      };
    });
    return { bots, simulationRunning: botSimulationRunning };
  },

  'admin/feedback': () => ({ feedback: stmts.getAllFeedback.all() }),

  'admin/bot/toggle': (data) => {
    if (data.running) startBotAgents(); else stopBotAgents();
    return { success: true, running: botSimulationRunning };
  },

  'admin/bot/trigger': () => { botAgentTick(); return { success: true }; },

  // ═══ DRAFTS ═══
  'draft/save': (data) => {
    const draft = {
      id: genId(), userId: data.userId, text: data.text || '',
      image: data.image || null, poll: data.poll ? JSON.stringify(data.poll) : null,
      createdAt: new Date().toISOString()
    };
    stmts.insertDraft.run(draft);
    return { success: true, draft: { ...draft, poll: data.poll || null } };
  },

  'draft/list': (data) => {
    const drafts = stmts.getDraftsByUser.all(data.userId).map(d => ({ ...d, poll: d.poll ? JSON.parse(d.poll) : null }));
    return { drafts };
  },

  'draft/delete': (data) => {
    stmts.deleteDraft.run(data.draftId, data.userId);
    return { success: true };
  },

  // ═══ COLLECTIONS ═══
  'collections/get': (data) => {
    const collections = stmts.getCollectionsByUser.all(data.userId).map(c => ({
      ...c, itemCount: stmts.getCollectionItemCount.get(c.id).count
    }));
    return { collections };
  },

  'collection/create': (data) => {
    if (!data.name) return { error: 'Koleksiyon adı gerekli' };
    const col = { id: genId(), userId: data.userId, name: data.name, emoji: data.emoji || null, createdAt: new Date().toISOString() };
    stmts.insertCollection.run(col);
    return { success: true, collection: col };
  },

  'collection/delete': (data) => {
    stmts.deleteCollection.run(data.collectionId, data.userId);
    stmts.deleteCollectionItemsByCol.run(data.collectionId);
    return { success: true };
  },

  'collection/item-cols': (data) => {
    const collections = stmts.getCollectionsByUser.all(data.userId).map(c => ({
      ...c, hasItem: !!stmts.getCollectionItem.get(c.id, data.saveId)
    }));
    return { collections };
  },

  'collection/toggle-item': (data) => {
    const col = sqlite.prepare('SELECT * FROM collections WHERE id = ? AND userId = ?').get(data.collectionId, data.userId);
    if (!col) return { error: 'Koleksiyon bulunamadı' };
    const existing = stmts.getCollectionItem.get(data.collectionId, data.saveId);
    if (existing) {
      stmts.deleteCollectionItem.run(data.collectionId, data.saveId);
      return { success: true, added: false };
    }
    stmts.insertCollectionItem.run({ id: genId(), collectionId: data.collectionId, saveId: data.saveId, createdAt: new Date().toISOString() });
    return { success: true, added: true };
  },

  'save/note': (data) => {
    const save = sqlite.prepare('SELECT * FROM saves WHERE id = ? AND userId = ?').get(data.saveId, data.userId);
    if (!save) return { error: 'Kayıt bulunamadı' };
    sqlite.prepare('UPDATE saves SET note = ? WHERE id = ?').run(data.note || '', data.saveId);
    return { success: true };
  },

  'saves/bulk-delete': (data) => {
    if (!Array.isArray(data.saveIds)) return { error: 'saveIds gerekli' };
    const del = sqlite.transaction(() => {
      data.saveIds.forEach(sid => {
        sqlite.prepare('DELETE FROM saves WHERE id = ? AND userId = ?').run(sid, data.userId);
        sqlite.prepare('DELETE FROM collectionItems WHERE saveId = ?').run(sid);
      });
    });
    del();
    return { success: true, deletedCount: data.saveIds.length };
  },

  'yankis/saved': (data) => {
    const { userId, sortBy, collectionId, search } = data;
    let saves = stmts.getSavesByUser.all(userId);

    if (collectionId) {
      const colItems = stmts.getCollectionItems.all(collectionId).map(ci => ci.saveId);
      saves = saves.filter(s => colItems.includes(s.id));
    }

    let yankis = saves.map(s => {
      const yanki = parseYanki(stmts.getYankiById.get(s.yankiId));
      if (!yanki) return null;
      const enriched = enrichYanki(yanki, userId);
      if (!enriched) return null;
      return { ...enriched, saveId: s.id, savedAt: s.createdAt, note: s.note || '' };
    }).filter(Boolean);

    if (search) {
      const q = search.toLowerCase();
      yankis = yankis.filter(y => y.text.toLowerCase().includes(q));
    }

    if (sortBy === 'oldest') yankis.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
    else yankis.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    return { yankis };
  },

  // ═══ OTHER ═══
  'blocked': (data) => {
    const blockedIds = stmts.getBlocksByUser.all(data.userId).map(b => b.blockedId);
    const users = blockedIds.map(id => { const u = getUser(id); return u ? { ...u, password: undefined } : null; }).filter(Boolean);
    return { users };
  },

  'contact': (data) => {
    if (!data.subject || !data.message) return { error: 'Konu ve mesaj gerekli' };
    stmts.insertFeedback.run({ id: genId(), userId: data.userId || null, subject: data.subject, message: data.message, createdAt: new Date().toISOString() });
    return { success: true };
  },

  'patchnotes': () => {
    const rows = stmts.getAllPatchNotes.all();
    const patchNotes = rows.map(r => {
      const data = r.content ? JSON.parse(r.content) : {};
      return { version: r.version, date: data.date || '', features: data.features || [], fixes: data.fixes || [] };
    });
    return { patchNotes };
  },

  'explore': (data) => {
    const { viewerId } = data;
    const followingIds = viewerId ? stmts.getFollowing.all(viewerId).map(f => f.followingId) : [];
    const allUsers = stmts.getAllUsers.all().map(parseUser);
    const suggestedUsers = allUsers.filter(u => u.id !== viewerId && !followingIds.includes(u.id))
      .slice(0, 5).map(u => ({ ...u, password: undefined }));
    const trendResult = routes['trending']();
    const all = sqlite.prepare('SELECT * FROM yankis WHERE replyToId IS NULL').all();
    const trendingYankis = all.map(y => ({
      yanki: y,
      score: stmts.getLikeCount.get(y.id).count + stmts.getCommentCount.get(y.id).count * 2
    })).sort((a, b) => b.score - a.score).slice(0, 10)
      .map(item => enrichYanki(item.yanki, viewerId)).filter(Boolean);
    return { suggestedUsers, trends: trendResult.trends, trendingYankis };
  },

  'clan': (data) => {
    const user = getUser(data.userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    return { clan: null, available: [] };
  },

  'dna': (data) => {
    const { userId } = data;
    const user = getUser(userId);
    if (!user) return { error: 'Kullanıcı bulunamadı' };
    const yankiCount = sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(userId).count;
    const commentCount = sqlite.prepare('SELECT COUNT(*) as count FROM comments WHERE userId = ?').get(userId).count;
    const likeCount = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE userId = ?').get(userId).count;
    const followerCount = stmts.getFollowerCount.get(userId).count;
    return {
      dna: {
        activity: Math.min(100, yankiCount * 5),
        social: Math.min(100, (commentCount + likeCount) * 3),
        influence: Math.min(100, followerCount * 10),
        creativity: Math.min(100, yankiCount * 4),
        consistency: Math.min(100, 50)
      }
    };
  },

  // ═══ REACTIONS ═══
  'yanki/react': (data) => {
    const { yankiId, userId, emoji } = data;
    if (!emoji) return { error: 'Emoji gerekli' };
    const existing = stmts.getUserReaction.get(yankiId, userId, emoji);
    if (existing) {
      stmts.deleteReaction.run(existing.id);
    } else {
      stmts.insertReaction.run({ id: genId(), yankiId, userId, emoji, createdAt: new Date().toISOString() });
      const yanki = parseYanki(stmts.getYankiById.get(yankiId));
      if (yanki && yanki.userId !== userId) {
        stmts.insertNotification.run({ id: genId(), userId: yanki.userId, fromId: userId, type: 'reaction', yankiId, read: 0, createdAt: new Date().toISOString() });
      }
    }
    return { success: true, reactions: stmts.getReactionCounts.all(yankiId) };
  },

  // ═══ LIKERS ═══
  'yanki/likers': (data) => {
    const { yankiId } = data;
    const users = stmts.getLikersByYanki.all(yankiId).map(u => ({ ...u, verified: !!u.verified }));
    return { users };
  },

  // ═══ QUOTE YANKI ═══
  'yanki/quote': (data) => {
    const { yankiId, userId, text } = data;
    if (!text) return { error: 'Alıntı yorumu gerekli' };
    const original = parseYanki(stmts.getYankiById.get(yankiId));
    if (!original) return { error: 'Yankı bulunamadı' };
    const yanki = {
      id: genId(), userId, text, image: null, images: '[]', poll: null,
      replyToId: null, reyankiOfId: null, quoteOfId: yankiId, pinned: 0, editedAt: null,
      createdAt: new Date().toISOString()
    };
    stmts.insertYanki.run(yanki);
    if (original.userId !== userId) {
      stmts.insertNotification.run({ id: genId(), userId: original.userId, fromId: userId, type: 'quote', yankiId: yanki.id, read: 0, createdAt: new Date().toISOString() });
    }
    return { yanki: enrichYanki(yanki, userId) };
  },

  // ═══ EDIT YANKI ═══
  'yanki/edit': (data) => {
    const { yankiId, userId, text } = data;
    const yanki = parseYanki(stmts.getYankiById.get(yankiId));
    if (!yanki || yanki.userId !== userId) return { error: 'Yankı bulunamadı veya yetkiniz yok' };
    sqlite.prepare('UPDATE yankis SET text = ?, editedAt = ? WHERE id = ?').run(text, new Date().toISOString(), yankiId);
    return { yanki: enrichYanki(yankiId, userId) };
  },

  // ═══ PROFILE STATS / BADGES / FEATURED ═══
  'profile/stats': (data) => {
    const { userId } = data;
    const user = getUser(userId);
    const totalLikesReceived = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE yankiId IN (SELECT id FROM yankis WHERE userId = ?)').get(userId).count;
    const totalCommentsReceived = sqlite.prepare('SELECT COUNT(*) as count FROM comments WHERE yankiId IN (SELECT id FROM yankis WHERE userId = ?)').get(userId).count;
    const totalReyankis = sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE reyankiOfId IN (SELECT id FROM yankis WHERE userId = ?)').get(userId).count;
    const totalYankis = sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(userId).count;
    const joinedDaysAgo = Math.floor((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (1000*60*60*24));
    return { totalLikesReceived, totalCommentsReceived, totalReyankis, totalYankis, joinedDaysAgo };
  },

  'profile/badges': (data) => {
    const { userId } = data;
    const u = getUser(userId);
    if (!u) return { badges: [] };
    const yankiCount = sqlite.prepare('SELECT COUNT(*) as count FROM yankis WHERE userId = ? AND replyToId IS NULL').get(userId).count;
    const followerCount = stmts.getFollowerCount.get(userId).count;
    const totalLikes = sqlite.prepare('SELECT COUNT(*) as count FROM likes WHERE yankiId IN (SELECT id FROM yankis WHERE userId = ?)').get(userId).count;
    const badges = [];
    if (yankiCount >= 1) badges.push({ id: 'first_yanki', name: 'İlk Yankı', icon: '🐣', desc: 'İlk yankını attın!', color: '#4ade80' });
    if (yankiCount >= 10) badges.push({ id: 'yanki_10', name: 'Aktif', icon: '🐦', desc: '10 yankı attın!', color: '#60a5fa' });
    if (yankiCount >= 50) badges.push({ id: 'yanki_50', name: 'Usta', icon: '🦅', desc: '50 yankı attın!', color: '#a78bfa' });
    if (followerCount >= 5) badges.push({ id: 'followers_5', name: 'Sosyal', icon: '👥', desc: '5 takipçi!', color: '#fb923c' });
    if (followerCount >= 10) badges.push({ id: 'followers_10', name: 'Popüler', icon: '⭐', desc: '10 takipçi!', color: '#facc15' });
    if (followerCount >= 50) badges.push({ id: 'followers_50', name: 'Fenomen', icon: '🌟', desc: '50 takipçi!', color: '#f472b6' });
    if (totalLikes >= 10) badges.push({ id: 'likes_10', name: 'Beğenilen', icon: '❤️', desc: '10 beğeni!', color: '#f87171' });
    if (totalLikes >= 100) badges.push({ id: 'likes_100', name: 'Sevilen', icon: '💖', desc: '100 beğeni!', color: '#ec4899' });
    if (u.verified) badges.push({ id: 'verified', name: 'Onaylı', icon: '✅', desc: 'Hesap onaylandı!', color: '#34d399' });
    if (u.isAdmin) badges.push({ id: 'admin', name: 'Yönetici', icon: '🔧', desc: 'Platform yöneticisi', color: '#ef4444' });
    return { badges };
  },

  'profile/featured': (data) => {
    const { userId, viewerId } = data;
    // Önce kullanıcının elle seçtiği öne çıkan yankıları getir
    let yankis = sqlite.prepare('SELECT * FROM yankis WHERE userId = ? AND featured = 1 AND replyToId IS NULL ORDER BY createdAt DESC LIMIT 3').all(userId);
    // Yoksa en çok beğenilenleri göster
    if (!yankis.length) {
      yankis = sqlite.prepare('SELECT y.*, COUNT(l.id) as likeCount FROM yankis y LEFT JOIN likes l ON l.yankiId = y.id WHERE y.userId = ? AND y.replyToId IS NULL AND y.reyankiOfId IS NULL GROUP BY y.id ORDER BY likeCount DESC LIMIT 3').all(userId);
      yankis = yankis.filter(y => y.likeCount > 0);
    }
    const featured = yankis.map(y => enrichYanki(y, viewerId)).filter(Boolean);
    return { featured };
  }
};

// ─── Server ────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Static files
  if (req.method === 'GET') {
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
    };

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (!ext) {
      filePath = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
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
      try { data = JSON.parse(body || '{}'); } catch (e) {}
      const handler = routes[endpoint];
      if (handler) {
        try {
          const result = handler(data);
          if (result && typeof result.then === 'function') {
            result.then(r => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(r));
            }).catch(err => {
              console.error(`Error in ${endpoint}:`, err.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Sunucu hatası' }));
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          }
        } catch (err) {
          console.error(`Error in ${endpoint}:`, err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Sunucu hatası' }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🐦 Yankuş v3.5 (SQLite) running on port ${PORT}`);
  console.log(`📦 Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  stopBotAgents();
  sqlite.close();
  process.exit(0);
});
