// ═══════════════════════════════════════════════════════════════
// BOT SİMÜLASYONU — Başlatma & Aksiyon Yönetimi
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const { BOT_PROFILES, BotAI } = require('./botProfiles');
const { createYanki, likeYanki, addComment } = require('../modules/yanki');
const { follow } = require('../modules/users');
const { sendMessage } = require('../modules/messages');

const botAIs = new Map();
let botSimulationInterval = null;
let botSimulationRunning = false;

function initAdmin() {
  const adminExists = db.users.find(u => u.username === 'admin');
  if (!adminExists) {
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
      pinnedYankiId: null,
      theme: 'dark',
      createdAt: new Date().toISOString()
    });
  }
}

function initBots() {
  BOT_PROFILES.forEach((bot, i) => {
    const exists = db.users.find(u => u.username === bot.username);
    if (!exists) {
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
        personality: bot.personality,
        interests: bot.interests,
        mood: bot.mood,
        style: bot.style,
        pinnedYankiId: null,
        theme: 'dark',
        createdAt: new Date().toISOString()
      };
      db.users.push(botUser);
      botAIs.set(botUser.id, new BotAI(bot));
    }
  });
}

function startBotSimulation() {
  if (botSimulationRunning) return;
  botSimulationRunning = true;
  console.log('🤖 AI Bot simülasyonu başlatıldı');

  botSimulationInterval = setInterval(() => {
    const bots = db.users.filter(u => u.isBot);
    if (bots.length === 0) return;

    const randomBot = bots[Math.floor(Math.random() * bots.length)];
    const botAI = botAIs.get(randomBot.id) || new BotAI(BOT_PROFILES.find(b => b.username === randomBot.username));
    const { action } = botAI.think();

    switch (action) {
      case 'yanki':    botPostSmartYanki(randomBot, botAI); break;
      case 'like':     botLikeRandom(randomBot); break;
      case 'comment':  botSmartComment(randomBot, botAI); break;
      case 'follow':   botFollowRandom(randomBot); break;
      case 'dm':       botSmartDM(randomBot, botAI); break;
      case 'feedback': botSmartFeedback(randomBot, botAI); break;
      case 'think':    console.log(`🤖 ${randomBot.displayName} düşünüyor...`); break;
      case 'rest':     console.log(`🤖 ${randomBot.displayName} dinleniyor...`); break;
    }
  }, Math.random() * 12000 + 8000);
}

function stopBotSimulation() {
  if (botSimulationInterval) {
    clearInterval(botSimulationInterval);
    botSimulationInterval = null;
  }
  botSimulationRunning = false;
  console.log('🤖 Bot simülasyonu durduruldu');
}

function isRunning() {
  return botSimulationRunning;
}

// ─── Bot Aksiyonları ─────────────────────────────────────────
function botPostSmartYanki(bot, botAI) {
  const text = botAI.generateYanki();
  createYanki(bot.id, text);
  console.log(`🤖 ${bot.displayName} yankıladı: ${text.substring(0, 40)}...`);
}

function botLikeRandom(bot) {
  const yankis = db.yankis.filter(y => !y.deleted && y.userId !== bot.id);
  if (yankis.length === 0) return;
  const yanki = yankis[Math.floor(Math.random() * yankis.length)];
  const alreadyLiked = db.likes.find(l => l.userId === bot.id && l.yankiId === yanki.id);
  if (!alreadyLiked) {
    likeYanki(bot.id, yanki.id);
    console.log(`🤖 ${bot.displayName} beğendi`);
  }
}

function botSmartComment(bot, botAI) {
  const yankis = db.yankis.filter(y => !y.deleted && y.userId !== bot.id && y.text);
  if (yankis.length === 0) return;
  const yanki = yankis[Math.floor(Math.random() * yankis.length)];
  const text = botAI.generateSmartComment(yanki.text);
  addComment(bot.id, yanki.id, text);
  console.log(`🤖 ${bot.displayName} yorum yaptı: ${text}`);
}

function botFollowRandom(bot) {
  const users = db.users.filter(u => u.id !== bot.id);
  if (users.length === 0) return;
  const user = users[Math.floor(Math.random() * users.length)];
  const existing = db.follows.find(f => f.followerId === bot.id && f.followingId === user.id);
  if (!existing) {
    follow(bot.id, user.id);
    console.log(`🤖 ${bot.displayName} takip etti: ${user.displayName}`);
  }
}

function botSmartDM(bot, botAI) {
  const targets = db.users.filter(u => u.id !== bot.id);
  if (targets.length === 0) return;
  const target = targets[Math.floor(Math.random() * targets.length)];
  const text = botAI.generateSmartDM(target);
  sendMessage(bot.id, target.id, text);
  console.log(`🤖 ${bot.displayName} -> ${target.displayName}: ${text.substring(0, 30)}...`);
}

function botSmartFeedback(bot, botAI) {
  const admin = db.users.find(u => u.isAdmin);
  if (!admin) return;
  const fb = botAI.generateSmartFeedback();
  db.feedback.push({
    id: Date.now().toString(),
    fromUserId: bot.id,
    type: fb.type,
    message: fb.message,
    read: false,
    createdAt: new Date().toISOString()
  });
  console.log(`🤖 ${bot.displayName} feedback: ${fb.message.substring(0, 40)}...`);
}

function triggerBotAction(action, botId = null) {
  const bots = db.users.filter(u => u.isBot);
  if (bots.length === 0) return { error: 'Bot yok' };

  const bot = botId ? bots.find(b => b.id === botId) : bots[Math.floor(Math.random() * bots.length)];
  if (!bot) return { error: 'Bot bulunamadı' };

  const botAI = botAIs.get(bot.id) || new BotAI(BOT_PROFILES.find(b => b.username === bot.username));

  switch (action) {
    case 'yanki':    botPostSmartYanki(bot, botAI); break;
    case 'like':     botLikeRandom(bot); break;
    case 'comment':  botSmartComment(bot, botAI); break;
    case 'follow':   botFollowRandom(bot); break;
    case 'dm':       botSmartDM(bot, botAI); break;
    case 'feedback': botSmartFeedback(bot, botAI); break;
    default: return { error: 'Geçersiz aksiyon' };
  }

  return { success: true, bot: bot.displayName, action };
}

module.exports = {
  initAdmin,
  initBots,
  startBotSimulation,
  stopBotSimulation,
  isRunning,
  triggerBotAction,
  botAIs
};
