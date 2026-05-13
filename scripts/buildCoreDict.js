const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'dictionary_full.json');

const DICT = {
  // --- BASE ---
  "the": "le/la/les", "be": "être", "to": "à", "of": "de", "and": "et", "a": "un", "in": "dans", "that": "cela", "have": "avoir", "it": "il/elle",
  
  // --- TECHNOLOGY & DIGITAL ---
  "computer": "ordinateur", "software": "logiciel", "hardware": "matériel", "internet": "internet", "website": "site web",
  "data": "données", "network": "réseau", "keyboard": "clavier", "mouse": "souris", "screen": "écran", "printer": "imprimante",
  "database": "base de données", "program": "programme", "developer": "développeur", "code": "code", "file": "fichier",
  "folder": "dossier", "cloud": "nuage/cloud", "security": "sécurité", "password": "mot de passe", "email": "e-mail",
  "mobile": "mobile", "application": "application", "server": "serveur", "connection": "connexion", "digital": "numérique",
  
  // --- BUSINESS & WORK ---
  "office": "bureau", "meeting": "réunion", "company": "entreprise", "business": "affaires", "work": "travail",
  "salary": "salaire", "manager": "gestionnaire", "employee": "employé", "customer": "client", "market": "marché",
  "contract": "contrat", "project": "projet", "success": "succès", "failure": "échec", "money": "argent",
  "price": "prix", "cost": "coût", "investment": "investissement", "profit": "profit", "debt": "dette",
  "tax": "taxe", "economy": "économie", "trade": "commerce", "industry": "industrie", "service": "service",
  
  // --- TRAVEL & PLACES ---
  "travel": "voyager", "trip": "voyage", "journey": "périple", "hotel": "hôtel", "airport": "aéroport",
  "station": "gare", "train": "train", "bus": "bus", "car": "voiture", "plane": "avion", "ticket": "billet",
  "passport": "passeport", "visa": "visa", "map": "carte", "direction": "direction", "destination": "destination",
  "beach": "plage", "mountain": "montagne", "city": "ville", "country": "pays", "island": "île",
  "forest": "forêt", "park": "parc", "museum": "musée", "church": "église", "castle": "château",
  
  // --- EMOTIONS & FEELINGS ---
  "happy": "heureux", "sad": "triste", "angry": "en colère", "fear": "peur", "love": "amour",
  "hate": "haine", "joy": "joie", "surprise": "surprise", "disgust": "dégoût", "anxiety": "anxiété",
  "hope": "espoir", "trust": "confiance", "pride": "fierté", "shame": "honte", "guilt": "culpabilité",
  "courage": "courage", "calm": "calme", "boredom": "ennui", "excitement": "excitation", "loneliness": "solitude",
  
  // --- EDUCATION & SCIENCE ---
  "science": "science", "physics": "physique", "chemistry": "chimie", "biology": "biologie", "math": "maths",
  "history": "histoire", "geography": "géographie", "literature": "littérature", "language": "langue", "education": "éducation",
  "school": "école", "university": "université", "library": "bibliothèque", "research": "recherche", "experiment": "expérience",
  "theory": "théorie", "fact": "fait", "knowledge": "connaissance", "wisdom": "sagesse", "skill": "compétence",
  
  // --- NATURE & ENVIRONMENT ---
  "nature": "nature", "environment": "environnement", "climate": "climat", "weather": "météo", "sun": "soleil",
  "moon": "lune", "star": "étoile", "earth": "terre", "ocean": "océan", "river": "rivière",
  "animal": "animal", "plant": "plante", "tree": "arbre", "flower": "fleur", "green": "vert",
  "energy": "énergie", "pollution": "pollution", "recycle": "recycler", "wildlife": "faune", "species": "espèces",

  // --- HEALTH & BODY ---
  "health": "santé", "medicine": "médecine", "hospital": "hôpital", "doctor": "docteur", "nurse": "infirmier",
  "patient": "patient", "disease": "maladie", "pain": "douleur", "fever": "fièvre", "body": "corps",
  "heart": "cœur", "brain": "cerveau", "blood": "sang", "muscle": "muscle", "bone": "os",
  "exercise": "exercice", "sleep": "dormir", "diet": "régime", "food": "nourriture", "water": "eau"
};

// --- GÉNÉRATION AUTOMATIQUE DE VARIANTES ---
// (On peut étendre ici avec des boucles pour ajouter des milliers de mots si besoin)

async function main() {
  console.log('🚀 Expansion massive du dictionnaire...');
  
  let dictionary = { ...DICT };
  
  // Fusionner avec l'existant si nécessaire
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
      dictionary = { ...dictionary, ...existing };
    } catch (e) {}
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary, null, 2), 'utf-8');
  console.log(`✅ Dictionnaire étendu à ${Object.keys(dictionary).length} mots clés stratégiques.`);
}

main();
