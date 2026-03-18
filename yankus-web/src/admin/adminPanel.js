// ═══════════════════════════════════════════════════════════════
// ADMİN PANELİ — Kullanıcı & İçerik Yönetimi, Analitik
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const { isRunning } = require('../bots/botSimulation');

function getAdminStats() {
  const realUsers    = db.users.filter(u => !u.isBot && !u.isAdmin);
  const botUsers     = db.users.filter(u => u.isBot);
  const activeYankis = db.yankis.filter(y => !y.deleted);
  const last24h      = Date.now() - 86400000;

  return {
    totalUsers:     realUsers.length,
    totalBots:      botUsers.length,
    totalYankis:    activeYankis.length,
    totalComments:  db.comments.filter(c => !c.deleted).length,
    totalLikes:     db.likes.length,
    totalFollows:   db.follows.length,
    totalMessages:  db.messages.length,
    yankisToday:    activeYankis.filter(y => new Date(y.createdAt).getTime() > last24h).length,
    feedbackCount:  db.feedback.filter(f => !f.read).length,
    botSimulationRunning: isRunning()
  };
}

function getBotList() {
  return db.users.filter(u => u.isBot).map(b => ({
    id: b.id, username: b.username, displayName: b.displayName,
    bio: b.bio, verified: b.verified, personality: b.personality,
    yankiCount:    db.yankis.filter(y => y.userId === b.id && !y.deleted).length,
    followerCount: db.follows.filter(f => f.followingId === b.id).length
  }));
}

