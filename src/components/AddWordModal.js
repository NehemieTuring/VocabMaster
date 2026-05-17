import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const AddWordModal = ({ visible, onClose, onSave, editingWord }) => {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const translationRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (editingWord) {
        setWord(editingWord.word);
        setTranslation(editingWord.translation);
      } else {
        setWord('');
        setTranslation('');
      }
      setError('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible, editingWord]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleSave = () => {
    if (!word.trim()) {
      setError('Veuillez entrer un mot');
      return;
    }
    setError('');
    onSave(word.trim(), translation.trim());
    setWord('');
    setTranslation('');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingWord ? 'Modifier le mot' : 'Nouveau mot'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="translate" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={word}
                  onChangeText={setWord}
                  placeholder="Ex: Hello"
                  placeholderTextColor={COLORS.textLight}
                  returnKeyType="next"
                  onSubmitEditing={() => translationRef.current?.focus()}
                  autoFocus={visible}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Traduction (optionnelle)</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="swap-horiz" size={20} color={COLORS.accent} style={styles.inputIcon} />
                <TextInput
                  ref={translationRef}
                  style={styles.input}
                  value={translation}
                  onChangeText={setTranslation}
                  placeholder="Ex: Bonjour"
                  placeholderTextColor={COLORS.textLight}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <MaterialIcons name={editingWord ? 'check' : 'add'} size={20} color={COLORS.white} />
              <Text style={styles.saveText}>
                {editingWord ? 'Enregistrer' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.spacing24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: SIZES.spacing12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing24,
    paddingTop: SIZES.spacing20,
    paddingBottom: SIZES.spacing12,
  },
  title: {
    fontSize: SIZES.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  closeBtn: {
    padding: SIZES.spacing4,
  },
  form: {
    paddingHorizontal: SIZES.spacing24,
  },
  inputGroup: {
    marginBottom: SIZES.spacing16,
  },
  label: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginBottom: SIZES.spacing8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.spacing12,
  },
  inputIcon: {
    marginRight: SIZES.spacing8,
  },
  input: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SIZES.spacing12,
    ...FONTS.regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: SIZES.spacing8,
  },
  errorText: {
    fontSize: SIZES.sm,
    color: COLORS.error,
    ...FONTS.medium,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing24,
    paddingTop: SIZES.spacing16,
    gap: SIZES.spacing12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SIZES.spacing12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    ...FONTS.semiBold,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SIZES.spacing12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary,
  },
  saveText: {
    fontSize: SIZES.md,
    color: COLORS.white,
    ...FONTS.semiBold,
  },
});

export default AddWordModal;
