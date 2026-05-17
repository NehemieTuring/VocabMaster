import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { addWordsBatch } from '../database/db';

/**
 * Service for importing vocabulary data from files.
 * Supports CSV, JSON, TXT and PDF formats.
 * Words can be imported WITHOUT a translation — the user can add it later.
 */
export const importData = async () => {
  try {
    let files = [];

    if (Platform.OS === 'web') {
      // On web, use a native file input for reliability
      files = await pickFilesWeb();
    } else {
      // On mobile, use expo-document-picker
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return { success: false, cancelled: true };
      }
      files = result.assets;
    }

    if (!files || files.length === 0) {
      return { success: false, cancelled: true };
    }

    let allWordsToImport = [];

    for (const asset of files) {
      const { uri, name, file: webFile } = asset;
      const extension = name.split('.').pop().toLowerCase();

      try {
        let wordsFromFile = [];

        if (extension === 'pdf') {
          if (Platform.OS === 'web' && webFile) {
            wordsFromFile = await parsePDFWeb(webFile);
          } else {
            wordsFromFile = await parsePDF(uri);
          }
        } else {
          // Read text-based files
          let content = '';
          if (Platform.OS === 'web' && webFile) {
            content = await webFile.text();
          } else if (Platform.OS === 'web') {
            const response = await fetch(uri);
            content = await response.text();
          } else {
            content = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          }

          if (extension === 'json') {
            wordsFromFile = parseJSON(content);
          } else if (extension === 'csv') {
            wordsFromFile = parseCSV(content);
          } else {
            wordsFromFile = parseTXT(content);
          }
        }

        allWordsToImport = [...allWordsToImport, ...wordsFromFile];
      } catch (fileErr) {
        console.error(`Error reading file ${name}:`, fileErr);
      }
    }

    if (allWordsToImport.length === 0) {
      Alert.alert('Import impossible', 'Aucun mot valide trouvé dans le(s) fichier(s).');
      return { success: false, count: 0 };
    }

    // Count how many have translations vs not
    const withTranslation = allWordsToImport.filter(w => w.translation).length;
    const withoutTranslation = allWordsToImport.length - withTranslation;

    let message = `${allWordsToImport.length} mots trouvés.`;
    if (withoutTranslation > 0) {
      message += `\n\n📝 ${withTranslation} avec traduction\n⏳ ${withoutTranslation} sans traduction (tu pourras les traduire plus tard)`;
    }

    // Confirm import
    return new Promise((resolve) => {
      Alert.alert(
        'Confirmer l\'importation',
        message,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve({ success: false, cancelled: true }) },
          {
            text: 'Importer',
            onPress: async () => {
              try {
                const count = await addWordsBatch(allWordsToImport);
                resolve({ success: true, count, withoutTranslation });
              } catch (err) {
                console.error('Batch import failed:', err);
                resolve({ success: false, error: err });
              }
            }
          }
        ]
      );
    });

  } catch (error) {
    console.error('Import Error:', error);
    Alert.alert('Erreur d\'importation', error.message || 'Une erreur est survenue.');
    return { success: false, error };
  }
};

/**
 * Web-only: Create a native <input type="file"> to pick files.
 * This is more reliable than expo-document-picker on web.
 */
const pickFilesWeb = () => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.csv,.json,.txt,.pdf,.tsv';
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const fileList = input.files;
      if (!fileList || fileList.length === 0) {
        resolve([]);
        return;
      }
      const files = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        files.push({
          uri: URL.createObjectURL(f),
          name: f.name,
          size: f.size,
          file: f, // Keep the raw File object for reading
        });
      }
      resolve(files);
    });

    // Handle cancel (user closes the dialog without selecting)
    input.addEventListener('cancel', () => {
      resolve([]);
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

/**
 * Parses a PDF file from a web File object.
 */
const parsePDFWeb = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawContent = extractTextFromPDFBuffer(new Uint8Array(arrayBuffer));
    if (!rawContent || rawContent.trim().length === 0) return [];
    return parseExtractedText(rawContent);
  } catch (err) {
    console.error('PDF parsing error (web):', err);
    return [];
  }
};

/**
 * Parses a PDF file by extracting text content (mobile).
 */
const parsePDF = async (uri) => {
  try {
    let rawContent = '';

    // Read PDF as base64, then decode to extract text
    const base64Content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    rawContent = extractTextFromPDFBuffer(bytes);

    if (!rawContent || rawContent.trim().length === 0) return [];
    return parseExtractedText(rawContent);

  } catch (err) {
    console.error('PDF parsing error:', err);
    return [];
  }
};

/**
 * Extract visible text from a PDF byte buffer.
 * Lightweight parser handling common PDF text operators (Tj, TJ, ', ").
 */
