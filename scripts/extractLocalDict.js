/**
 * Extrait le dictionnaire depuis le fichier SQLite local fourni par l'utilisateur.
 * Emplacement attendu : D:\@Discipline\Projet\VocabMaster\en-fr.sqlite3
 */
const fs = require('fs');
const path = require('path');

// Chemin vers votre fichier téléchargé
const DOWNLOADED_SQLITE = path.join(__dirname, '..', 'en-fr.sqlite3');
const OUTPUT_JSON = path.join(__dirname, '..', 'assets', 'dictionary_full.json');

async function extractDictionary() {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.error('❌ Erreur : Le module "better-sqlite3" n\'est pas installé.');
    console.log('💡 Lancez d\'abord : npm install better-sqlite3');
    return;
  }

  if (!fs.existsSync(DOWNLOADED_SQLITE)) {
    console.error(`❌ Fichier introuvable à l'emplacement : ${DOWNLOADED_SQLITE}`);
    return;
  }

  console.log('📖 Ouverture de la base de données WikDict...');
  const db = new Database(DOWNLOADED_SQLITE, { readonly: true });

  try {
    console.log('🔍 Extraction des traductions (cela peut prendre quelques secondes)...');
    
    // Requête optimisée pour WikDict
    // On récupère le mot (written_rep) et sa traduction (trans_list)
    const rows = db.prepare(`
      SELECT written_rep as word, trans_list as translation 
      FROM translation 
      WHERE written_rep IS NOT NULL AND trans_list IS NOT NULL
    `).all();

    console.log(`📊 ${rows.length} lignes trouvées. Nettoyage en cours...`);

    const dictionary = {};
    
    // Charger l'existant pour fusionner
    if (fs.existsSync(OUTPUT_JSON)) {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
      Object.assign(dictionary, existing);
    }

    for (const row of rows) {
      const word = row.word.trim().toLowerCase();
      const trans = row.translation.trim().toLowerCase();
      
      // On garde la traduction la plus simple/courte s'il y a des doublons
      if (!dictionary[word] || trans.length < dictionary[word].length) {
        // On enlève les métadonnées inutiles de WikDict (ex: {m}, {f})
        dictionary[word] = trans.split('{')[0].trim();
      }
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(dictionary, null, 2), 'utf-8');
    
    console.log('\n✅ EXTRACTION RÉUSSIE !');
    console.log(`📚 Votre dictionnaire contient maintenant ${Object.keys(dictionary).length} mots.`);
    console.log(`📍 Fichier généré : ${OUTPUT_JSON}`);

  } catch (e) {
    console.error('❌ Erreur lors de l\'extraction :', e.message);
    console.log('💡 Vérifiez que le fichier sqlite n\'est pas corrompu.');
  } finally {
    db.close();
  }
}

extractDictionary();
