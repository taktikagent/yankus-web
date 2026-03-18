// ═══════════════════════════════════════════════════════════════
// KULLANICI & AUTH — Kayıt, Giriş, Profil, Takip, Engel
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const { notify } = require('./notifications');

function register(username, password, displayName) {
  const uname = username.toLowerCase().replace('@', '').trim();
  if (db.users.find(u => u.username === uname)) return { error: 'Bu kullanıcı adı alınmış' };
  const user = {
    id: Date.now().toString(),
    username: uname,
    password,
    displayName: displayName || uname,
    bio: '',
    profileImage: null,
    bannerImage: null,
    verified: false,
    isAdmin: false,
    isBot: false,
    pinnedYankiId: null,
    theme: 'dark',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  return { success: true, user: { ...user, password: undefined } };
}

function login(username, password) {
  const uname = username.toLowerCase().replace('@', '').trim();
  const user = db.users.find(u => u.username === uname && u.password === password);
  if (!user) return { error: 'Kullanıcı adı veya şifre hatalı' };
  if (user.banned) return { error: 'Hesabınız askıya alınmıştır' };
  return { success: true, user: { ...user, password: undefined } };
}

function updateProfile(userId, data) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return { error: 'Kullanıcı bulunamadı' };
  if (data.displayName) user.displayName = data.displayName;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.profileImage !== undefined) user.profileImage = data.profileImage;
  if (data.bannerImage !== undefined) user.bannerImage = data.bannerImage;
  if (data.theme) user.theme = data.theme;
  return { success: true, user: { ...user, password: undefined } };
}

function getProfile(userId, viewerId = null) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return { error: 'Kullanıcı bulunamadı' };
  if (viewerId && isBlocked(userId, viewerId)) return { error: 'Profil engellenmiş' };

  return {
    ...user, password: undefined,
    stats: {
      yankis: db.yankis.filter(y => y.userId === userId && !y.deleted).length,
      followers: db.follows.filter(f => f.followingId === userId).length,
      following: db.follows.filter(f => f.followerId === userId).length
    },
    isFollowing: viewerId ? db.follows.some(f => f.followerId === viewerId && f.followingId === userId) : false,
    isBlocked: viewerId ? db.blocks.some(b => b.blockerId === viewerId && b.blockedId === userId) : false
  };
}

function getProfileByUsername(username, viewerId = null) {
  const user = db.users.find(u => u.username === username.toLowerCase().replace('@', ''));
  if (!user) return { error: 'Kullanıcı bulunamadı' };
  return getProfile(user.id, viewerId);
}

function getFollowers(userId) {
  const ids = db.follows.filter(f => f.followingId === userId).map(f => f.followerId);
  return db.users.filter(u => ids.includes(u.id)).map(u => ({
    id: u.id, username: u.username, displayName: u.displayName,
    profileImage: u.profileImage, verified: u.verified, isBot: u.isBot
  }));
}

function getFollowing(userId) {
  const ids = db.follows.filter(f => f.followerId === userId).map(f => f.followingId);
  return db.users.filter(u => ids.includes(u.id)).map(u => ({
    id: u.id, username: u.username, displayName: u.displayName,
    profileImage: u.profileImage, verified: u.verified, isBot: u.isBot
  }));
}

function isBlocked(u1, u2) {
  return db.blocks.some(b =>
    (b.blockerId === u1 && b.blockedId === u2) ||
    (b.blockerId === u2 && b.blockedId === u1)
  );
}

function follow(followerId, followingId) {
  if (followerId === followingId) return { error: 'Kendinizi takip edemezsiniz' };
  if (isBlocked(followerId, followingId)) return { error: 'Engellenmiş kullanıcı' };

  const exists = db.follows.find(f => f.followerId === followerId && f.followingId === followingId);
  if (exists) {
    db.follows = db.follows.filter(f => !(f.followerId === followerId && f.followingId === followingId));
    return { success: true, following: false };
  }
  db.follows.push({ followerId, followingId, createdAt: new Date().toISOString() });
  notify(followingId, 'follow', { fromUserId: followerId });
  return { success: true, following: true };
}

function block(blockerId, blockedId) {
  if (blockerId === blockedId) return { error: 'Kendinizi engelleyemezsiniz' };

  const exists = db.blocks.find(b => b.blockerId === blockerId && b.blockedId === blockedId);
  if (exists) {
    db.blocks = db.blocks.filter(b => !(b.blockerId === blockerId && b.blockedId === blockedId));
    return { success: true, blocked: false };
  }
  db.blocks.push({ blockerId, blockedId, createdAt: new Date().toISOString() });
  db.follows = db.follows.filter(f =>
    !((f.followerId === blockerId && f.followingId === blockedId) ||
      (f.followerId === blockedId && f.followingId === blockerId))
  );
  return { success: true, blocked: true };
}

function getBlocked(userId) {
  const ids = db.blocks.filter(b => b.blockerId === userId).map(b => b.blockedId);
  return db.users.filter(u => ids.includes(u.id)).map(u => ({
    id: u.id, username: u.username, displayName: u.displayName, profileImage: u.profileImage
  }));
}

function getSuggestedUsers(userId, limit = 6) {
  const blockedIds = new Set(
    db.blocks.filter(b => b.blockerId === userId || b.blockedId === userId)
      .map(b => b.blockerId === userId ? b.blockedId : b.blockerId)
  );
  const followingIds = new Set(db.follows.filter(f => f.followerId === userId).map(f => f.followingId));
  const myFollowers = new Set(db.follows.filter(f => f.followingId === userId).map(f => f.followerId));

  const network = new Map();
  followingIds.forEach(fid => {
    db.follows.filter(f => f.followerId === fid).forEach(f => {
      if (f.followingId !== userId && !followingIds.has(f.followingId) && !blockedIds.has(f.followingId)) {
        network.set(f.followingId, (network.get(f.followingId) || 0) + 2);
      }
    });
  });

  myFollowers.forEach(fid => {
    db.follows.filter(f => f.followerId === fid).forEach(f => {
      if (f.followingId !== userId && !followingIds.has(f.followingId) && !blockedIds.has(f.followingId)) {
        network.set(f.followingId, (network.get(f.followingId) || 0) + 1);
      }
    });
  });

  let scored = Array.from(network.entries()).map(([uid, score]) => ({ uid, score }));

  if (scored.length < limit) {
    db.users
      .filter(u => u.id !== userId && !followingIds.has(u.id) && !blockedIds.has(u.id) && !network.has(u.id))
      .forEach(u => {
        const followers = db.follows.filter(f => f.followingId === u.id).length;
        scored.push({ uid: u.id, score: followers * 0.1 });
      });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ uid, score }) => {
    const u = db.users.find(x => x.id === uid);
    if (!u) return null;
    const mutualCount = Math.round(score / 2);
    const followerCount = db.follows.filter(f => f.followingId === uid).length;
    return {
      id: u.id, username: u.username, displayName: u.displayName,
      profileImage: u.profileImage, verified: u.verified, isBot: u.isBot,
      bio: u.bio || '', followerCount, mutualCount,
      reason: mutualCount > 0 ? `${mutualCount} ortak tanıdık` : `${followerCount} takipçi`
    };
  }).filter(Boolean);
}

module.exports = {
  register, login, updateProfile,
  getProfile, getProfileByUsername,
  getFollowers, getFollowing,
  follow, block, getBlocked, isBlocked,
  getSuggestedUsers
};
