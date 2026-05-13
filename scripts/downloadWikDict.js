/**
 * Télécharge le dictionnaire WikDict EN↔FR (open source, haute qualité).
 * Source: https://download.wikdict.com/dictionaries/sqlite/2/en-fr.sqlite3
 * 
 * Ce script :
 * 1. Télécharge la base SQLite de WikDict (~40,000 traductions)
 * 2. Extrait les paires EN→FR
 * 3. Génère un fichier JSON propre pour l'app
 * 
 * USAGE: node scripts/downloadWikDict.js
 * PRÉREQUIS: npm install better-sqlite3
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SQLITE_URL = 'https://download.wikdict.com/dictionaries/sqlite/2/en-fr.sqlite3';
const DOWNLOAD_PATH = path.join(__dirname, 'en-fr.sqlite3');
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'dictionary_full.json');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`⬇️  Téléchargement depuis ${url}...`);
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const total = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total) {
          const pct = Math.round((downloaded / total) * 100);
          process.stdout.write(`\r  📥 ${pct}% (${(downloaded/1024/1024).toFixed(1)} MB)`);
        }
      });

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('\n  ✅ Téléchargement terminé !');
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function extractDictionary() {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.error('❌ Module "better-sqlite3" non trouvé.');
    console.error('   Installe-le avec: npm install better-sqlite3');
    console.error('\n   Alternative: utilise le script buildDictionaryManual.js');
    process.exit(1);
  }

  console.log('📖 Extraction des traductions...');
  const db = new Database(DOWNLOAD_PATH, { readonly: true });

  // Lister les tables disponibles
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('  Tables:', tables.map(t => t.name).join(', '));

  // Essayer différentes structures de table WikDict
  let rows = [];
  try {
    rows = db.prepare(`
      SELECT written_rep as word, trans as translation 
      FROM translation 
      WHERE written_rep IS NOT NULL AND trans IS NOT NULL
      LIMIT 100000
    `).all();
  } catch (e) {
    try {
      rows = db.prepare(`
        SELECT lexentry, written_rep, sense, trans 
        FROM translation 
        LIMIT 100000
      `).all();
    } catch (e2) {
      // Fallback: dump first table
      const firstTable = tables[0]?.name;
      if (firstTable) {
        const cols = db.prepare(`PRAGMA table_info(${firstTable})`).all();
        console.log(`  Colonnes de ${firstTable}:`, cols.map(c => c.name).join(', '));
        rows = db.prepare(`SELECT * FROM ${firstTable} LIMIT 5`).all();
        console.log('  Exemple:', JSON.stringify(rows[0], null, 2));
      }
    }
  }

  const dict = {};
  for (const row of rows) {
    const word = (row.word || row.written_rep || '').trim().toLowerCase();
    const trans = (row.translation || row.trans || '').trim().toLowerCase();
    if (word && trans && word !== trans && word.length < 40 && trans.length < 40) {
      // Prendre la traduction la plus courte/simple
      if (!dict[word] || trans.length < dict[word].length) {
        dict[word] = trans;
      }
    }
  }

  db.close();

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dict, null, 2), 'utf-8');
  console.log(`\n✅ ${Object.keys(dict).length} traductions extraites → ${OUTPUT_PATH}`);

  // Nettoyage
  fs.unlinkSync(DOWNLOAD_PATH);
  console.log('🗑️  Fichier SQLite temporaire supprimé.');
}

async function main() {
  console.log('🔨 WikDict EN→FR Dictionary Downloader\n');

  try {
    await download(SQLITE_URL, DOWNLOAD_PATH);
    await extractDictionary();
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    console.error('\n📋 Alternative manuelle:');
    console.error('   1. Télécharge: https://download.wikdict.com/dictionaries/sqlite/2/en-fr.sqlite3');
    console.error('   2. Place le fichier dans scripts/en-fr.sqlite3');
    console.error('   3. Relance ce script');
  }
}

main();
