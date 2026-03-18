// ═══════════════════════════════════════════════════════════════
// YANKI — Oluşturma, Listeleme, Beğeni, Kaydetme, Feed
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const { notify, checkLikeMilestone } = require('./notifications');

function enrichYanki(y, viewerId = null) {
  const likes = db.likes.filter(l => l.yankiId === y.id).length;
  const commentCount = db.comments.filter(c => c.yankiId === y.id && !c.deleted).length;
  const reyankiCount = db.yankis.filter(r => r.reyanki?.id === y.id && !r.deleted).length;
  const liked = viewerId ? db.likes.some(l => l.yankiId === y.id && l.userId === viewerId) : false;
  const saved = viewerId ? db.saves.some(s => s.yankiId === y.id && s.userId === viewerId) : false;

  let poll = null;
  if (y.pollId) {
    const p = db.polls.find(x => x.id === y.pollId);
    if (p) {
      const votes = db.pollVotes.filter(v => v.pollId === p.id);
      const myVote = viewerId ? votes.find(v => v.userId === viewerId)?.optionId : null;
      poll = {
        ...p,
        options: p.options.map(o => ({ ...o, votes: votes.filter(v => v.optionId === o.id).length })),
        totalVotes: votes.length,
        myVote,
        expired: Date.now() > new Date(p.createdAt).getTime() + p.duration * 3600000
      };
    }
  }

  return { ...y, likes, liked, saved, commentCount, reyankiCount, poll };
}

function createYanki(userId, text, image = null, poll = null, reyankiId = null, threadId = null, threadOrder = null) {
  if (!text && !image && !reyankiId) return { error: 'Yankı boş olamaz' };
  if (text && text.length > 500) return { error: 'Maksimum 500 karakter' };

  const user = db.users.find(u => u.id === userId);
  if (!user) return { error: 'Kullanıcı bulunamadı' };

  const yanki = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
    userId, username: user.username, displayName: user.displayName,
    profileImage: user.profileImage, verified: user.verified, isBot: user.isBot,
    text: text?.trim() || '', image, reyanki: null, pollId: null,
    threadId, threadOrder, deleted: false, createdAt: new Date().toISOString()
  };

  if (reyankiId) {
    const orig = db.yankis.find(y => y.id === reyankiId && !y.deleted);
    if (orig) {
      yanki.reyanki = {
        id: orig.id, userId: orig.userId, username: orig.username,
        displayName: orig.displayName, profileImage: orig.profileImage,
        verified: orig.verified, text: orig.text, image: orig.image
      };
      if (orig.userId !== userId) notify(orig.userId, 'reyanki', { fromUserId: userId, yankiId: yanki.id });
    }
  }

  if (poll?.options?.length >= 2) {
    const p = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_poll',
      yankiId: yanki.id,
      options: poll.options.map((o, i) => ({ id: i.toString(), text: o })),
      duration: poll.duration || 24,
      createdAt: new Date().toISOString()
    };
    db.polls.push(p);
    yanki.pollId = p.id;
  }

  db.yankis.unshift(yanki);

  (text?.match(/@[\w]+/g) || []).forEach(m => {
    const mentioned = db.users.find(u => u.username === m.substring(1).toLowerCase());
    if (mentioned && mentioned.id !== userId) notify(mentioned.id, 'mention', { fromUserId: userId, yankiId: yanki.id });
  });

  return { success: true, yanki };
}

function getYanki(yankiId, viewerId = null) {
  const { isBlocked } = require('./users');
  const y = db.yankis.find(x => x.id === yankiId && !x.deleted);
  if (!y) return { error: 'Yankı bulunamadı' };
  if (viewerId && isBlocked(y.userId, viewerId)) return { error: 'Engellenmiş' };

  const enriched = enrichYanki(y, viewerId);
  const comments = db.comments.filter(c => c.yankiId === yankiId && !c.deleted && !c.replyToId);
  enriched.comments = comments.map(c => ({
    ...c,
    replies: db.comments.filter(r => r.replyToId === c.id && !r.deleted)
  }));
  return enriched;
}

