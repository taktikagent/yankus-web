// ═══════════════════════════════════════════════════════════════
// KLAN & KİŞİLİK DNA — Kullanıcı İstatistikleri
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');

// ─── Klan Sistemi ─────────────────────────────────────────────
const CLAN_TIERS = [
  { min: 0,    max: 4,          name: 'Yalnız Gezgin',  icon: '🏕️', color: '#7a6060' },
  { min: 5,    max: 19,         name: 'Küçük Köy',      icon: '🏘️', color: '#10b981' },
  { min: 20,   max: 49,         name: 'Kasaba',          icon: '🏙️', color: '#3b82f6' },
  { min: 50,   max: 99,         name: 'Şehir',           icon: '🌆', color: '#8b5cf6' },
  { min: 100,  max: 249,        name: 'Büyük Şehir',     icon: '🌃', color: '#f59e0b' },
  { min: 250,  max: 499,        name: 'Metropol',        icon: '🌇', color: '#ef4444' },
  { min: 500,  max: 999,        name: 'İmparatorluk',    icon: '👑', color: '#b5485d' },
  { min: 1000, max: Infinity,   name: 'Efsane',          icon: '⚡', color: '#ffd700' },
];

function getClanInfo(userId) {
  const followerCount = db.follows.filter(f => f.followingId === userId).length;
  const tier = CLAN_TIERS.find(t => followerCount >= t.min && followerCount <= t.max) || CLAN_TIERS[0];
  const nextTier = CLAN_TIERS[CLAN_TIERS.indexOf(tier) + 1] || null;
  const createdAt = db.users.find(u => u.id === userId)?.createdAt;
  const daysSince = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) : 0;

  const recentMembers = db.follows
    .filter(f => f.followingId === userId)
    .slice(-5)
    .map(f => {
      const u = db.users.find(u => u.id === f.followerId);
      return u ? { id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage } : null;
    })
    .filter(Boolean)
    .reverse();

  return {
    followerCount, tier, nextTier,
    progress: nextTier ? Math.round(((followerCount - tier.min) / (nextTier.min - tier.min)) * 100) : 100,
    daysSince, recentMembers
  };
}

// ─── Kişilik DNA Analizi ───────────────────────────────────────
function getPersonalityDNA(userId) {
  const yankis = db.yankis.filter(y => y.userId === userId && !y.deleted);
  if (yankis.length === 0) return { dna: [], topTopics: [], postingPattern: [], dominantMood: 'Bilinmiyor', totalYankis: 0 };

  const tagFreq = {};
  yankis.forEach(y => {
    (y.text?.match(/#[\wğüşıöçĞÜŞİÖÇ]+/gi) || []).forEach(tag => {
      tagFreq[tag.toLowerCase()] = (tagFreq[tag.toLowerCase()] || 0) + 1;
    });
  });

  const topTopics = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count, pct: Math.round((count / yankis.length) * 100) }));

  const hourDist = new Array(24).fill(0);
  yankis.forEach(y => { hourDist[new Date(y.createdAt).getHours()]++; });
  const maxHour = Math.max(...hourDist);
  const postingPattern = hourDist.map(v => maxHour > 0 ? Math.round((v / maxHour) * 100) : 0);

  const nightCount   = hourDist.slice(21).concat(hourDist.slice(0, 6)).reduce((a, b) => a + b, 0);
  const morningCount = hourDist.slice(6, 12).reduce((a, b) => a + b, 0);
  const dominantMood = nightCount > morningCount ? 'Gece Kuşu 🦉' : 'Sabahçı 🌅';

  const emojiCount = yankis.filter(y => /\p{Emoji}/u.test(y.text || '')).length;
  const emojiRate  = Math.round((emojiCount / yankis.length) * 100);
  const avgLen     = Math.round(yankis.reduce((a, y) => a + (y.text?.length || 0), 0) / yankis.length);
  const mediaRate  = Math.round((yankis.filter(y => y.image).length / yankis.length) * 100);

  const colors = ['#b5485d','#8b3a4a','#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899'];
  const factors = [
    { label: 'Hashtag', value: Math.min(Object.keys(tagFreq).length * 5, 100) },
    { label: 'Emoji',   value: emojiRate },
    { label: 'Medya',   value: mediaRate },
    { label: 'Uzun',    value: Math.min(Math.round(avgLen / 5), 100) },
    { label: 'Aktif',   value: Math.min(yankis.length * 2, 100) },
    { label: 'Gece',    value: Math.round((nightCount / Math.max(yankis.length, 1)) * 100) },
  ];
  const dna = factors.map((f, i) => ({ ...f, color: colors[i % colors.length] }));

  return { dna, topTopics, postingPattern, dominantMood, totalYankis: yankis.length, emojiRate, avgLen, mediaRate };
}

// ─── İletişim Formu ───────────────────────────────────────────
function submitContact(userId, subject, message, email) {
  if (!message?.trim()) return { error: 'Mesaj boş olamaz' };
  db.contacts.push({
    id: Date.now().toString(), userId,
    subject: subject || 'Genel',
    message: message.trim(),
    email: email || '',
    createdAt: new Date().toISOString()
  });
  return { success: true, message: 'Mesajınız alındı!' };
}

module.exports = { getClanInfo, getPersonalityDNA, submitContact, CLAN_TIERS };
