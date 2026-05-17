import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Animated, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { addWord, getTotalWordsCount, getAllWords, getPendingTranslationCount } from '../database/db';
import { exportData } from '../utils/exportService';
import { importData } from '../utils/importService';

const AddWordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const translationRef = useRef(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      Animated.spring(formAnim, { toValue: 1, damping: 15, stiffness: 120, useNativeDriver: true }).start();
      getTotalWordsCount().then(setTotalWords);
      getPendingTranslationCount().then(setPendingCount);
      return () => { formAnim.setValue(0); };
    }, [])
  );

  const showSuccess = (msg = 'Mot ajouté avec succès !') => {
    setSuccess(msg);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSuccess(false));
  };

  const handleSave = async () => {
    if (!word.trim()) { setError('Veuillez entrer un mot'); return; }
    setError('');
    try {
      await addWord(word.trim(), translation.trim());
      setWord('');
      setTranslation('');
      setTotalWords(prev => prev + 1);
      if (!translation.trim()) {
        setPendingCount(prev => prev + 1);
        showSuccess('Mot ajouté ! Tu pourras le traduire plus tard.');
      } else {
        showSuccess('Mot ajouté avec succès !');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le mot.');
    }
  };

  const handleExport = async () => {
    try {
      const allWords = await getAllWords('word', 'ASC');
      if (allWords.length === 0) {
        Alert.alert('Export impossible', 'Aucun mot à exporter.');
        return;
      }

      Alert.alert(
        'Exporter le vocabulaire',
        'Choisissez le format d\'exportation :',
        [
          {
            text: 'Format CSV (Excel)',
            onPress: () => performExport(allWords, 'csv'),
          },
          {
            text: 'Format JSON',
            onPress: () => performExport(allWords, 'json'),
          },
          {
            text: 'Format Texte (Simple)',
            onPress: () => performExport(allWords, 'txt'),
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de préparer l'exportation.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await importData();
      if (result.success) {
        getTotalWordsCount().then(setTotalWords);
        getPendingTranslationCount().then(setPendingCount);
        let msg = `${result.count} mots ont été ajoutés.`;
        if (result.withoutTranslation > 0) {
          msg += `\n\n⏳ ${result.withoutTranslation} mots sans traduction — tu pourras les compléter dans "Mes mots".`;
        }
        Alert.alert('Import réussi', msg);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "L'importation a échoué.");
    }
  };

  const performExport = async (words, format) => {
    try {
      await exportData(words, format);
    } catch (err) {
      // Error is already handled in exportService
      console.error('Export failed:', err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Ajouter</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleImport} style={styles.headerBtn}>
            <MaterialIcons name="file-upload" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.headerBtn}>
            <MaterialIcons name="file-download" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.badge}>
            <MaterialIcons name="library-books" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>{totalWords} mot{totalWords !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Pending translations banner */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => navigation.navigate('Vocabulaire')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="pending-actions" size={18} color="#F59E0B" />
          <Text style={styles.pendingText}>
            {pendingCount} mot{pendingCount !== 1 ? 's' : ''} en attente de traduction
          </Text>
          <MaterialIcons name="arrow-forward-ios" size={14} color="#F59E0B" />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.formCard, {
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }]}>
            {/* Illustration */}
            <View style={styles.illustration}>
              <View style={styles.illustrationCircle}>
                <MaterialIcons name="translate" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.illustrationText}>Enrichis ton vocabulaire !</Text>
              <Text style={styles.illustrationSub}>Ajoute un mot et sa traduction, ou importe un fichier PDF/CSV/TXT.</Text>
            </View>

            {/* Word input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <MaterialIcons name="language" size={14} color={COLORS.primary} /> Mot original
              </Text>
              <View style={[styles.inputWrapper, word.length > 0 && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  value={word}
                  onChangeText={(t) => {
                    setWord(t); setError('');
                  }}
                  placeholder="Ex: Hello, Computer, Book..."
                  placeholderTextColor={COLORS.textLight}
                  returnKeyType="next"
                  onSubmitEditing={() => translationRef.current?.focus()}
                />
                {word.length > 0 && (
                  <TouchableOpacity onPress={() => setWord('')}>
                    <MaterialIcons name="close" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowCircle}>
                <MaterialIcons name="swap-vert" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.arrowLine} />
            </View>

            {/* Translation input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <MaterialIcons name="g-translate" size={14} color={COLORS.accent} /> Traduction (optionnelle)
              </Text>
              <View style={[styles.inputWrapper, translation.length > 0 && styles.inputWrapperFocusedAccent]}>
                <TextInput
                  ref={translationRef}
                  style={styles.input}
                  value={translation}
                  onChangeText={(t) => { setTranslation(t); setError(''); }}
                  placeholder="Ex: Bonjour, Ordinateur, Livre..."
                  placeholderTextColor={COLORS.textLight}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                {translation.length > 0 && (
                  <TouchableOpacity onPress={() => setTranslation('')}>
                    <MaterialIcons name="close" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Info */}
            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.infoText}>La traduction est optionnelle — tu pourras la compléter plus tard</Text>
            </View>

            {/* Save button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <MaterialIcons name="add-circle-outline" size={22} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Ajouter le mot</Text>
            </TouchableOpacity>

            {/* Import button */}
            <TouchableOpacity style={styles.importBtn} onPress={handleImport} activeOpacity={0.8}>
              <MaterialIcons name="upload-file" size={22} color={COLORS.primary} />
              <Text style={styles.importBtnText}>Importer depuis un fichier</Text>
            </TouchableOpacity>
            <Text style={styles.importHint}>PDF, CSV, JSON, TXT — plusieurs fichiers à la fois</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success toast */}
      {success && (
        <Animated.View style={[styles.successToast, {
          opacity: successAnim,
          transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
        }]}>
          <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
          <Text style={styles.successText}>{typeof success === 'string' ? success : 'Mot ajouté !'}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { padding: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.surface, borderRadius: 999, ...SIZES.shadowSm },
  badgeText: { fontSize: 12, color: COLORS.primary, ...FONTS.semiBold },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  pendingText: { flex: 1, fontSize: 13, color: '#92400E', ...FONTS.medium },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  formCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, ...SIZES.shadowMd },
  illustration: { alignItems: 'center', marginBottom: 24 },
  illustrationCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  illustrationText: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.bold },
  illustrationSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  inputGroup: { marginBottom: 8 },
  label: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.semiBold, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, paddingHorizontal: 14 },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: '#EBF2FF' },
  inputWrapperFocusedAccent: { borderColor: COLORS.accent, backgroundColor: '#FFF3E0' },
  input: { flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 14, ...FONTS.medium },
  arrowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  arrowLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: COLORS.border },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 8 },
  errorText: { fontSize: 12, color: COLORS.error, ...FONTS.medium },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 20 },
  infoText: { fontSize: 11, color: COLORS.textLight, ...FONTS.regular },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: COLORS.primary, borderRadius: 14 },
  saveBtnText: { fontSize: 16, color: COLORS.white, ...FONTS.bold },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 12, backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 2, borderColor: COLORS.primary },
  importBtnText: { fontSize: 15, color: COLORS.primary, ...FONTS.semiBold },
  importHint: { fontSize: 11, color: COLORS.textLight, textAlign: 'center', marginTop: 8, ...FONTS.regular },
  successToast: { position: 'absolute', bottom: 100, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: COLORS.success, borderRadius: 12, ...SIZES.shadowLg },
  successText: { fontSize: 14, color: COLORS.white, ...FONTS.semiBold },
});

export default AddWordScreen;