function getYankis(userId, viewerId, limit = 20) {
  const blockedIds = viewerId
    ? db.blocks.filter(b => b.blockerId === viewerId || b.blockedId === viewerId)
        .map(b => b.blockerId === viewerId ? b.blockedId : b.blockerId)
    : [];

  let yankis = db.yankis.filter(y => !y.deleted && !blockedIds.includes(y.userId));
  if (userId) {
    yankis = yankis.filter(y => y.userId === userId);
    const user = db.users.find(u => u.id === userId);
    if (user?.pinnedYankiId) {
      const idx = yankis.findIndex(y => y.id === user.pinnedYankiId);
      if (idx > 0) { const [p] = yankis.splice(idx, 1); p.pinned = true; yankis.unshift(p); }
    }
  }
  return yankis.slice(0, limit).map(y => enrichYanki(y, viewerId));
}

function getFeed(userId, limit = 50, algo = 'chrono') {
  const followIds = db.follows.filter(f => f.followerId === userId).map(f => f.followingId);
  followIds.push(userId);
  const blockedIds = db.blocks
    .filter(b => b.blockerId === userId || b.blockedId === userId)
    .map(b => b.blockerId === userId ? b.blockedId : b.blockerId);

  let yankis = db.yankis
    .filter(y => !y.deleted && followIds.includes(y.userId) && !blockedIds.includes(y.userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (algo === 'smart') {
    const now = Date.now();
    yankis = yankis.map(y => {
      const ageSecs = Math.max((now - new Date(y.createdAt).getTime()) / 1000, 1);
      const likes = db.likes.filter(l => l.yankiId === y.id).length;
      const comments = db.comments.filter(c => c.yankiId === y.id && !c.deleted).length;
      const reyanks = db.yankis.filter(r => r.reyanki && r.reyanki.id === y.id && !r.deleted).length;
      const score = (likes * 2 + comments * 3 + reyanks * 2.5) / Math.pow(ageSecs / 3600 + 2, 1.4);
      return { ...y, _score: score };
    }).sort((a, b) => b._score - a._score);
  } else if (algo === 'explore') {
    const allBlockedIds = db.blocks
      .filter(b => b.blockerId === userId || b.blockedId === userId)
      .map(b => b.blockerId === userId ? b.blockedId : b.blockerId);
    return db.yankis
      .filter(y => !y.deleted && !allBlockedIds.includes(y.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map(y => enrichYanki(y, userId));
  } else if (algo === 'media') {
    yankis = yankis.filter(y => y.image);
  }

  return yankis.slice(0, limit).map(y => enrichYanki(y, userId));
}

function likeYanki(userId, yankiId) {
  const y = db.yankis.find(x => x.id === yankiId && !x.deleted);
  if (!y) return { error: 'Yankı bulunamadı' };

  const exists = db.likes.find(l => l.userId === userId && l.yankiId === yankiId);
  if (exists) {
    db.likes = db.likes.filter(l => !(l.userId === userId && l.yankiId === yankiId));
    return { success: true, liked: false, count: db.likes.filter(l => l.yankiId === yankiId).length };
  }
  db.likes.push({ userId, yankiId, createdAt: new Date().toISOString() });
  if (y.userId !== userId) notify(y.userId, 'like', { fromUserId: userId, yankiId });
  checkLikeMilestone(yankiId);
  return { success: true, liked: true, count: db.likes.filter(l => l.yankiId === yankiId).length };
}

function saveYanki(userId, yankiId) {
  const exists = db.saves.find(s => s.userId === userId && s.yankiId === yankiId);
  if (exists) {
    db.saves = db.saves.filter(s => !(s.userId === userId && s.yankiId === yankiId));
    db.saveNotes = db.saveNotes.filter(n => !(n.userId === userId && n.yankiId === yankiId));
    const userColIds = db.collections.filter(c => c.userId === userId).map(c => c.id);
    db.collectionItems = db.collectionItems.filter(i => !(userColIds.includes(i.collectionId) && i.yankiId === yankiId));
    return { success: true, saved: false };
  }
  db.saves.push({ userId, yankiId, createdAt: new Date().toISOString() });
  return { success: true, saved: true };
}

function getSavedYankis(userId, sortBy = 'newest', collectionId = null, search = '') {
  let saveRecords = db.saves.filter(s => s.userId === userId);

  if (collectionId && collectionId !== 'all') {
    const inCol = new Set(db.collectionItems.filter(i => i.collectionId === collectionId).map(i => i.yankiId));
    saveRecords = saveRecords.filter(s => inCol.has(s.yankiId));
  }

  let result = saveRecords.map(s => {
    const y = db.yankis.find(x => x.id === s.yankiId && !x.deleted);
    if (!y) return null;
    const noteRec = db.saveNotes.find(n => n.userId === userId && n.yankiId === s.yankiId);
    const enriched = enrichYanki(y, userId);
    return { ...enriched, savedAt: s.createdAt, saveNote: noteRec?.note || '' };
  }).filter(Boolean);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(y =>
      (y.text || '').toLowerCase().includes(q) ||
      (y.displayName || '').toLowerCase().includes(q) ||
      (y.username || '').toLowerCase().includes(q) ||
      (y.saveNote || '').toLowerCase().includes(q)
    );
  }

  if (sortBy === 'newest')             result.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  else if (sortBy === 'oldest')        result.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
  else if (sortBy === 'mostLiked')     result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  else if (sortBy === 'mostCommented') result.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));

  return result;
}

function deleteYanki(userId, yankiId) {
  const y = db.yankis.find(x => x.id === yankiId);
  if (!y) return { error: 'Yankı bulunamadı' };
  if (y.userId !== userId) return { error: 'Yetki yok' };
  y.deleted = true;
  return { success: true };
}

function pinYanki(userId, yankiId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return { error: 'Kullanıcı bulunamadı' };
  const y = db.yankis.find(x => x.id === yankiId && x.userId === userId && !x.deleted);
  if (!y) return { error: 'Yankı bulunamadı' };

  if (user.pinnedYankiId === yankiId) { user.pinnedYankiId = null; return { success: true, pinned: false }; }
  user.pinnedYankiId = yankiId;
  return { success: true, pinned: true };
}

function votePoll(userId, pollId, optionId) {
  const poll = db.polls.find(p => p.id === pollId);
  if (!poll) return { error: 'Anket bulunamadı' };
  if (Date.now() > new Date(poll.createdAt).getTime() + poll.duration * 3600000) return { error: 'Süre dolmuş' };
  if (db.pollVotes.find(v => v.pollId === pollId && v.userId === userId)) return { error: 'Zaten oy kullandınız' };
  if (!poll.options.find(o => o.id === optionId)) return { error: 'Geçersiz seçenek' };

  db.pollVotes.push({ pollId, userId, optionId, createdAt: new Date().toISOString() });
  return { success: true };
}

function addComment(userId, yankiId, text, replyToId = null) {
  if (!text?.trim()) return { error: 'Yorum boş olamaz' };
  if (text.length > 500) return { error: 'Maksimum 500 karakter' };

  const user = db.users.find(u => u.id === userId);
  const yanki = db.yankis.find(y => y.id === yankiId && !y.deleted);
  if (!user || !yanki) return { error: 'Bulunamadı' };

  const comment = {
    id: Date.now().toString(), yankiId, userId,
    username: user.username, displayName: user.displayName,
    profileImage: user.profileImage, verified: user.verified, isBot: user.isBot,
    text: text.trim(), replyToId, deleted: false, createdAt: new Date().toISOString()
  };
  db.comments.push(comment);

  if (yanki.userId !== userId) notify(yanki.userId, 'comment', { fromUserId: userId, yankiId, commentId: comment.id });
  if (replyToId) {
    const parent = db.comments.find(c => c.id === replyToId);
    if (parent && parent.userId !== userId) notify(parent.userId, 'reply', { fromUserId: userId, yankiId, commentId: comment.id });
  }

  return { success: true, comment };
}

function getComments(yankiId) {
  const comments = db.comments.filter(c => c.yankiId === yankiId && !c.deleted && !c.replyToId);
  return comments.map(c => ({
    ...c,
    replies: db.comments.filter(r => r.replyToId === c.id && !r.deleted)
  }));
}

// ─── Koleksiyonlar ───────────────────────────────────────────
function getCollections(userId) {
  return db.collections
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(c => ({ ...c, count: db.collectionItems.filter(i => i.collectionId === c.id).length }));
}

function createCollection(userId, name, emoji) {
  if (!name?.trim()) return { error: 'Koleksiyon adı boş olamaz' };
  const duplicate = db.collections.find(c => c.userId === userId && c.name.toLowerCase() === name.trim().toLowerCase());
  if (duplicate) return { error: 'Bu isimde bir koleksiyon zaten var' };
  const id = 'col_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  db.collections.push({ id, userId, name: name.trim(), emoji: emoji || '🔖', createdAt: new Date().toISOString() });
  return { success: true, id };
}

function renameCollection(userId, collectionId, name, emoji) {
  const col = db.collections.find(c => c.id === collectionId && c.userId === userId);
  if (!col) return { error: 'Koleksiyon bulunamadı' };
  if (name) col.name = name.trim();
  if (emoji) col.emoji = emoji;
  return { success: true };
}

function deleteCollection(userId, collectionId) {
  const col = db.collections.find(c => c.id === collectionId && c.userId === userId);
  if (!col) return { error: 'Bulunamadı' };
  db.collections = db.collections.filter(c => c.id !== collectionId);
  db.collectionItems = db.collectionItems.filter(i => i.collectionId !== collectionId);
  return { success: true };
}

function toggleCollectionItem(userId, collectionId, yankiId) {
  const col = db.collections.find(c => c.id === collectionId && c.userId === userId);
  if (!col) return { error: 'Koleksiyon bulunamadı' };
  if (!db.saves.find(s => s.userId === userId && s.yankiId === yankiId)) return { error: 'Önce yankıyı kaydet' };
  const exists = db.collectionItems.find(i => i.collectionId === collectionId && i.yankiId === yankiId);
  if (exists) {
    db.collectionItems = db.collectionItems.filter(i => !(i.collectionId === collectionId && i.yankiId === yankiId));
    return { success: true, added: false };
  }
  db.collectionItems.push({ collectionId, yankiId, addedAt: new Date().toISOString() });
  return { success: true, added: true };
}

function getItemCollectionIds(userId, yankiId) {
  const userColIds = new Set(db.collections.filter(c => c.userId === userId).map(c => c.id));
  return db.collectionItems.filter(i => userColIds.has(i.collectionId) && i.yankiId === yankiId).map(i => i.collectionId);
}

function setSaveNote(userId, yankiId, note) {
  if (!db.saves.find(s => s.userId === userId && s.yankiId === yankiId)) return { error: 'Önce yankıyı kaydet' };
  const existing = db.saveNotes.find(n => n.userId === userId && n.yankiId === yankiId);
  if (existing) {
    existing.note = note || '';
    existing.updatedAt = new Date().toISOString();
  } else {
    db.saveNotes.push({ userId, yankiId, note: note || '', updatedAt: new Date().toISOString() });
  }
  return { success: true };
}

function bulkUnsave(userId, yankiIds) {
  if (!Array.isArray(yankiIds) || !yankiIds.length) return { error: 'Seçim yok' };
  const userColIds = new Set(db.collections.filter(c => c.userId === userId).map(c => c.id));
  const toRemove = new Set(yankiIds);
  db.saves = db.saves.filter(s => !(s.userId === userId && toRemove.has(s.yankiId)));
  db.saveNotes = db.saveNotes.filter(n => !(n.userId === userId && toRemove.has(n.yankiId)));
  db.collectionItems = db.collectionItems.filter(i => !(userColIds.has(i.collectionId) && toRemove.has(i.yankiId)));
  return { success: true, removed: yankiIds.length };
}

// ─── Thread ───────────────────────────────────────────────────
function createThread(userId, items) {
  if (!Array.isArray(items) || items.length < 2) return { error: 'Thread en az 2 yankı içermeli' };
  if (items.length > 10) return { error: 'Maksimum 10 yankı' };
  const threadId = 'th_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const yankiIds = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.text?.trim() && !item.image) continue;
    const r = createYanki(userId, item.text || '', item.image || null, null, null, threadId, i);
    if (r.error) return r;
    yankiIds.push(r.yanki.id);
  }
  if (yankiIds.length < 2) return { error: 'Thread için geçerli en az 2 içerik gerekli' };
  db.threads.push({ id: threadId, yankiIds, createdAt: new Date().toISOString() });
  return { success: true, threadId, count: yankiIds.length };
}

