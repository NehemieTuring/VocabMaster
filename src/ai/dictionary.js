/**
 * Dictionnaire EN ↔ FR pour traduction hors-ligne.
 * 
 * Charge le dictionnaire complet depuis assets/dictionary_full.json
 * (généré par scripts/buildDictionary.js) avec fallback sur le 
 * dictionnaire de base intégré.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// ================================================================
// Dictionnaire de base intégré (fallback ~500 mots)
// ================================================================
const BASE_DICTIONARY = {
  // --- Greetings & Basics ---
  "hello": "bonjour", "hi": "salut", "goodbye": "au revoir",
  "please": "s'il vous plaît", "thank you": "merci", "thanks": "merci",
  "sorry": "désolé", "yes": "oui", "no": "non",
  "good morning": "bonjour", "good evening": "bonsoir", "good night": "bonne nuit",
  "welcome": "bienvenue", "fine": "bien", "great": "super",

  // --- Common Verbs ---
  "to be": "être", "to have": "avoir", "to do": "faire", "to go": "aller",
  "to come": "venir", "to see": "voir", "to know": "savoir",
  "to want": "vouloir", "to say": "dire", "to give": "donner",
  "to take": "prendre", "to make": "faire", "to find": "trouver",
  "to think": "penser", "to ask": "demander", "to work": "travailler",
  "to try": "essayer", "to feel": "sentir", "to become": "devenir",
  "to leave": "partir", "to keep": "garder", "to begin": "commencer",
  "to show": "montrer", "to play": "jouer", "to run": "courir",
  "to live": "vivre", "to write": "écrire", "to lose": "perdre",
  "to pay": "payer", "to learn": "apprendre", "to change": "changer",
  "to understand": "comprendre", "to watch": "regarder", "to read": "lire",
  "to walk": "marcher", "to win": "gagner", "to teach": "enseigner",
  "to love": "aimer", "to buy": "acheter", "to wait": "attendre",
  "to send": "envoyer", "to build": "construire", "to stay": "rester",
  "to eat": "manger", "to drink": "boire", "to sleep": "dormir",
  "to sing": "chanter", "to dance": "danser", "to swim": "nager",
  "to fly": "voler", "to drive": "conduire", "to cook": "cuisiner",
  "to clean": "nettoyer", "to sell": "vendre", "to laugh": "rire",
  "to cry": "pleurer", "to smile": "sourire", "to dream": "rêver",
  "to forget": "oublier", "to choose": "choisir", "to help": "aider",
  "to answer": "répondre", "to travel": "voyager", "to study": "étudier",
  "to speak": "parler", "to open": "ouvrir", "to close": "fermer",
  "to finish": "finir", "to explain": "expliquer",

  // --- Family ---
  "family": "famille", "mother": "mère", "father": "père",
  "son": "fils", "daughter": "fille", "brother": "frère", "sister": "sœur",
  "husband": "mari", "wife": "femme", "child": "enfant", "baby": "bébé",
  "parents": "parents", "uncle": "oncle", "aunt": "tante",

  // --- Body ---
  "head": "tête", "face": "visage", "eye": "œil", "nose": "nez",
  "mouth": "bouche", "ear": "oreille", "hand": "main", "arm": "bras",
  "leg": "jambe", "foot": "pied", "heart": "cœur", "tooth": "dent",

  // --- Food ---
  "food": "nourriture", "water": "eau", "bread": "pain", "milk": "lait",
  "cheese": "fromage", "meat": "viande", "fish": "poisson", "rice": "riz",
  "egg": "œuf", "fruit": "fruit", "apple": "pomme", "banana": "banane",
  "orange": "orange", "sugar": "sucre", "salt": "sel", "coffee": "café",
  "tea": "thé", "cake": "gâteau", "chocolate": "chocolat",
  "soup": "soupe", "salad": "salade",

  // --- House ---
  "house": "maison", "room": "chambre", "door": "porte",
  "window": "fenêtre", "kitchen": "cuisine", "bathroom": "salle de bain",
  "table": "table", "chair": "chaise", "bed": "lit", "key": "clé",

  // --- Nature ---
  "sun": "soleil", "moon": "lune", "star": "étoile", "sky": "ciel",
  "cloud": "nuage", "rain": "pluie", "snow": "neige", "wind": "vent",
  "fire": "feu", "tree": "arbre", "flower": "fleur", "sea": "mer",
  "river": "rivière", "mountain": "montagne", "forest": "forêt",

  // --- Animals ---
  "dog": "chien", "cat": "chat", "bird": "oiseau", "horse": "cheval",
  "cow": "vache", "pig": "cochon", "sheep": "mouton", "fish": "poisson",
  "rabbit": "lapin", "lion": "lion", "bear": "ours", "elephant": "éléphant",
  "monkey": "singe", "snake": "serpent", "mouse": "souris",

  // --- Colors ---
  "red": "rouge", "blue": "bleu", "green": "vert", "yellow": "jaune",
  "black": "noir", "white": "blanc", "brown": "marron", "pink": "rose",
  "purple": "violet", "orange": "orange", "grey": "gris",

  // --- Common Adjectives ---
  "big": "grand", "small": "petit", "long": "long", "short": "court",
  "old": "vieux", "young": "jeune", "new": "nouveau", "good": "bon",
  "bad": "mauvais", "hot": "chaud", "cold": "froid", "beautiful": "beau",
  "ugly": "laid", "easy": "facile", "hard": "difficile", "fast": "rapide",
  "slow": "lent", "strong": "fort", "weak": "faible", "happy": "heureux",
  "sad": "triste", "angry": "en colère", "tired": "fatigué",
  "rich": "riche", "poor": "pauvre", "clean": "propre", "dirty": "sale",
  "light": "léger", "heavy": "lourd", "dark": "sombre",
  "true": "vrai", "false": "faux", "free": "libre",
  "important": "important", "different": "différent",
  "nice": "gentil", "funny": "drôle", "safe": "sûr",
  "dangerous": "dangereux", "ready": "prêt",

  // --- Numbers ---
  "one": "un", "two": "deux", "three": "trois", "four": "quatre",
  "five": "cinq", "six": "six", "seven": "sept", "eight": "huit",
  "nine": "neuf", "ten": "dix", "hundred": "cent", "thousand": "mille",

  // --- Time ---
  "time": "temps", "day": "jour", "night": "nuit", "morning": "matin",
  "week": "semaine", "month": "mois", "year": "année",
  "today": "aujourd'hui", "tomorrow": "demain", "yesterday": "hier",
  "now": "maintenant", "always": "toujours", "never": "jamais",
  "hour": "heure", "minute": "minute",

  // --- School ---
  "book": "livre", "pen": "stylo", "paper": "papier", "word": "mot",
  "letter": "lettre", "question": "question", "answer": "réponse",
  "student": "étudiant", "teacher": "professeur",
  "computer": "ordinateur", "phone": "téléphone",
  "music": "musique", "movie": "film", "game": "jeu",

  // --- City ---
  "city": "ville", "street": "rue", "car": "voiture", "bus": "bus",
  "train": "train", "airplane": "avion", "school": "école",
  "hospital": "hôpital", "shop": "magasin", "bank": "banque",

  // --- Abstract ---
  "love": "amour", "life": "vie", "death": "mort", "friend": "ami",
  "hope": "espoir", "fear": "peur", "peace": "paix",
  "truth": "vérité", "dream": "rêve", "name": "nom",
  "money": "argent", "work": "travail",
};

// ================================================================
// État du dictionnaire (chargé dynamiquement)
// ================================================================
let fullDictionary = { ...BASE_DICTIONARY };
let reverseDictionary = {};
let isLoaded = false;

/**
 * Construit le dictionnaire inversé (FR → EN).
 */
