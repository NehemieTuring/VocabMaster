import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db = null;
let webDb = null;

// --- Web Fallback (LocalStorage) ---
const getWebDb = () => {
  if (webDb) return webDb;
  const data = localStorage.getItem('vocabmaster_db');
  webDb = data ? JSON.parse(data) : [];
  return webDb;
};

const saveWebDb = (data) => {
  webDb = data;
  localStorage.setItem('vocabmaster_db', JSON.stringify(data));
};

// --- Database Initialization ---
export const getDatabase = async () => {
  if (Platform.OS === 'web') return null; // Web uses getWebDb
  if (db) return db;
  db = await SQLite.openDatabaseAsync('vocabmaster.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      translation TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  try {
    await db.execAsync(`ALTER TABLE words ADD COLUMN streak INTEGER DEFAULT 0`);
  } catch (e) {}
  return db;
};

export const getLevel = (streak) => {
  if (streak >= 10) return 2;
  if (streak >= 3) return 1;
  return 0;
};

export const addWord = async (word, translation) => {
  if (Platform.OS === 'web') {
    const database = getWebDb();
    const newWord = {
      id: Date.now(),
      word: word.trim(),
      translation: translation.trim(),
      streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    database.push(newWord);
    saveWebDb(database);
    return newWord.id;
  }
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO words (word, translation, streak) VALUES (?, ?, 0)',
    [word.trim(), translation.trim()]
  );
  return result.lastInsertRowId;
};

export const getAllWords = async (sortBy = 'created_at', sortOrder = 'DESC') => {
  if (Platform.OS === 'web') {
    const database = [...getWebDb()];
    database.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'word') {
        return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'ASC' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
    });
    return database.map(w => ({ ...w, level: getLevel(w.streak) }));
  }
  const database = await getDatabase();
  const validColumns = ['word', 'translation', 'streak', 'created_at'];
  const validOrders = ['ASC', 'DESC'];
  const col = validColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = validOrders.includes(sortOrder) ? sortOrder : 'DESC';
  const words = await database.getAllAsync(`SELECT * FROM words ORDER BY ${col} ${order}`);
  return words.map(w => ({ ...w, level: getLevel(w.streak) }));
};

export const searchWords = async (query) => {
  if (Platform.OS === 'web') {
    const q = query.toLowerCase();
    const database = getWebDb().filter(w => 
      w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
    );
    return database.map(w => ({ ...w, level: getLevel(w.streak) }));
  }
  const database = await getDatabase();
  const words = await database.getAllAsync(
    'SELECT * FROM words WHERE word LIKE ? OR translation LIKE ? ORDER BY word ASC',
    [`%${query}%`, `%${query}%`]
  );
  return words.map(w => ({ ...w, level: getLevel(w.streak) }));
};

export const updateWord = async (id, word, translation) => {
  if (Platform.OS === 'web') {
    const database = getWebDb().map(w => 
      w.id === id ? { ...w, word: word.trim(), translation: translation.trim(), updated_at: new Date().toISOString() } : w
    );
    saveWebDb(database);
    return;
  }
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE words SET word = ?, translation = ?, updated_at = datetime('now') WHERE id = ?",
    [word.trim(), translation.trim(), id]
  );
};

export const deleteWord = async (id) => {
  if (Platform.OS === 'web') {
    const database = getWebDb().filter(w => w.id !== id);
    saveWebDb(database);
    return;
  }
  const database = await getDatabase();
  await database.runAsync('DELETE FROM words WHERE id = ?', [id]);
};

export const incrementStreak = async (id) => {
  if (Platform.OS === 'web') {
    const database = getWebDb().map(w => 
      w.id === id ? { ...w, streak: w.streak + 1, updated_at: new Date().toISOString() } : w
    );
    saveWebDb(database);
    return;
  }
  const database = await getDatabase();
  await database.runAsync("UPDATE words SET streak = streak + 1 WHERE id = ?", [id]);
};

export const resetStreak = async (id) => {
  if (Platform.OS === 'web') {
    const database = getWebDb().map(w => 
      w.id === id ? { ...w, streak: 0, updated_at: new Date().toISOString() } : w
    );
    saveWebDb(database);
    return;
  }
  const database = await getDatabase();
  await database.runAsync("UPDATE words SET streak = 0 WHERE id = ?", [id]);
};

export const getWordsCount = async () => {
  if (Platform.OS === 'web') {
    const database = getWebDb();
    const counts = { 0: 0, 1: 0, 2: 0 };
    database.forEach(w => { counts[getLevel(w.streak)] += 1; });
    return counts;
  }
  const database = await getDatabase();
  const all = await database.getAllAsync('SELECT streak FROM words');
  const counts = { 0: 0, 1: 0, 2: 0 };
  all.forEach((row) => { counts[getLevel(row.streak)] += 1; });
  return counts;
};

export const getWordsForQuiz = async (limit = 10) => {
  if (Platform.OS === 'web') {
    const allWords = getWebDb();
    if (allWords.length === 0) return [];
    const weighted = allWords.map(w => {
      let weight = w.streak === 0 ? 10 : (w.streak < 3 ? 8 : (w.streak < 10 ? 4 : 1));
      return { ...w, weight, level: getLevel(w.streak) };
    });
    const selected = [];
    const pool = [...weighted];
    const count = Math.min(limit, pool.length);
    for (let i = 0; i < count; i++) {
      const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
      let random = Math.random() * totalWeight;
      let chosen = 0;
      for (let j = 0; j < pool.length; j++) {
        random -= pool[j].weight;
        if (random <= 0) { chosen = j; break; }
      }
      selected.push(pool[chosen]);
      pool.splice(chosen, 1);
    }
    return selected;
  }
  // Logic already exists for native...
  const database = await getDatabase();
  const allWords = await database.getAllAsync('SELECT * FROM words');
  // ... (keep original logic for native)
  return getWordsForQuizWeb(allWords, limit); // Reuse the logic
};

const getWordsForQuizWeb = (allWords, limit) => {
    if (allWords.length === 0) return [];
    const weighted = allWords.map(w => {
      let weight = w.streak === 0 ? 10 : (w.streak < 3 ? 8 : (w.streak < 10 ? 4 : 1));
      return { ...w, weight, level: getLevel(w.streak) };
    });
    const selected = [];
    const pool = [...weighted];
    const count = Math.min(limit, pool.length);
    for (let i = 0; i < count; i++) {
      const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
      let random = Math.random() * totalWeight;
      let chosen = 0;
      for (let j = 0; j < pool.length; j++) {
        random -= pool[j].weight;
        if (random <= 0) { chosen = j; break; }
      }
      selected.push(pool[chosen]);
      pool.splice(chosen, 1);
    }
    return selected;
};

export const getTotalWordsCount = async () => {
  if (Platform.OS === 'web') return getWebDb().length;
  const database = await getDatabase();
  const result = await database.getFirstAsync('SELECT COUNT(*) as total FROM words');
  return result.total;
};
