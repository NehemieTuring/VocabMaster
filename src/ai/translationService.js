/**
 * Service de traduction hors-ligne pour VocabMaster.
 * Utilise le dictionnaire local embarqué.
 */
import { lookupWord, getDictionarySize } from './dictionary';

/**
 * Détecte automatiquement la langue d'un mot (EN ou FR).
 * Utilise des heuristiques simples basées sur les caractères et patterns.
 */
export const detectLanguage = (text) => {
  const normalized = text.trim().toLowerCase();

  // Caractères spéciaux français
  const frenchChars = /[àâäéèêëïîôùûüÿçœæ]/;
  if (frenchChars.test(normalized)) return 'fr';

  // Patterns typiquement français
  const frenchPatterns = /\b(le|la|les|un|une|des|du|au|aux|ce|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|je|tu|il|elle|nous|vous|ils|elles|qui|que|où|dont|est|sont|avoir|être|faire|aller)\b/;
  if (frenchPatterns.test(normalized)) return 'fr';

  // Essayer de trouver dans les deux dictionnaires
  const enResult = lookupWord(normalized, 'en');
  const frResult = lookupWord(normalized, 'fr');

  if (enResult?.exact && !frResult?.exact) return 'en';
  if (frResult?.exact && !enResult?.exact) return 'fr';
  if (enResult?.confidence > (frResult?.confidence || 0)) return 'en';
  if (frResult?.confidence > (enResult?.confidence || 0)) return 'fr';

  // Par défaut, on suppose l'anglais
  return 'en';
};

/**
 * Traduit un mot hors-ligne.
 * @param {string} text - Le mot ou expression à traduire
 * @param {string} [targetLang] - Langue cible ('en' ou 'fr'). Si omis, auto-détecte.
 * @returns {{ translation: string, sourceLang: string, targetLang: string, confidence: number, exact: boolean, suggestion?: string }}
 */
export const translateOffline = (text, targetLang = null) => {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return { translation: '', sourceLang: 'en', targetLang: 'fr', confidence: 0, exact: false };
  }

  // Auto-detect source language
  const sourceLang = targetLang
    ? (targetLang === 'fr' ? 'en' : 'fr')
    : detectLanguage(normalized);

  const actualTarget = targetLang || (sourceLang === 'en' ? 'fr' : 'en');

  const result = lookupWord(normalized, sourceLang);

  if (result) {
    return {
      translation: result.translation,
      sourceLang,
      targetLang: actualTarget,
      confidence: result.confidence,
      exact: result.exact,
      suggestion: result.suggestion,
    };
  }

  return {
    translation: null,
    sourceLang,
    targetLang: actualTarget,
    confidence: 0,
    exact: false,
  };
};

/**
 * Traduit automatiquement pour l'écran AddWord.
 * Retourne un objet prêt à être affiché.
 */
export const autoTranslate = (word) => {
  if (!word || word.trim().length < 2) return null;

  const result = translateOffline(word);

  if (result.translation && result.confidence >= 0.6) {
    return {
      translation: result.translation,
      confidence: result.confidence,
      isExact: result.exact,
      sourceLang: result.sourceLang === 'en' ? 'Anglais' : 'Français',
      targetLang: result.targetLang === 'en' ? 'Anglais' : 'Français',
      suggestion: result.suggestion,
    };
  }

  return null;
};

/**
 * Info sur le service de traduction.
 */
export const getTranslationInfo = () => ({
  type: 'offline',
  dictionarySize: getDictionarySize(),
  languages: ['en', 'fr'],
  features: ['auto-detect', 'fuzzy-match'],
});
