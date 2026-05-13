/**
 * Moteur de génération d'exercices de vocabulaire IA (hors-ligne).
 * Génère 6 types d'exercices variés à partir de la base de mots de l'utilisateur.
 */
import { getRandomWords, DICTIONARY } from './dictionary';

// --- Modèles de phrases pour exercices à trous ---
const SENTENCE_TEMPLATES_EN = [
  { template: "I would like to ___ this book.", validWords: ["read", "buy", "find", "open"] },
  { template: "She ___ to school every day.", validWords: ["go", "walk", "run", "drive"] },
  { template: "The ___ is shining today.", validWords: ["sun"] },
  { template: "He ___ a cup of coffee.", validWords: ["drink", "want", "make", "buy"] },
  { template: "We ___ in a big city.", validWords: ["live", "work", "stay"] },
  { template: "They ___ football every weekend.", validWords: ["play"] },
  { template: "The ___ is very beautiful.", validWords: ["flower", "house", "garden", "sky", "star"] },
  { template: "I ___ my homework after school.", validWords: ["do", "finish"] },
  { template: "Can you ___ me, please?", validWords: ["help", "hear", "see", "call"] },
  { template: "The ___ flew over the mountain.", validWords: ["bird", "airplane"] },
  { template: "She likes to ___ in the pool.", validWords: ["swim"] },
  { template: "He ___ a letter to his friend.", validWords: ["write", "send"] },
  { template: "I want to ___ a new language.", validWords: ["learn", "speak", "study", "teach"] },
  { template: "The ___ is full of stars.", validWords: ["sky"] },
  { template: "We need to ___ some food.", validWords: ["buy", "cook", "find", "eat"] },
  { template: "My ___ is very kind.", validWords: ["mother", "father", "friend", "teacher", "sister", "brother"] },
  { template: "I ___ very happy today.", validWords: ["feel"] },
  { template: "The children ___ in the park.", validWords: ["play", "run", "walk", "sing", "dance"] },
  { template: "She ___ the door quietly.", validWords: ["open", "close"] },
  { template: "He ___ breakfast every morning.", validWords: ["eat", "cook", "make"] },
];

const SENTENCE_TEMPLATES_FR = [
  { template: "Je voudrais ___ ce livre.", validWords: ["lire", "acheter", "trouver", "ouvrir"] },
  { template: "Elle ___ à l'école tous les jours.", validWords: ["aller", "marcher", "courir"] },
  { template: "Le ___ brille aujourd'hui.", validWords: ["soleil"] },
  { template: "Il ___ une tasse de café.", validWords: ["boire", "vouloir"] },
  { template: "Nous ___ dans une grande ville.", validWords: ["vivre", "travailler", "rester"] },
  { template: "La ___ est très belle.", validWords: ["fleur", "maison", "étoile"] },
  { template: "Je fais mes ___ après l'école.", validWords: ["devoirs"] },
  { template: "Peux-tu m' ___ s'il te plaît ?", validWords: ["aider"] },
  { template: "Il ___ une lettre à son ami.", validWords: ["écrire", "envoyer"] },
  { template: "Je veux ___ une nouvelle langue.", validWords: ["apprendre", "parler", "étudier"] },
  { template: "Ma ___ est très gentille.", validWords: ["mère", "sœur"] },
  { template: "Les enfants ___ dans le parc.", validWords: ["jouer", "courir", "marcher", "chanter", "danser"] },
];

// --- Groupes de synonymes ---
const SYNONYM_GROUPS_EN = [
  ["big", "large", "huge", "great"],
  ["small", "little", "tiny"],
  ["happy", "glad", "joyful"],
  ["sad", "unhappy", "sorrowful"],
  ["fast", "quick", "rapid", "swift"],
  ["beautiful", "pretty", "lovely", "gorgeous"],
  ["start", "begin", "commence"],
  ["end", "finish", "complete"],
  ["smart", "intelligent", "clever", "bright"],
  ["angry", "mad", "furious"],
];

const SYNONYM_GROUPS_FR = [
  ["grand", "gros", "énorme"],
  ["petit", "minuscule"],
  ["content", "heureux", "joyeux"],
  ["triste", "malheureux"],
  ["rapide", "vite"],
  ["beau", "joli", "magnifique"],
  ["commencer", "débuter"],
  ["finir", "terminer", "achever"],
  ["intelligent", "malin", "astucieux"],
  ["fâché", "en colère", "furieux"],
];