const buildReverseDictionary = () => {
  reverseDictionary = {};
  Object.entries(fullDictionary).forEach(([en, fr]) => {
    const frKey = fr.split('/')[0].toLowerCase().trim();
    if (!reverseDictionary[frKey]) {
      reverseDictionary[frKey] = en;
    }
  });
};

// Initialiser avec le dictionnaire de base
buildReverseDictionary();

/**
 * Charge le dictionnaire complet depuis le fichier JSON.
 * Appelé au démarrage de l'app.
 */
export const loadFullDictionary = async () => {
  if (isLoaded) return;

  try {
    if (Platform.OS === 'web') {
      // Sur web, tenter de charger via fetch
      try {
        const response = await fetch('/assets/dictionary_full.json');
        if (response.ok) {
          const data = await response.json();
          fullDictionary = { ...BASE_DICTIONARY, ...data };
          buildReverseDictionary();
          isLoaded = true;
          console.log(`📖 Dictionnaire complet chargé: ${Object.keys(fullDictionary).length} mots`);
        }
      } catch (e) {
        console.log('📖 Utilisation du dictionnaire de base (web)');
      }
    } else {
      // Sur mobile, charger depuis le système de fichiers
      const dictPath = FileSystem.documentDirectory + 'dictionary_full.json';
      const fileInfo = await FileSystem.getInfoAsync(dictPath);

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(dictPath);
        const data = JSON.parse(content);
        fullDictionary = { ...BASE_DICTIONARY, ...data };
        buildReverseDictionary();
        isLoaded = true;
        console.log(`📖 Dictionnaire complet chargé: ${Object.keys(fullDictionary).length} mots`);
      } else {
        // Essayer de copier depuis les assets
        try {
          const asset = Asset.fromModule(require('../../assets/dictionary_full.json'));
          await asset.downloadAsync();
          if (asset.localUri) {
            await FileSystem.copyAsync({ from: asset.localUri, to: dictPath });
            const content = await FileSystem.readAsStringAsync(dictPath);
            const data = JSON.parse(content);
            fullDictionary = { ...BASE_DICTIONARY, ...data };
            buildReverseDictionary();
            isLoaded = true;
            console.log(`📖 Dictionnaire copié et chargé: ${Object.keys(fullDictionary).length} mots`);
          }
        } catch (e) {
          console.log('📖 Utilisation du dictionnaire de base (mobile)');
        }
      }
    }
  } catch (e) {
    console.log('📖 Erreur de chargement, utilisation du dictionnaire de base');
  }

  if (!isLoaded) {
    isLoaded = true; // Ne pas retenter
    console.log(`📖 Dictionnaire de base: ${Object.keys(fullDictionary).length} mots`);
  }
};

