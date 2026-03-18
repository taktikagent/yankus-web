// ═══════════════════════════════════════════════════════════════
// MESAJLAŞMA SİSTEMİ — DM, Tepkiler, Konuşmalar
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');

function sendMessage(fromId, toId, text, replyTo = null, image = null) {
  if (!text?.trim() && !image) return { error: 'Mesaj boş olamaz' };
  if (db.blocks.some(b =>
    (b.blockerId === toId && b.blockedId === fromId) ||
    (b.blockerId === fromId && b.blockedId === toId)
  )) return { error: 'Bu kullanıcıyla mesajlaşamazsınız' };

  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    fromUserId: fromId,
    toUserId: toId,
    text: text?.trim() || '',
    image: image || null,
    replyTo: replyTo || null,
    reactions: {},
    deleted: false,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.messages.push(msg);

  const fromUser = db.users.find(u => u.id === fromId);
  if (fromUser && !fromUser.isBot) {
    db.notifications.push({
      id: 'n_' + Date.now(),
      userId: toId,
      type: 'dm',
      fromUserId: fromId,
      data: { messageId: msg.id, preview: msg.text.slice(0, 40) },
      read: false,
      createdAt: msg.createdAt
    });
  }
  return { success: true, message: msg };
}

function deleteMessage(userId, msgId) {
  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) return { error: 'Mesaj bulunamadı' };
  if (msg.fromUserId !== userId) return { error: 'Yetki yok' };
  msg.deleted = true;
  msg.text = '';
  msg.image = null;
  return { success: true };
}

function reactMessage(userId, msgId, emoji) {
  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) return { error: 'Mesaj bulunamadı' };
  if (!msg.reactions) msg.reactions = {};

  const idx = (msg.reactions[emoji] || []).indexOf(userId);
  if (idx >= 0) {
    msg.reactions[emoji].splice(idx, 1);
    if (!msg.reactions[emoji].length) delete msg.reactions[emoji];
  } else {
    Object.keys(msg.reactions).forEach(e => {
      if (e === emoji) return;
      const i = msg.reactions[e].indexOf(userId);
      if (i >= 0) {
        msg.reactions[e].splice(i, 1);
        if (!msg.reactions[e].length) delete msg.reactions[e];
      }
    });
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    msg.reactions[emoji].push(userId);
  }
  return { success: true, reactions: msg.reactions };
}

function markMessagesRead(userId, otherId) {
  db.messages.filter(m => m.fromUserId === otherId && m.toUserId === userId && !m.read)
    .forEach(m => m.read = true);
  return { success: true };
}

function searchConversations(userId, query) {
  if (!query?.trim()) return { results: [] };
  const q = query.trim().toLowerCase();
  const msgs = db.messages.filter(m =>
    (m.fromUserId === userId || m.toUserId === userId) &&
    !m.deleted &&
    m.text.toLowerCase().includes(q)
  ).slice(-30);
  return {
    results: msgs.map(m => {
      const otherId = m.fromUserId === userId ? m.toUserId : m.fromUserId;
      const other = db.users.find(u => u.id === otherId);
      return {
        ...m,
        otherUser: { id: otherId, displayName: other?.displayName, username: other?.username, profileImage: other?.profileImage }
      };
    })
  };
}

function getConversations(userId) {
  const userMessages = db.messages.filter(m => (m.fromUserId === userId || m.toUserId === userId) && !m.deleted);
  const conversations = {};

  userMessages.forEach(m => {
    const otherId = m.fromUserId === userId ? m.toUserId : m.fromUserId;
    if (!conversations[otherId]) {
      conversations[otherId] = { lastMessage: m, unread: 0 };
    } else if (new Date(m.createdAt) > new Date(conversations[otherId].lastMessage.createdAt)) {
      conversations[otherId].lastMessage = m;
    }
    if (m.toUserId === userId && !m.read) conversations[otherId].unread++;
  });

  return Object.entries(conversations).map(([otherId, data]) => {
    const other = db.users.find(u => u.id === otherId);
    const msgCount = db.messages.filter(m =>
      ((m.fromUserId === userId && m.toUserId === otherId) ||
       (m.fromUserId === otherId && m.toUserId === userId)) && !m.deleted
    ).length;
    return {
      userId: otherId,
      username: other?.username,
      displayName: other?.displayName,
      profileImage: other?.profileImage,
      verified: other?.verified,
      isBot: other?.isBot,
      lastMessage: data.lastMessage,
      unread: data.unread,
      msgCount
    };
  }).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
}

function getMessages(userId, otherId) {
  const msgs = db.messages.filter(m =>
    (m.fromUserId === userId && m.toUserId === otherId) ||
    (m.fromUserId === otherId && m.toUserId === userId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  msgs.forEach(m => { if (m.toUserId === userId) m.read = true; });
  return msgs;
}

module.exports = {
  sendMessage, deleteMessage, reactMessage,
  markMessagesRead, searchConversations, getConversations, getMessages
};