/**
 * Mélange un tableau (Fisher-Yates).
 */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Sélectionne N éléments aléatoires d'un tableau.
 */
const pickRandom = (arr, n = 1) => shuffle(arr).slice(0, n);

/**
 * Génère un exercice de type QCM (Multiple Choice).
 */
const generateMultipleChoice = (word, allWords) => {
  const isWordToTranslation = Math.random() > 0.5;
  const question = isWordToTranslation ? word.word : word.translation;
  const correctAnswer = isWordToTranslation ? word.translation : word.word;

  // Distracteurs depuis les mots de l'utilisateur
  const otherWords = allWords.filter(w => w.id !== word.id);
  const distractorsFromUser = pickRandom(otherWords, 2).map(w =>
    isWordToTranslation ? w.translation : w.word
  );

  // Distracteur depuis le dictionnaire
  const dictDistractors = getRandomWords(
    3 - distractorsFromUser.length,
    [correctAnswer.toLowerCase(), ...distractorsFromUser.map(d => d.toLowerCase())],
    isWordToTranslation ? 'fr' : 'en'
  );

  const allChoices = shuffle([correctAnswer, ...distractorsFromUser, ...dictDistractors].slice(0, 4));

  return {
    type: 'multiple_choice',
    question: isWordToTranslation
      ? `Quelle est la traduction de "${question}" ?`
      : `Quel mot anglais correspond à "${question}" ?`,
    prompt: question,
    choices: allChoices,
    correctAnswer,
    direction: isWordToTranslation ? 'en→fr' : 'fr→en',
    wordId: word.id,
  };
};

/**
 * Génère un exercice de type phrase à trous.
 */
const generateFillBlank = (word) => {
  const useEnglish = Math.random() > 0.5;
  const templates = useEnglish ? SENTENCE_TEMPLATES_EN : SENTENCE_TEMPLATES_FR;
  const targetWord = useEnglish ? word.word.toLowerCase() : word.translation.toLowerCase();

  // Chercher un template compatible
  let matchingTemplate = templates.find(t =>
    t.validWords.some(v => v === targetWord)
  );

  // Si pas de template compatible, en créer un simple
  if (!matchingTemplate) {
    if (useEnglish) {
      matchingTemplate = {
        template: `The word "___ " means "${word.translation}" in French.`,
        validWords: [word.word.toLowerCase()],
      };
    } else {
      matchingTemplate = {
        template: `Le mot "___ " signifie "${word.word}" en anglais.`,
        validWords: [word.translation.toLowerCase()],
      };
    }
  }

  return {
    type: 'fill_blank',
    question: `Complète la phrase avec le bon mot :`,
    sentence: matchingTemplate.template,
    correctAnswer: targetWord,
    hint: useEnglish ? word.translation : word.word,
    hintLabel: useEnglish ? 'Indice (FR)' : 'Indice (EN)',
    wordId: word.id,
  };
};

/**
 * Génère un exercice de type traduction classique.
 */
const generateTranslation = (word) => {
  const isWordToTranslation = Math.random() > 0.5;
  return {
    type: 'translation',
    question: isWordToTranslation
      ? `Traduis en français :`
      : `Traduis en anglais :`,
    prompt: isWordToTranslation ? word.word : word.translation,
    correctAnswer: isWordToTranslation ? word.translation : word.word,
    direction: isWordToTranslation ? 'en→fr' : 'fr→en',
    wordId: word.id,
  };
};

/**
 * Génère un exercice d'association (Match Pairs).
 */
const generateMatchPairs = (words) => {
  const selected = pickRandom(words, Math.min(4, words.length));
  const pairs = selected.map(w => ({
    id: w.id,
    word: w.word,
    translation: w.translation,
  }));

  return {
    type: 'match_pairs',
    question: 'Associe chaque mot à sa traduction :',
    pairs,
    shuffledWords: shuffle(pairs.map(p => ({ id: p.id, text: p.word }))),
    shuffledTranslations: shuffle(pairs.map(p => ({ id: p.id, text: p.translation }))),
  };
};

/**
 * Génère un exercice de type contexte (choisir le bon mot).
 */