/**
 * Importe un dictionnaire personnalisé (JSON object {en: fr}).
 * Utilisé pour ajouter des mots depuis un fichier importé par l'utilisateur.
 */
export const importDictionary = async (data) => {
  fullDictionary = { ...fullDictionary, ...data };
  buildReverseDictionary();

  // Sauvegarder sur mobile
  if (Platform.OS !== 'web') {
    try {
      const dictPath = FileSystem.documentDirectory + 'dictionary_full.json';
      await FileSystem.writeAsStringAsync(dictPath, JSON.stringify(fullDictionary));
    } catch (e) {
      console.error('Erreur sauvegarde dictionnaire:', e);
    }
  }

  return Object.keys(fullDictionary).length;
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 */
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
    }
  }
  return matrix[a.length][b.length];
};

/**
 * Recherche un mot dans le dictionnaire avec tolérance fuzzy.
 */
export const lookupWord = (word, sourceLang = 'en') => {
  const normalized = word.trim().toLowerCase();
  const dict = sourceLang === 'en' ? fullDictionary : reverseDictionary;

  // Exact match
  if (dict[normalized]) {
    return { translation: dict[normalized], confidence: 1.0, exact: true };
  }

  // Fuzzy match (only for short words to avoid performance issues)
  if (normalized.length > 20) return null;

  let bestMatch = null;
  let bestDistance = Infinity;
  const maxDistance = Math.max(1, Math.floor(normalized.length * 0.3));

  for (const key of Object.keys(dict)) {
    // Skip keys that are too different in length
    if (Math.abs(key.length - normalized.length) > maxDistance) continue;
    const dist = levenshtein(normalized, key);
    if (dist < bestDistance && dist <= maxDistance) {
      bestDistance = dist;
      bestMatch = key;
    }
  }

  if (bestMatch) {
    return {
      translation: dict[bestMatch],
      confidence: 1 - (bestDistance / Math.max(normalized.length, bestMatch.length)),
      exact: false,
      suggestion: bestMatch,
    };
  }

  return null;
};

/**
 * Retourne des mots aléatoires du dictionnaire pour générer des distracteurs.
 */
export const getRandomWords = (count = 4, excludeWords = [], lang = 'fr') => {
  const dict = lang === 'fr' ? Object.values(fullDictionary) : Object.keys(fullDictionary);
  const filtered = dict.filter(w => !excludeWords.includes(w.toLowerCase()));
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Retourne la taille du dictionnaire.
 */
export const getDictionarySize = () => Object.keys(fullDictionary).length;

/**
 * Retourne si le dictionnaire complet est chargé.
 */
export const isDictionaryLoaded = () => isLoaded;

export { fullDictionary as DICTIONARY, reverseDictionary as REVERSE_DICTIONARY };