function getFeedback() {
  return db.feedback.map(f => {
    const from = db.users.find(u => u.id === f.fromUserId);
    return {
      ...f,
      fromUser: from ? { id: from.id, username: from.username, displayName: from.displayName, isBot: from.isBot, personality: from.personality } : null
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function markFeedbackRead(feedbackId) {
  const fb = db.feedback.find(f => f.id === feedbackId);
  if (fb) fb.read = true;
  return { success: true };
}

// ─── Kullanıcı Yönetimi ───────────────────────────────────────
function adminGetUsers(filter = 'all', search = '') {
  let users = db.users.filter(u => !u.isAdmin);
  if (filter === 'bot')    users = users.filter(u => u.isBot);
  if (filter === 'normal') users = users.filter(u => !u.isBot);
  if (filter === 'banned') users = users.filter(u => u.banned);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    );
  }
  return users.map(u => ({
    id: u.id, username: u.username, displayName: u.displayName,
    profileImage: u.profileImage || null,
    isBot: !!u.isBot, isAdmin: !!u.isAdmin, banned: !!u.banned, verified: !!u.verified,
    personality: u.personality || null, createdAt: u.createdAt,
    yankiCount:    db.yankis.filter(y => y.userId === u.id && !y.deleted).length,
    followerCount: db.follows.filter(f => f.followingId === u.id).length,
    followingCount:db.follows.filter(f => f.followerId  === u.id).length,
    likeCount:     db.likes.filter(l => l.userId === u.id).length,
    commentCount:  db.comments.filter(cm => cm.userId === u.id && !cm.deleted).length,
  }));
}

function adminGetUserDetail(targetId) {
  const u = db.users.find(x => x.id === targetId);
  if (!u) return { error: 'Kullanıcı bulunamadı' };

  const yankis = db.yankis.filter(y => y.userId === targetId && !y.deleted)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map(y => ({
      id: y.id, text: (y.text || '').slice(0, 120), createdAt: y.createdAt,
      likes:    db.likes.filter(l => l.yankiId === y.id).length,
      comments: db.comments.filter(c => c.yankiId === y.id && !c.deleted).length,
    }));

  return {
    id: u.id, username: u.username, displayName: u.displayName,
    bio: u.bio || '', profileImage: u.profileImage || null,
    isBot: !!u.isBot, banned: !!u.banned, verified: !!u.verified,
    createdAt: u.createdAt, personality: u.personality || null,
    yankiCount:    db.yankis.filter(y => y.userId === targetId && !y.deleted).length,
    followerCount: db.follows.filter(f => f.followingId === targetId).length,
    followingCount:db.follows.filter(f => f.followerId  === targetId).length,
    likeCount:     db.likes.filter(l => l.userId === targetId).length,
    messageCount:  db.messages.filter(m => m.fromUserId === targetId).length,
    yankis
  };
}

function adminBanUser(targetId, ban = true) {
  const u = db.users.find(x => x.id === targetId);
  if (!u) return { error: 'Kullanıcı bulunamadı' };
  if (u.isAdmin) return { error: 'Admin banlanamaz' };
  u.banned = ban;
  return { success: true, banned: ban };
}

function adminDeleteUser(targetId) {
  const u = db.users.find(x => x.id === targetId);
  if (!u) return { error: 'Bulunamadı' };
  if (u.isAdmin) return { error: 'Admin silinemez' };
  db.users     = db.users.filter(x => x.id !== targetId);
  db.yankis    = db.yankis.filter(y => y.userId !== targetId);
  db.comments  = db.comments.filter(c => c.userId !== targetId);
  db.likes     = db.likes.filter(l => l.userId !== targetId);
  db.follows   = db.follows.filter(f => f.followerId !== targetId && f.followingId !== targetId);
  db.messages  = db.messages.filter(m => m.fromUserId !== targetId && m.toUserId !== targetId);
  return { success: true };
}

function adminMakeAdmin(targetId, makeAdmin = true) {
  const u = db.users.find(x => x.id === targetId);
  if (!u) return { error: 'Bulunamadı' };
  if (u.isBot) return { error: 'Bot admin yapılamaz' };
  u.isAdmin = makeAdmin;
  return { success: true };
}

// ─── İçerik Moderasyonu ──────────────────────────────────────
function adminGetRecentYankis(limit = 30, search = '') {
  let yankis = db.yankis.filter(y => !y.deleted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    yankis = yankis.filter(y => (y.text || '').toLowerCase().includes(q));
  }
  return yankis.slice(0, limit).map(y => {
    const author = db.users.find(u => u.id === y.userId);
    return {
      id: y.id, text: (y.text || '').slice(0, 200), createdAt: y.createdAt, hasImage: !!y.image,
      likes:    db.likes.filter(l => l.yankiId === y.id).length,
      comments: db.comments.filter(c => c.yankiId === y.id && !c.deleted).length,
      authorId: author?.id || null, authorName: author?.displayName || 'Bilinmiyor',
      authorUsername: author?.username || '', authorIsBot: !!author?.isBot,
      reported: !!(y.reportCount && y.reportCount > 0), reportCount: y.reportCount || 0,
    };
  });
}

function adminDeleteYanki(yankiId) {
  const y = db.yankis.find(x => x.id === yankiId);
  if (!y) return { error: 'Yankı bulunamadı' };
  y.deleted = true;
  return { success: true };
}

function adminBulkDeleteYankis(yankiIds) {
  if (!Array.isArray(yankiIds) || !yankiIds.length) return { error: 'Seçim yok' };
  let count = 0;
  yankiIds.forEach(id => {
    const y = db.yankis.find(x => x.id === id);
    if (y && !y.deleted) { y.deleted = true; count++; }
  });
  return { success: true, deleted: count };
}

function adminGetReports() {
  return db.yankis
    .filter(y => !y.deleted && y.reportCount > 0)
    .sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
    .slice(0, 50)
    .map(y => {
      const author = db.users.find(u => u.id === y.userId);
      return {
        id: y.id, text: (y.text || '').slice(0, 200), createdAt: y.createdAt,
        reportCount: y.reportCount || 0,
        authorName: author?.displayName || 'Bilinmiyor',
        authorUsername: author?.username || '', authorIsBot: !!author?.isBot,
      };
    });
}

function adminReportYanki(yankiId, reporterId) {
  const y = db.yankis.find(x => x.id === yankiId);
  if (!y) return { error: 'Yankı bulunamadı' };
  if (!y.reportedBy) y.reportedBy = [];
  if (y.reportedBy.includes(reporterId)) return { error: 'Zaten şikayet edildi' };
  y.reportedBy.push(reporterId);
  y.reportCount = y.reportedBy.length;
  return { success: true };
}

// ─── Analitik ─────────────────────────────────────────────────
function adminGetAnalytics() {
  const now = Date.now();
  const hourMs = 3600000;

  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const sliceEnd   = now - i * hourMs;
    const sliceStart = sliceEnd - hourMs;
    const label = new Date(sliceEnd).getHours() + ':00';
    return {
      label,
      yankis:   db.yankis.filter(y => { const t = new Date(y.createdAt).getTime(); return t >= sliceStart && t < sliceEnd; }).length,
      comments: db.comments.filter(c => { const t = new Date(c.createdAt).getTime(); return t >= sliceStart && t < sliceEnd; }).length,
      likes:    db.likes.filter(l => { const t = new Date(l.createdAt).getTime(); return t >= sliceStart && t < sliceEnd; }).length,
    };
  }).reverse();

  const userActivity = db.users.filter(u => !u.isAdmin).map(u => {
    const yankis   = db.yankis.filter(y => y.userId === u.id && !y.deleted).length;
    const comments = db.comments.filter(c => c.userId === u.id && !c.deleted).length;
    const likes    = db.likes.filter(l => l.userId === u.id).length;
    const score    = yankis * 3 + comments * 2 + likes;
    return { id: u.id, displayName: u.displayName, username: u.username, isBot: !!u.isBot, yankis, comments, likes, score };
  }).sort((a, b) => b.score - a.score).slice(0, 10);

  const totalUsers = db.users.filter(u => !u.isAdmin).length;
  const dayAgo     = now - 86400000;
  const activeIds  = new Set([
    ...db.yankis.filter(y => new Date(y.createdAt).getTime() > dayAgo).map(y => y.userId),
    ...db.comments.filter(c => new Date(c.createdAt).getTime() > dayAgo).map(c => c.userId),
    ...db.likes.filter(l => new Date(l.createdAt).getTime() > dayAgo).map(l => l.userId),
  ]);
  const activeToday      = activeIds.size;
  const engagementRate   = totalUsers > 0 ? Math.round((activeToday / totalUsers) * 100) : 0;
  const contentVelocity  = hourlyActivity.slice(18).reduce((s, h) => s + h.yankis, 0);
  const bannedCount      = db.users.filter(u => u.banned).length;
  const reportedCount    = db.yankis.filter(y => !y.deleted && y.reportCount > 0).length;
  const healthScore      = Math.max(0, Math.min(100,
    40 + engagementRate * 0.4 + Math.min(contentVelocity * 2, 20) - bannedCount * 2 - reportedCount * 3
  ));
  const botCount  = db.users.filter(u => u.isBot).length;
  const realCount = db.users.filter(u => !u.isBot && !u.isAdmin).length;

  return {
    hourlyActivity, userActivity,
    healthScore: Math.round(healthScore), engagementRate,
    activeToday, totalUsers, botCount, realCount,
    bannedCount, reportedCount, botSimRunning: isRunning()
  };
}

module.exports = {
  getAdminStats, getBotList, getFeedback, markFeedbackRead,
  adminGetUsers, adminGetUserDetail, adminBanUser, adminDeleteUser, adminMakeAdmin,
  adminGetRecentYankis, adminDeleteYanki, adminBulkDeleteYankis,
  adminGetReports, adminReportYanki, adminGetAnalytics
};
