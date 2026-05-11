import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Service for exporting vocabulary data in different formats.
 */
export const exportData = async (words, format = 'csv') => {
  try {
    if (!words || words.length === 0) {
      throw new Error('No data to export');
    }

    let content = '';
    let fileName = `vocabulaire_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(words, null, 2);
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
        const header = 'Mot,Traduction,Niveau,Date de création';
        const rows = words.map(w => 
          `"${w.word.replace(/"/g, '""')}","${w.translation.replace(/"/g, '""')}",${w.level || 0},"${w.created_at}"`
        );
        content = [header, ...rows].join('\n');
        fileName += '.csv';
        mimeType = 'text/csv';
        break;
    }

    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } else {
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Exporter le vocabulaire (${format.toUpperCase()})`,
          UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text', // for iOS
        });
        return true;
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Export Error:', error);
    throw error;
  }
};
