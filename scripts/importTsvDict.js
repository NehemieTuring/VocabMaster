const fs = require('fs');
const path = require('path');
const https = require('https');

const TSV_URL = 'https://raw.githubusercontent.com/open-dict-data/wikidict-en-fr/master/wikidict-en-fr.tsv';
const OUTPUT_JSON = path.join(__dirname, '..', 'assets', 'dictionary_full.json');

async function downloadTSV() {
  return new Promise((resolve, reject) => {
    console.log('⬇️ Téléchargement du dictionnaire TSV (Wikidict)...');
    https.get(TSV_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  try {
    const tsvContent = await downloadTSV();
    const lines = tsvContent.split('\n');
    console.log(`📊 ${lines.length} lignes reçues. Conversion en cours...`);

    const dictionary = {};
    
    // Charger l'existant pour ne pas perdre nos corrections manuelles
    if (fs.existsSync(OUTPUT_JSON)) {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
      Object.assign(dictionary, existing);
    }

    let count = 0;
    for (const line of lines) {
      const [en, fr] = line.split('\t');
      if (en && fr) {
        const cleanEn = en.trim().toLowerCase();
        const cleanFr = fr.trim().toLowerCase();
        // On ne remplace pas si déjà présent (pour garder la haute qualité)
        if (!dictionary[cleanEn]) {
          dictionary[cleanEn] = cleanFr;
          count++;
        }
      }
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(dictionary, null, 2), 'utf-8');
    console.log(`✅ Terminé ! ${count} nouveaux mots ajoutés.`);
    console.log(`📚 Total du dictionnaire: ${Object.keys(dictionary).length} mots.`);
  } catch (e) {
    console.error('❌ Échec du téléchargement:', e.message);
    console.log('💡 Le lien GitHub est peut-être temporairement indisponible ou le fichier a été déplacé.');
  }
}

main();
