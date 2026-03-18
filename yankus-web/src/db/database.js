// ═══════════════════════════════════════════════════════════════
// VERİTABANI — In-Memory
// ═══════════════════════════════════════════════════════════════
const db = {
  users: [],
  yankis: [],
  comments: [],
  likes: [],
  follows: [],
  notifications: [],
  saves: [],          // { userId, yankiId, createdAt }
  blocks: [],
  polls: [],
  pollVotes: [],
  contacts: [],
  messages: [],
  feedback: [],
  collections: [],       // { id, userId, name, emoji, createdAt }
  saveNotes: [],         // { userId, yankiId, note, updatedAt }
  collectionItems: [],   // { collectionId, yankiId, addedAt }
  drafts: [],           // { id, userId, text, image, poll, threadItems, savedAt }
  scheduled: [],        // { id, userId, text, image, poll, threadItems, scheduledAt }
  threads: []           // { id, yankiIds, createdAt }
};

module.exports = db;