const generateContextChoice = (word, allWords) => {
  const contexts = [
    { en: `Which word best fits: "I ___ very ___ today"`, answer: "happy", category: "emotion" },
    { en: `In the kitchen, you would find:`, answer: "food", category: "place" },
    { en: `At school, you would use a:`, answer: "book", category: "object" },
  ];

  // Fallback: QCM contextuel simple
  const isEn = Math.random() > 0.5;
  const prompt = isEn ? word.word : word.translation;
  const correct = isEn ? word.translation : word.word;

  const others = allWords.filter(w => w.id !== word.id);
  const distractors = pickRandom(others, 3).map(w => isEn ? w.translation : w.word);
  const choices = shuffle([correct, ...distractors].slice(0, 4));

  return {
    type: 'context_choice',
    question: isEn
      ? `"${prompt}" — Sélectionne la bonne traduction :`
      : `"${prompt}" — Select the correct translation:`,
    prompt,
    choices,
    correctAnswer: correct,
    direction: isEn ? 'en→fr' : 'fr→en',
    wordId: word.id,
  };
};

/**
 * Génère un set complet d'exercices variés.
 * @param {Array} words - Les mots de l'utilisateur depuis la BDD
 * @param {number} count - Nombre d'exercices à générer
 * @returns {Array} Liste d'exercices
 */
export const generateExercises = (words, count = 10) => {
  if (!words || words.length === 0) return [];

  const exercises = [];
  const exerciseTypes = ['multiple_choice', 'translation', 'fill_blank', 'context_choice'];

  // Ajouter match_pairs si assez de mots
  if (words.length >= 4) {
    exerciseTypes.push('match_pairs');
  }

  // Pondérer par streak (favoriser les mots difficiles)
  const weightedWords = words.map(w => ({
    ...w,
    weight: w.streak === 0 ? 10 : (w.streak < 3 ? 8 : (w.streak < 5 ? 4 : 1)),
  }));

  const selectWeightedWord = () => {
    const total = weightedWords.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weightedWords) {
      r -= w.weight;
      if (r <= 0) return w;
    }
    return weightedWords[0];
  };

  for (let i = 0; i < count; i++) {
    const type = exerciseTypes[i % exerciseTypes.length];
    const word = selectWeightedWord();

    let exercise;
    switch (type) {
      case 'multiple_choice':
        exercise = generateMultipleChoice(word, words);
        break;
      case 'translation':
        exercise = generateTranslation(word);
        break;
      case 'fill_blank':
        exercise = generateFillBlank(word);
        break;
      case 'match_pairs':
        exercise = generateMatchPairs(words);
        break;
      case 'context_choice':
        exercise = generateContextChoice(word, words);
        break;
      default:
        exercise = generateTranslation(word);
    }

    exercises.push({ ...exercise, index: i });
  }

  return shuffle(exercises);
};

/**
 * Génère des exercices de "découverte" basés sur les mots du dictionnaire complet
 * que l'utilisateur n'a pas encore ajoutés à sa liste.
 */
export const generateDiscoveryExercises = (userWords, count = 5) => {
  const userWordSet = new Set(userWords.map(w => w.word.toLowerCase()));
  const allDictWords = Object.keys(DICTIONARY);
  
  // Filtrer les mots que l'utilisateur connaît déjà
  const unknownWords = allDictWords.filter(w => !userWordSet.has(w.toLowerCase()));
  
  if (unknownWords.length === 0) return [];

  // Sélectionner des mots au hasard parmi les inconnus
  const selectedWords = pickRandom(unknownWords, count);
  const discoveryExercises = [];

  selectedWords.forEach((enWord, i) => {
    const frWord = DICTIONARY[enWord];
    // Créer un objet "mot virtuel" pour les générateurs existants
    const virtualWord = {
      id: `discovery-${i}`,
      word: enWord,
      translation: frWord,
      streak: 0
    };

    // Utiliser le QCM pour la découverte
    const exercise = generateMultipleChoice(virtualWord, userWords);
    exercise.isDiscovery = true;
    exercise.question = `✨ NOUVEAU MOT : ${exercise.question}`;
    discoveryExercises.push(exercise);
  });

  return discoveryExercises;
};

/**
 * Info sur le moteur d'exercices.
 */
export const getExerciseEngineInfo = () => ({
  types: ['multiple_choice', 'translation', 'fill_blank', 'match_pairs', 'context_choice'],
  version: '1.0.0',
  mode: 'offline',
  features: ['weighted-selection', 'streak-aware', 'mixed-directions'],
});
