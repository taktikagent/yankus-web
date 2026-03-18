// ═══════════════════════════════════════════════════════════════
// BİLDİRİMLER — Oluşturma, Okuma, Milestone, Trend
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');

const LIKE_MILESTONES = [10, 50, 100, 250, 500, 1000];

const NF_CATEGORY = {
  all:       null,
  likes:     ['like', 'milestone_like'],
  followers: ['follow'],
  comments:  ['comment', 'reply', 'mention'],
  special:   ['milestone_like', 'trending', 'dm'],
};

function notify(userId, type, data) {
  if (['like', 'follow'].includes(type)) {
    const recent = db.notifications.find(n =>
      n.userId === userId && n.type === type &&
      n.data.fromUserId === data.fromUserId &&
      Date.now() - new Date(n.createdAt).getTime() < 60000
    );
    if (recent) return;
  }

  db.notifications.unshift({
    id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    userId, type, data, read: false,
    createdAt: new Date().toISOString()
  });

  if (db.notifications.length > 200) {
    db.notifications = db.notifications.slice(0, 200);
  }
}

function checkLikeMilestone(yankiId) {
  const y = db.yankis.find(x => x.id === yankiId);
  if (!y) return;
  const count = db.likes.filter(l => l.yankiId === yankiId).length;
  if (!LIKE_MILESTONES.includes(count)) return;
  const already = db.notifications.find(n =>
    n.userId === y.userId && n.type === 'milestone_like' &&
    n.data.yankiId === yankiId && n.data.count === count
  );
  if (already) return;
  notify(y.userId, 'milestone_like', { yankiId, count, text: (y.text || '').slice(0, 60) });
}

function checkTrendingNotify(userId, topTagSet) {
  const userYankis = db.yankis.filter(y => y.userId === userId && !y.deleted);
  userYankis.forEach(y => {
    const tags = (y.text.match(/#[\wğüşıöçĞÜŞİÖÇ]+/gi) || []).map(t => t.toLowerCase());
    if (!tags.some(t => topTagSet.has(t))) return;
    const already = db.notifications.find(n =>
      n.userId === userId && n.type === 'trending' &&
      n.data.yankiId === y.id &&
      Date.now() - new Date(n.createdAt).getTime() < 3600000
    );
    if (already) return;
    notify(userId, 'trending', { yankiId: y.id, text: (y.text || '').slice(0, 60) });
  });
}

function getNotifications(userId, filter, onlyUnread) {
  const blockedIds = db.blocks.filter(b => b.blockerId === userId).map(b => b.blockedId);
  const allowed = NF_CATEGORY[filter] || null;

  return db.notifications
    .filter(n => {
      if (n.userId !== userId) return false;
      if (n.data.fromUserId && blockedIds.includes(n.data.fromUserId)) return false;
      if (allowed && !allowed.includes(n.type)) return false;
      if (onlyUnread && n.read) return false;
      return true;
    })
    .slice(0, 80)
    .map(n => {
      const fromUser = n.data.fromUserId ? db.users.find(u => u.id === n.data.fromUserId) : null;
      return {
        ...n,
        fromUser: fromUser ? {
          id: fromUser.id, username: fromUser.username,
          displayName: fromUser.displayName, profileImage: fromUser.profileImage,
          verified: fromUser.verified, isBot: fromUser.isBot
        } : null
      };
    });
}

function markRead(userId) {
  db.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
  return { success: true };
}

function markOneRead(userId, notifId) {
  const n = db.notifications.find(x => x.id === notifId && x.userId === userId);
  if (n) n.read = true;
  return { success: true };
}

function clearNotifications(userId) {
  db.notifications = db.notifications.filter(n => n.userId !== userId);
  return { success: true };
}

function unreadCount(userId) {
  return db.notifications.filter(n => n.userId === userId && !n.read).length;
}

module.exports = {
  notify, checkLikeMilestone, checkTrendingNotify,
  getNotifications, markRead, markOneRead, clearNotifications, unreadCount
};
