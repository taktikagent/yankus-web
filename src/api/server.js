// ═══════════════════════════════════════════════════════════════
// HTTP API SUNUCUSU — Tüm Route'lar
// ═══════════════════════════════════════════════════════════════

const http = require('http');
const { app } = require('electron');
const { processScheduled } = require('../modules/yanki');
const { startBotSimulation, stopBotSimulation, isRunning, triggerBotAction } = require('../bots/botSimulation');

const users      = require('../modules/users');
const yanki      = require('../modules/yanki');
const messages   = require('../modules/messages');
const notif      = require('../modules/notifications');
const trending   = require('../modules/trending');
const clanDna    = require('../modules/clanDna');
const admin      = require('../admin/adminPanel');

const patchNotes = [
  {
    version: "1.5.2",
    date: "2026-03-12",
    features: [
      "🧠 AI destekli akıllı botlar",
      "💭 Botlar artık kişiliklerine göre düşünüyor",
      "💬 Akıllı yorum sistemi - içeriğe göre yorum",
      "📊 Gelişmiş admin paneli",
      "🎭 Her bot için benzersiz kişilik"
    ],
    fixes: [
      "🔧 UI tooltip kayma sorunu",
      "🔧 Admin panel tasarım düzeltmeleri",
      "🔧 Z-index hiyerarşisi düzenlendi",
      "🔧 Emoji picker pozisyon hatası"
    ]
  },
  {
    version: "1.5.1",
    date: "2026-03-12",
    features: [],
    fixes: [
      "🔧 UI kutuları kayma sorunu",
      "🔧 Tooltip z-index düzeltmesi",
      "🔧 Modal ve popup düzeltmeleri"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-03-12",
    features: [
      "🤖 Bot simülasyon sistemi",
      "👤 Admin hesabı ve paneli",
      "💬 Özel mesajlaşma sistemi",
      "📊 Admin istatistikleri",
      "📝 Bot geri bildirim sistemi"
    ],
    fixes: []
  }
];

const send = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

function startServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') { send(res, 200, {}); return; }

    const url = req.url.split('?')[0];

    // ─── GET ───────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (url === '/ping')        return send(res, 200, { status: 'ok', version: app.getVersion() });
      if (url === '/trending')    return send(res, 200, { trends: trending.getTrending(null) });
      if (url === '/patchnotes')  return send(res, 200, { patchNotes });
    }

    // ─── POST ──────────────────────────────────────────────────
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const d = JSON.parse(body);

          // Auth
          if (url === '/register') return send(res, 200, users.register(d.username, d.password, d.displayName));
          if (url === '/login')    return send(res, 200, users.login(d.username, d.password));

          // Profil
          if (url === '/profile')           return send(res, 200, users.getProfile(d.userId, d.viewerId));
          if (url === '/profile/username')  return send(res, 200, users.getProfileByUsername(d.username, d.viewerId));
          if (url === '/profile/update')    return send(res, 200, users.updateProfile(d.userId, d));
          if (url === '/followers')         return send(res, 200, { followers: users.getFollowers(d.userId) });
          if (url === '/following')         return send(res, 200, { following: users.getFollowing(d.userId) });
          if (url === '/follow')            return send(res, 200, users.follow(d.followerId, d.followingId));
          if (url === '/block')             return send(res, 200, users.block(d.blockerId, d.blockedId));
          if (url === '/blocked')           return send(res, 200, { users: users.getBlocked(d.userId) });

          // Yankı
          if (url === '/yanki/create')  return send(res, 200, yanki.createYanki(d.userId, d.text, d.image, d.poll, d.reyanki));
          if (url === '/yanki')         return send(res, 200, yanki.getYanki(d.yankiId, d.viewerId));
          if (url === '/yanki/like')    return send(res, 200, yanki.likeYanki(d.userId, d.yankiId));
          if (url === '/yanki/save')    return send(res, 200, yanki.saveYanki(d.userId, d.yankiId));
          if (url === '/yanki/delete')  return send(res, 200, yanki.deleteYanki(d.userId, d.yankiId));
          if (url === '/yanki/pin')     return send(res, 200, yanki.pinYanki(d.userId, d.yankiId));
          if (url === '/yankis')        return send(res, 200, { yankis: yanki.getYankis(d.userId, d.viewerId, d.limit) });
          if (url === '/feed')          return send(res, 200, { yankis: yanki.getFeed(d.userId, d.limit, d.algo || 'chrono') });
          if (url === '/explore')       return send(res, 200, { yankis: yanki.getYankis(null, d.viewerId, d.limit || 50) });

          // Kayıt & Koleksiyonlar
          if (url === '/yankis/saved')          return send(res, 200, { yankis: yanki.getSavedYankis(d.userId, d.sortBy, d.collectionId, d.search) });
          if (url === '/collections/get')       return send(res, 200, { collections: yanki.getCollections(d.userId) });
          if (url === '/collection/create')     return send(res, 200, yanki.createCollection(d.userId, d.name, d.emoji));
          if (url === '/collection/rename')     return send(res, 200, yanki.renameCollection(d.userId, d.collectionId, d.name, d.emoji));
          if (url === '/collection/delete')     return send(res, 200, yanki.deleteCollection(d.userId, d.collectionId));
          if (url === '/collection/toggle-item')return send(res, 200, yanki.toggleCollectionItem(d.userId, d.collectionId, d.yankiId));
          if (url === '/collection/item-cols')  return send(res, 200, { colIds: yanki.getItemCollectionIds(d.userId, d.yankiId) });
          if (url === '/save/note')             return send(res, 200, yanki.setSaveNote(d.userId, d.yankiId, d.note));
          if (url === '/saves/bulk-delete')     return send(res, 200, yanki.bulkUnsave(d.userId, d.yankiIds));

          // Anket & Yorum
          if (url === '/poll/vote')      return send(res, 200, yanki.votePoll(d.userId, d.pollId, d.optionId));
          if (url === '/comment/create') return send(res, 200, yanki.addComment(d.userId, d.yankiId, d.text, d.replyToId));
          if (url === '/comments')       return send(res, 200, { comments: yanki.getComments(d.yankiId) });

          // Thread / Taslak / Zamanlı
          if (url === '/thread/create')   return send(res, 200, yanki.createThread(d.userId, d.items));
          if (url === '/draft/save')      return send(res, 200, yanki.saveDraftFn(d.userId, d.text, d.image, d.poll, d.threadItems));
          if (url === '/draft/list')      return send(res, 200, { drafts: yanki.getDrafts(d.userId) });
          if (url === '/draft/delete')    return send(res, 200, yanki.deleteDraft(d.userId, d.draftId));
          if (url === '/schedule/create') return send(res, 200, yanki.scheduleYankiFn(d.userId, d.text, d.image, d.poll, d.threadItems, d.scheduledAt));
          if (url === '/schedule/list')   return send(res, 200, { scheduled: yanki.getScheduled(d.userId) });
          if (url === '/schedule/cancel') return send(res, 200, yanki.cancelScheduled(d.userId, d.schedId));

          // Arama & Hashtag
          if (url === '/search')       return send(res, 200, yanki.search(d.query, d.type || 'all', d.viewerId));
          if (url === '/hashtag')      return send(res, 200, { yankis: yanki.getHashtagYankis(d.hashtag, d.viewerId, d.limit) });
          if (url === '/hashtag/info') return send(res, 200, yanki.getHashtagInfo(d.hashtag));

          // Trend & Keşif
          if (url === '/trending/advanced')        return send(res, 200, { trends: trending.getTrendingAdvanced(d.userId) });
          if (url === '/explore/trending-yankis')  return send(res, 200, { yankis: trending.getTrendingYankis(d.viewerId, d.limit || 10) });
          if (url === '/explore/suggested-users')  return send(res, 200, { users: users.getSuggestedUsers(d.userId, d.limit || 6) });

          // Bildirimler
          if (url === '/notifications')       return send(res, 200, { notifications: notif.getNotifications(d.userId, d.filter, d.onlyUnread), unreadCount: notif.unreadCount(d.userId) });
          if (url === '/notifications/read')  return send(res, 200, notif.markRead(d.userId));
          if (url === '/notifications/read-one') return send(res, 200, notif.markOneRead(d.userId, d.notifId));
          if (url === '/notifications/clear') return send(res, 200, notif.clearNotifications(d.userId));

          // Mesajlar
          if (url === '/messages/send')          return send(res, 200, messages.sendMessage(d.fromUserId, d.toUserId, d.text, d.replyTo, d.image));
          if (url === '/messages/delete')        return send(res, 200, messages.deleteMessage(d.userId, d.msgId));
          if (url === '/messages/react')         return send(res, 200, messages.reactMessage(d.userId, d.msgId, d.emoji));
          if (url === '/messages/read')          return send(res, 200, messages.markMessagesRead(d.userId, d.otherId));
          if (url === '/messages/search')        return send(res, 200, messages.searchConversations(d.userId, d.query));
          if (url === '/messages/conversations') return send(res, 200, { conversations: messages.getConversations(d.userId) });
          if (url === '/messages/get')           return send(res, 200, { messages: messages.getMessages(d.userId, d.otherId) });

          // İletişim & Klan & DNA
          if (url === '/contact') return send(res, 200, clanDna.submitContact(d.userId, d.subject, d.message, d.email));
          if (url === '/clan')    return send(res, 200, clanDna.getClanInfo(d.userId));
          if (url === '/dna')     return send(res, 200, clanDna.getPersonalityDNA(d.userId));

          // Admin — temel
          if (url === '/admin/stats')          return send(res, 200, admin.getAdminStats());
          if (url === '/admin/bots')           return send(res, 200, { bots: admin.getBotList() });
          if (url === '/admin/feedback')       return send(res, 200, { feedback: admin.getFeedback() });
          if (url === '/admin/feedback/read')  return send(res, 200, admin.markFeedbackRead(d.feedbackId));
          if (url === '/admin/bot/toggle')     return send(res, 200, isRunning() ? (stopBotSimulation(), { running: false }) : (startBotSimulation(), { running: true }));
          if (url === '/admin/bot/trigger')    return send(res, 200, triggerBotAction(d.action, d.botId));

          // Admin — kullanıcı yönetimi
          if (url === '/admin/users')          return send(res, 200, { users: admin.adminGetUsers(d.filter, d.search) });
          if (url === '/admin/user/detail')    return send(res, 200, admin.adminGetUserDetail(d.userId));
          if (url === '/admin/user/ban')       return send(res, 200, admin.adminBanUser(d.userId, d.ban !== false));
          if (url === '/admin/user/delete')    return send(res, 200, admin.adminDeleteUser(d.userId));
          if (url === '/admin/user/make-admin')return send(res, 200, admin.adminMakeAdmin(d.userId, d.makeAdmin !== false));

          // Admin — içerik moderasyonu
          if (url === '/admin/yankis/recent')      return send(res, 200, { yankis: admin.adminGetRecentYankis(d.limit, d.search) });
          if (url === '/admin/yanki/delete')       return send(res, 200, admin.adminDeleteYanki(d.yankiId));
          if (url === '/admin/yankis/bulk-delete') return send(res, 200, admin.adminBulkDeleteYankis(d.yankiIds));
          if (url === '/admin/reports')            return send(res, 200, { reports: admin.adminGetReports() });
          if (url === '/admin/yanki/report')       return send(res, 200, admin.adminReportYanki(d.yankiId, d.reporterId));

          // Admin — analitik
          if (url === '/admin/analytics') return send(res, 200, admin.adminGetAnalytics());

          send(res, 404, { error: 'Bulunamadı' });
        } catch (e) {
          send(res, 500, { error: e.message });
        }
      });
      return;
    }

    send(res, 404, { error: 'Bulunamadı' });
  });

  return new Promise((resolve) => {
    server.listen(3000, () => {
      console.log('Yankuş: http://localhost:3000');
      setInterval(processScheduled, 60000);
      resolve();
    });
  });
}

module.exports = { startServer };