const extractTextFromPDFBuffer = (bytes) => {
  let pdfString = '';
  for (let i = 0; i < bytes.length; i++) {
    pdfString += String.fromCharCode(bytes[i]);
  }

  const textParts = [];

  // Strategy 1: Extract text between BT...ET blocks
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let btMatch;

  while ((btMatch = btEtRegex.exec(pdfString)) !== null) {
    const block = btMatch[1];

    // Match Tj operator: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodePDFString(tjMatch[1]);
      if (decoded.trim()) textParts.push(decoded.trim());
    }

    // Match TJ operator: [(text) num (text) ...] TJ
    const tjArrayRegex = /\[((?:[^]]*?))\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = tjArrMatch[1];
      const innerParts = [];
      const partRegex = /\(([^)]*)\)/g;
      let partMatch;
      while ((partMatch = partRegex.exec(inner)) !== null) {
        innerParts.push(decodePDFString(partMatch[1]));
      }
      const combined = innerParts.join('').trim();
      if (combined) textParts.push(combined);
    }

    // Match ' and " operators
    const quotRegex = /\(([^)]*)\)\s*['"]/g;
    let quotMatch;
    while ((quotMatch = quotRegex.exec(block)) !== null) {
      const decoded = decodePDFString(quotMatch[1]);
      if (decoded.trim()) textParts.push(decoded.trim());
    }
  }

  // Strategy 2: If BT/ET extraction yielded nothing, try global Tj
  if (textParts.length === 0) {
    const globalTjRegex = /\(([^)]{1,200})\)\s*Tj/g;
    let gMatch;
    while ((gMatch = globalTjRegex.exec(pdfString)) !== null) {
      const decoded = decodePDFString(gMatch[1]);
      if (decoded.trim()) textParts.push(decoded.trim());
    }
  }

  return textParts.join('\n');
};

/**
 * Decode PDF string escape sequences.
 */
const decodePDFString = (str) => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
};

/**
 * Parse extracted text into word entries.
 */
const parseExtractedText = (text) => {
  const lines = text.split(/\r?\n/);
  const words = [];
  const seen = new Set();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 2) continue;
    if (/^(page|chapitre|chapter|table|index|sommaire|\d+)$/i.test(line)) continue;
    if (/^\d+$/.test(line)) continue;

    const separators = [' : ', ' - ', ' = ', '\t', ' — ', ' – '];
    let found = false;

    for (const sep of separators) {
      const idx = line.indexOf(sep);
      if (idx > 0 && idx < line.length - sep.length) {
        const word = line.substring(0, idx).trim();
        const translation = line.substring(idx + sep.length).trim();
        if (word && word.length >= 2 && !seen.has(word.toLowerCase())) {
          seen.add(word.toLowerCase());
          words.push({ word, translation: translation || '' });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      if (line.includes(',')) {
        const parts = line.split(',');
        for (const part of parts) {
          const w = part.trim();
          if (w && w.length >= 2 && !seen.has(w.toLowerCase())) {
            seen.add(w.toLowerCase());
            words.push({ word: w, translation: '' });
          }
        }
      } else {
        if (!seen.has(line.toLowerCase())) {
          seen.add(line.toLowerCase());
          words.push({ word: line, translation: '' });
        }
      }
    }
  }

  return words;
};

/**
 * Parses JSON content.
 */
const parseJSON = (content) => {
  try {
    const data = JSON.parse(content);
    const list = Array.isArray(data) ? data : (data.words || []);
    return list
      .map(item => ({
        word: (item.word || item.mot || '').trim(),
        translation: (item.translation || item.traduction || '').trim()
      }))
      .filter(item => item.word);
  } catch (e) {
    throw new Error('Format JSON invalide.');
  }
};

/**
 * Parses CSV content.
 */
const parseCSV = (content) => {
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/);
  const words = [];

  let startIndex = 0;
  if (lines.length > 0 && (lines[0].toLowerCase().includes('mot') || lines[0].toLowerCase().includes('word'))) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    if (parts.length >= 2) {
      const word = parts[0].replace(/^"|"$/g, '').trim();
      const translation = parts[1].replace(/^"|"$/g, '').trim();
      if (word) {
        words.push({ word, translation: translation || '' });
      }
    } else if (parts.length === 1) {
      const word = parts[0].replace(/^"|"$/g, '').trim();
      if (word) {
        words.push({ word, translation: '' });
      }
    }
  }
  return words;
};

/**
 * Parses TXT content.
 */
const parseTXT = (content) => {
  const lines = content.split(/\r?\n/);
  const words = [];

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 2) continue;

    const separators = [' : ', ':', ' - ', '\t', ' = '];
    let found = false;

    for (const sep of separators) {
      const idx = cleanLine.indexOf(sep);
      if (idx > 0 && idx < cleanLine.length - sep.length) {
        const word = cleanLine.substring(0, idx).trim();
        const translation = cleanLine.substring(idx + sep.length).trim();
        if (word) {
          words.push({ word, translation: translation || '' });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      words.push({ word: cleanLine, translation: '' });
    }
  }
  return words;
};
