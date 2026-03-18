// ═══════════════════════════════════════════════════════════════
// KEŞİF & TREND — Trend Hesaplama, Kategori, Keşif Yankıları
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const { checkTrendingNotify } = require('./notifications');
const { enrichYanki } = require('./yanki');

const TAG_CATEGORIES = {
  spor:      ['futbol','basketbol','spor','maç','liga','şampiyon','gol','nba','transfer','antrenman','tenis','voleybol','formula'],
  teknoloji: ['yazılım','kod','react','nodejs','ai','yapayzeká','javascript','python','typescript','startup','blockchain','crypto','uygulama','app','tech'],
  müzik:     ['müzik','konser','şarkı','albüm','piyano','prodüksiyon','jazz','klasik','playlist','festival'],
  sanat:     ['tasarım','ui','ux','figma','renk','fotoğraf','çizim','resim','sanat','illüstrasyon'],
  yemek:     ['yemek','tarif','mutfak','lezzet','gastronomi','kahve','çay','restoran','aşçı'],
  seyahat:   ['seyahat','gezi','tatil','şehir','ülke','uçuş','otel','keşif','doğa'],
  sağlık:    ['sağlık','fitness','spor','beslenme','yoga','meditasyon','diyet','antrenman'],
  genel:     []
};

function detectCategory(tag) {
  const t = tag.replace('#', '').toLowerCase();
  for (const [cat, keywords] of Object.entries(TAG_CATEGORIES)) {
    if (cat === 'genel') continue;
    if (keywords.some(k => t.includes(k) || k.includes(t))) return cat;
  }
  return 'genel';
}

function getTrendingAdvanced(requestUserId) {
  const now = Date.now();
  const dayAgo  = now - 86400000;
  const hourAgo = now - 3600000;
  const weekAgo = now - 604800000;

  const counts = { hour: {}, day: {}, week: {} };
  db.yankis.filter(y => !y.deleted).forEach(y => {
    const t = new Date(y.createdAt).getTime();
    const tags = (y.text || '').match(/#[\wğüşıöçĞÜŞİÖÇ]+/gi) || [];
    tags.forEach(raw => {
      const tag = raw.toLowerCase();
      if (t > hourAgo) counts.hour[tag] = (counts.hour[tag] || 0) + 1;
      if (t > dayAgo)  counts.day[tag]  = (counts.day[tag]  || 0) + 1;
      if (t > weekAgo) counts.week[tag] = (counts.week[tag] || 0) + 1;
    });
  });

  const allTags = new Set([...Object.keys(counts.day), ...Object.keys(counts.week)]);

  const scored = Array.from(allTags).map(tag => {
    const h = counts.hour[tag] || 0;
    const d = counts.day[tag]  || 0;
    const w = counts.week[tag] || 0;

    const velocity = h * 4 + d;
    const score = velocity + w * 0.3;
    const prevDay = w - d;
    const rising = d > 0 && (prevDay === 0 || d / Math.max(prevDay, 1) > 1.2);

    const bars = Array.from({ length: 8 }, (_, i) => {
      const sliceEnd   = now - i * 10800000;
      const sliceStart = sliceEnd - 10800000;
      return db.yankis.filter(y => {
        const t = new Date(y.createdAt).getTime();
        return !y.deleted && t >= sliceStart && t < sliceEnd && (y.text || '').toLowerCase().includes(tag);
      }).length;
    }).reverse();

    return { tag, score, velocity, rising, countDay: d, countHour: h, countWeek: w, category: detectCategory(tag), bars };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 15);

  const topTagSet = new Set(top.slice(0, 5).map(x => x.tag));
  if (requestUserId) checkTrendingNotify(requestUserId, topTagSet);

  const result = top.map((x, i) => ({
    rank: i + 1,
    topic: x.tag,
    count: x.countDay + ' yankı',
    countDay: x.countDay,
    countHour: x.countHour,
    category: x.category,
    rising: x.rising,
    bars: x.bars
  }));

  if (result.length < 3) {
    result.push({ rank: result.length + 1, topic: '#yankuş', count: 'Yeni', countDay: 0, countHour: 0, category: 'platform', rising: false, bars: [0,0,0,0,0,0,0,0] });
    result.push({ rank: result.length + 1, topic: '#merhaba', count: 'Popüler', countDay: 0, countHour: 0, category: 'genel', rising: false, bars: [0,0,0,0,0,0,0,0] });
  }

  return result;
}

// Geriye dönük uyumluluk
function getTrending(requestUserId) {
  return getTrendingAdvanced(requestUserId);
}

function getTrendingYankis(viewerId, limit = 10) {
  const blockedIds = viewerId
    ? new Set(db.blocks.filter(b => b.blockerId === viewerId || b.blockedId === viewerId)
        .map(b => b.blockerId === viewerId ? b.blockedId : b.blockerId))
    : new Set();

  const dayAgo = Date.now() - 86400000;

  return db.yankis
    .filter(y => !y.deleted && !blockedIds.has(y.userId) && new Date(y.createdAt).getTime() > dayAgo)
    .map(y => {
      const age = Math.max((Date.now() - new Date(y.createdAt).getTime()) / 3600000, 0.1);
      const likes    = db.likes.filter(l => l.yankiId === y.id).length;
      const comments = db.comments.filter(c => c.yankiId === y.id && !c.deleted).length;
      const reyanks  = db.yankis.filter(r => r.reyanki?.id === y.id && !r.deleted).length;
      const score    = (likes * 3 + comments * 5 + reyanks * 4) / Math.pow(age + 1, 1.3);
      return { y, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => enrichYanki(x.y, viewerId));
}

module.exports = { getTrending, getTrendingAdvanced, getTrendingYankis, detectCategory, TAG_CATEGORIES };