// ─── Taslak ───────────────────────────────────────────────────
function saveDraftFn(userId, text, image, poll, threadItems) {
  const id = 'dr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  db.drafts.push({ id, userId, text: text || '', image: image || null, poll: poll || null, threadItems: threadItems || null, savedAt: new Date().toISOString() });
  const userDrafts = db.drafts.filter(d => d.userId === userId);
  if (userDrafts.length > 20) {
    const oldest = userDrafts.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt))[0];
    db.drafts = db.drafts.filter(d => d.id !== oldest.id);
  }
  return { success: true, id };
}

function getDrafts(userId) {
  return db.drafts.filter(d => d.userId === userId).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

function deleteDraft(userId, draftId) {
  const before = db.drafts.length;
  db.drafts = db.drafts.filter(d => !(d.id === draftId && d.userId === userId));
  return { success: db.drafts.length < before };
}

// ─── Zamanlı Gönderim ─────────────────────────────────────────
function scheduleYankiFn(userId, text, image, poll, threadItems, scheduledAt) {
  if (!scheduledAt) return { error: 'Tarih gerekli' };
  if (new Date(scheduledAt) <= new Date()) return { error: 'Geçmiş tarih seçilemez' };
  const id = 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  db.scheduled.push({ id, userId, text: text || '', image: image || null, poll: poll || null, threadItems: threadItems || null, scheduledAt, createdAt: new Date().toISOString() });
  return { success: true, id, scheduledAt };
}

function getScheduled(userId) {
  return db.scheduled.filter(s => s.userId === userId).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

function cancelScheduled(userId, schedId) {
  db.scheduled = db.scheduled.filter(s => !(s.id === schedId && s.userId === userId));
  return { success: true };
}

function processScheduled() {
  const now = new Date();
  const ready = db.scheduled.filter(s => new Date(s.scheduledAt) <= now);
  ready.forEach(s => {
    if (s.threadItems && s.threadItems.length >= 2) {
      createThread(s.userId, s.threadItems);
    } else {
      createYanki(s.userId, s.text, s.image, s.poll);
    }
    db.scheduled = db.scheduled.filter(x => x.id !== s.id);
  });
}

// ─── Arama ────────────────────────────────────────────────────
function search(query, type, viewerId) {
  const q = query.toLowerCase().trim();
  const blockedIds = viewerId
    ? db.blocks.filter(b => b.blockerId === viewerId || b.blockedId === viewerId)
        .map(b => b.blockerId === viewerId ? b.blockedId : b.blockerId)
    : [];
  const results = { users: [], yankis: [], hashtags: [] };

  if (type === 'all' || type === 'users') {
    const term = q.replace('@', '');
    results.users = db.users
      .filter(u => !blockedIds.includes(u.id) && (u.username.includes(term) || u.displayName.toLowerCase().includes(term)))
      .slice(0, 10)
      .map(u => ({ id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage, verified: u.verified, isBot: u.isBot }));
  }

  if (type === 'all' || type === 'yankis') {
    results.yankis = db.yankis
      .filter(y => !y.deleted && !blockedIds.includes(y.userId) && y.text.toLowerCase().includes(q))
      .slice(0, 20)
      .map(y => enrichYanki(y, viewerId));
  }

  if (type === 'all' || type === 'hashtags') {
    const hashtags = {};
    db.yankis.filter(y => !y.deleted).forEach(y => {
      (y.text.match(/#[\wğüşıöçĞÜŞİÖÇ]+/gi) || []).forEach(tag => {
        if (tag.toLowerCase().includes(q.replace('#', '')))
          hashtags[tag.toLowerCase()] = (hashtags[tag.toLowerCase()] || 0) + 1;
      });
    });
    results.hashtags = Object.entries(hashtags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
  }

  return results;
}

function getHashtagYankis(hashtag, viewerId, limit = 50) {
  const tag = (hashtag.startsWith('#') ? hashtag : '#' + hashtag).toLowerCase();
  const blockedIds = viewerId
    ? db.blocks.filter(b => b.blockerId === viewerId || b.blockedId === viewerId)
        .map(b => b.blockerId === viewerId ? b.blockedId : b.blockerId)
    : [];
  return db.yankis.filter(y => !y.deleted && !blockedIds.includes(y.userId) && y.text.toLowerCase().includes(tag)).slice(0, limit).map(y => enrichYanki(y, viewerId));
}

function getHashtagInfo(hashtag) {
  const tag = (hashtag.startsWith('#') ? hashtag : '#' + hashtag).toLowerCase();
  const yankis = db.yankis.filter(y => !y.deleted && y.text.toLowerCase().includes(tag));
  const uniqueUsers = [...new Set(yankis.map(y => y.userId))].length;
  const last24h = yankis.filter(y => Date.now() - new Date(y.createdAt).getTime() < 86400000).length;
  return { hashtag: tag, totalYankis: yankis.length, uniqueUsers, last24h, trending: last24h >= 3 };
}

module.exports = {
  enrichYanki, createYanki, getYanki, getYankis, getFeed,
  likeYanki, saveYanki, getSavedYankis, deleteYanki, pinYanki,
  votePoll, addComment, getComments,
  getCollections, createCollection, renameCollection, deleteCollection,
  toggleCollectionItem, getItemCollectionIds, setSaveNote, bulkUnsave,
  createThread, saveDraftFn, getDrafts, deleteDraft,
  scheduleYankiFn, getScheduled, cancelScheduled, processScheduled,
  search, getHashtagYankis, getHashtagInfo
};
