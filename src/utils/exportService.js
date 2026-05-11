import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Service for exporting vocabulary data in different formats.
 * Uses expo-file-system to write to the app's cache directory,
 * then expo-sharing to let the user save/share the file.
 */
export const exportData = async (words, format = 'csv') => {
  try {
    if (!words || words.length === 0) {
      Alert.alert('Export impossible', 'Aucun mot à exporter.');
      return false;
    }

    let content = '';
    let fileName = `vocabulaire_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(
          words.map(w => ({
            mot: w.word,
            traduction: w.translation,
            niveau: w.level || 0,
            serie: w.streak || 0,
            date_creation: w.created_at || '',
          })),
          null,
          2
        );
        fileName += '.json';
        mimeType = 'application/json';
        break;

      case 'txt':
        content = words.map(w => `${w.word} : ${w.translation}`).join('\n');
        fileName += '.txt';
        mimeType = 'text/plain';
        break;

      case 'csv':
      default:
        // Use BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const header = 'Mot,Traduction,Niveau,Serie,Date de création';
        const rows = words.map(w => {
          const word = (w.word || '').replace(/"/g, '""');
          const translation = (w.translation || '').replace(/"/g, '""');
          const level = w.level || 0;
          const streak = w.streak || 0;
          const createdAt = w.created_at || '';
          return `"${word}","${translation}",${level},${streak},"${createdAt}"`;
        });
        content = BOM + [header, ...rows].join('\n');
        fileName += '.csv';
        mimeType = 'text/csv';
        break;
    }

    // Web platform: download via blob
    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      } catch (webError) {
        console.error('Web export error:', webError);
        Alert.alert('Erreur', "L'exportation web a échoué.");
        return false;
      }
    }

    // Native platform (Android / iOS): write file then share
    const fileUri = FileSystem.cacheDirectory + fileName;

    // Write file content
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Verify file was written
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Le fichier n\'a pas pu être créé.');
    }

    console.log(`File written: ${fileUri} (${fileInfo.size} bytes)`);

    // Share the file
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert(
        'Partage non disponible',
        'Le partage de fichiers n\'est pas disponible sur cet appareil. ' +
        `Le fichier a été sauvegardé ici :\n${fileUri}`
      );
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Exporter le vocabulaire (${format.toUpperCase()})`,
      UTI: getUTI(format),
    });

    return true;
  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert(
      'Erreur d\'exportation',
      `Impossible d'exporter le fichier.\n\nDétails : ${error.message || 'Erreur inconnue'}`
    );
    return false;
  }
};

/**
 * Returns the UTI (Uniform Type Identifier) for iOS file sharing.
 */
function getUTI(format) {
  switch (format.toLowerCase()) {
    case 'json':
      return 'public.json';
    case 'csv':
      return 'public.comma-separated-values-text';
    case 'txt':
      return 'public.plain-text';
    default:
      return 'public.data';
  }
}
