import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
  TextInput, ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { getAllWords, incrementStreak, resetStreak, getTotalWordsCount, addWord } from '../database/db';
import { generateExercises, getExerciseEngineInfo } from '../ai/exerciseGenerator';
import { DICTIONARY } from '../ai/dictionary';

const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

const AIExerciseScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [notEnough, setNotEnough] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [matchState, setMatchState] = useState({ selectedWord: null, matched: [] });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const loadExercises = useCallback(async () => {
    const count = await getTotalWordsCount();
    if (count < 4) { setNotEnough(true); setStarted(false); return; }
    setNotEnough(false);
    const words = await getAllWords('created_at', 'DESC');
    const exs = generateExercises(words, 10);
    setExercises(exs);
    setCurrentIndex(0); setScore(0); setAnswer('');
    setSubmitted(false); setIsCorrect(false);
    setDone(false); setStarted(false); setSelectedChoice(null);
    setMatchState({ selectedWord: null, matched: [] });
    progressAnim.setValue(0); fadeAnim.setValue(1);
  }, []);

  const [importing, setImporting] = useState(false);
  const handleImportDict = async () => {
    setImporting(true);
    const entries = Object.entries(DICTIONARY);
    for (const [en, fr] of entries) {
      await addWord(en, fr);
    }
    setImporting(false);
    loadExercises();
  };

  useFocusEffect(useCallback(() => { loadExercises(); }, [loadExercises]));

  const startExercise = () => {
    setStarted(true);
    if (exercises[0]?.type === 'translation' || exercises[0]?.type === 'fill_blank') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleResult = async (correct, wordId) => {
    setSubmitted(true);
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
      if (wordId) await incrementStreak(wordId);
    } else {
      if (wordId) await resetStreak(wordId);
    }
    setTimeout(goNext, 2000);
  };

  const handleTextSubmit = async () => {
    if (submitted || !answer.trim()) return;
    const ex = exercises[currentIndex];
    const correct = normalize(answer) === normalize(ex.correctAnswer);
    await handleResult(correct, ex.wordId);
  };

  const handleChoiceSelect = async (choice) => {
    if (submitted) return;
    setSelectedChoice(choice);
    const ex = exercises[currentIndex];
    const correct = normalize(choice) === normalize(ex.correctAnswer);
    await handleResult(correct, ex.wordId);
  };

  const handleMatchSelect = (type, item) => {
    if (matchState.matched.some(m => m.id === item.id)) return;
    if (type === 'word') {
      setMatchState(prev => ({ ...prev, selectedWord: item }));
    } else if (matchState.selectedWord) {
      const correct = matchState.selectedWord.id === item.id;
      const newMatched = [...matchState.matched, { id: item.id, correct }];
      setMatchState({ selectedWord: null, matched: newMatched });
      if (correct) setScore(s => s + 0.25);
      const ex = exercises[currentIndex];
      if (newMatched.length === ex.pairs.length) {
        const allCorrect = newMatched.every(m => m.correct);
        setSubmitted(true);
        setIsCorrect(allCorrect);
        setTimeout(goNext, 2000);
      }
    }
  };

  const goNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= exercises.length) { setDone(true); return; }
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentIndex(nextIdx); setAnswer(''); setSubmitted(false);
      setIsCorrect(false); setSelectedChoice(null);
      setMatchState({ selectedWord: null, matched: [] });
      Animated.timing(progressAnim, { toValue: nextIdx / exercises.length, duration: 300, useNativeDriver: false }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
        const ex = exercises[nextIdx];
        if (ex?.type === 'translation' || ex?.type === 'fill_blank') {
          inputRef.current?.focus();
        }
      });
    });
  };

  // --- Not enough words ---
  if (notEnough) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[s.header, { paddingTop: insets.top + 10 }]}><Text style={s.headerTitle}>Exercices IA</Text></View>
        <View style={s.centered}>
          <View style={s.emptyIcon}><MaterialIcons name="auto-awesome" size={56} color={COLORS.border} /></View>
          <Text style={s.emptyTitle}>Pas assez de mots</Text>
          <Text style={s.emptyDesc}>Ajoute au moins 4 mots pour{'\n'}générer des exercices IA !</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Ajouter')}>
            <MaterialIcons name="add-circle" size={20} color={COLORS.white} />
            <Text style={s.ctaBtnText}>Ajouter manuellement</Text>
          </TouchableOpacity>
          <Text style={{ marginTop: 20, color: COLORS.textLight, fontSize: 13 }}>OU</Text>
          <TouchableOpacity 
            style={[s.ctaBtn, { backgroundColor: '#7C3AED', marginTop: 12 }]} 
            onPress={handleImportDict}
            disabled={importing}
          >
            <MaterialIcons name={importing ? "hourglass-empty" : "auto-awesome"} size={20} color={COLORS.white} />
            <Text style={s.ctaBtnText}>{importing ? 'Importation...' : 'Importer le Pack IA (~500 mots)'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Welcome ---
  if (!started) {
    const info = getExerciseEngineInfo();
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[s.header, { paddingTop: insets.top + 10 }]}><Text style={s.headerTitle}>Exercices IA</Text></View>
        <View style={s.centered}>
          <View style={s.startCircle}><MaterialIcons name="auto-awesome" size={60} color="#7C3AED" /></View>
          <Text style={s.startTitle}>Exercices Intelligents</Text>
          <Text style={s.startDesc}>
            Le moteur IA génère {exercises.length} exercices{'\n'}variés adaptés à ton niveau !
          </Text>
          <View style={s.rulesCard}>
            {[
              { icon: 'quiz', label: 'QCM — Choisis la bonne traduction', color: '#3B82F6' },
              { icon: 'edit', label: 'Traduction — Écris la réponse', color: '#10B981' },
              { icon: 'short-text', label: 'Phrases à trous — Complète', color: '#F59E0B' },
              { icon: 'compare-arrows', label: 'Association — Relie les paires', color: '#EF4444' },
              { icon: 'touch-app', label: 'Contexte — Choisis le bon mot', color: '#8B5CF6' },
            ].map((rule, i) => (
              <View key={i} style={s.ruleRow}>
                <View style={[s.ruleIconWrap, { backgroundColor: rule.color + '20' }]}>
                  <MaterialIcons name={rule.icon} size={16} color={rule.color} />
                </View>
                <Text style={s.ruleText}>{rule.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: '#7C3AED' }]} onPress={startExercise} activeOpacity={0.85}>
            <Text style={s.ctaBtnText}>Lancer les exercices</Text>
            <MaterialIcons name="arrow-forward" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Results ---
  if (done) {
    const pct = Math.round((score / exercises.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
    const msg = pct >= 80 ? 'Excellent !' : pct >= 50 ? 'Bon effort !' : 'Continue !';
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={s.centered}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</Text>
          <Text style={s.resultTitle}>{msg}</Text>
          <View style={[s.scoreCircle, { backgroundColor: '#7C3AED' }]}>
            <Text style={s.scoreNum}>{Math.round(score)}/{exercises.length}</Text>
            <Text style={s.scorePct}>{pct}%</Text>
          </View>
          <Text style={s.resultDesc}>Exercices générés par le moteur IA hors-ligne</Text>
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: '#7C3AED' }]} onPress={loadExercises}>
            <MaterialIcons name="refresh" size={20} color={COLORS.white} />
            <Text style={s.ctaBtnText}>Recommencer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkBtn} onPress={() => navigation.navigate('Vocabulaire')}>
            <Text style={s.linkText}>Voir mes mots</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Active Exercise ---
  const ex = exercises[currentIndex];
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const typeLabels = {
    multiple_choice: { label: 'QCM', icon: 'quiz', color: '#3B82F6' },
    translation: { label: 'Traduction', icon: 'edit', color: '#10B981' },
    fill_blank: { label: 'Phrase à trous', icon: 'short-text', color: '#F59E0B' },
    match_pairs: { label: 'Association', icon: 'compare-arrows', color: '#EF4444' },
    context_choice: { label: 'Contexte', icon: 'touch-app', color: '#8B5CF6' },
  };
  const typeInfo = typeLabels[ex.type] || typeLabels.translation;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.headerTitle}>Exercices IA</Text>
        <Text style={s.counter}>{currentIndex + 1}/{exercises.length}</Text>
      </View>
      <View style={s.progressBar}>
        <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: '#7C3AED' }]} />
      </View>
      <ScrollView contentContainerStyle={s.quizScroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[s.questionCard, { opacity: fadeAnim }]}>
          <View style={[s.typeBadge, { backgroundColor: typeInfo.color }]}>
            <MaterialIcons name={typeInfo.icon} size={14} color="#FFF" />
            <Text style={s.typeText}>{typeInfo.label}</Text>
          </View>
          <Text style={s.questionText}>{ex.question}</Text>
          {ex.prompt && <Text style={s.promptWord}>{ex.prompt}</Text>}
          {ex.sentence && (
            <Text style={s.sentenceText}>{ex.sentence}</Text>
          )}
          {ex.hint && (
            <View style={s.hintRow}>
              <MaterialIcons name="lightbulb" size={14} color="#F59E0B" />
              <Text style={s.hintText}>{ex.hintLabel}: {ex.hint}</Text>
            </View>
          )}
        </Animated.View>

        <View style={s.answerSection}>
          {/* Text input for translation / fill_blank */}
          {(ex.type === 'translation' || ex.type === 'fill_blank') && (
            <>
              <View style={[s.inputWrap,
                submitted && isCorrect && s.inputCorrect,
                submitted && !isCorrect && s.inputWrong,
              ]}>
                <TextInput ref={inputRef} style={s.input} value={answer}
                  onChangeText={setAnswer} placeholder="Écris ta réponse..."
                  placeholderTextColor={COLORS.textLight} editable={!submitted}
                  returnKeyType="done" onSubmitEditing={handleTextSubmit}
                  autoCapitalize="none" autoCorrect={false} />
              </View>
              {!submitted && (
                <TouchableOpacity style={[s.submitBtn, !answer.trim() && s.submitDisabled]}
                  onPress={handleTextSubmit} activeOpacity={0.8} disabled={!answer.trim()}>
                  <Text style={s.submitText}>Valider</Text>
                  <MaterialIcons name="check" size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Choices for multiple_choice / context_choice */}
          {(ex.type === 'multiple_choice' || ex.type === 'context_choice') && ex.choices && (
            <View style={s.choicesWrap}>
              {ex.choices.map((choice, i) => {
                const isSelected = selectedChoice === choice;
                const isAnswer = normalize(choice) === normalize(ex.correctAnswer);
                let choiceStyle = s.choiceBtn;
                if (submitted) {
                  if (isAnswer) choiceStyle = [s.choiceBtn, s.choiceCorrect];
                  else if (isSelected && !isAnswer) choiceStyle = [s.choiceBtn, s.choiceWrong];
                }
                return (
                  <TouchableOpacity key={i} style={choiceStyle} onPress={() => handleChoiceSelect(choice)}
                    disabled={submitted} activeOpacity={0.7}>
                    <Text style={[s.choiceText, submitted && isAnswer && { color: '#059669', fontWeight: '700' },
                      submitted && isSelected && !isAnswer && { color: '#DC2626' }]}>
                      {choice}
                    </Text>
                    {submitted && isAnswer && <MaterialIcons name="check-circle" size={20} color="#059669" />}
                    {submitted && isSelected && !isAnswer && <MaterialIcons name="cancel" size={20} color="#DC2626" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Match pairs */}
          {ex.type === 'match_pairs' && (
            <View style={s.matchWrap}>
              <Text style={s.matchLabel}>Mots (EN)</Text>
              <View style={s.matchRow}>
                {ex.shuffledWords.map((item) => {
                  const isMatched = matchState.matched.some(m => m.id === item.id);
                  const isSelected = matchState.selectedWord?.id === item.id;
                  const matchResult = matchState.matched.find(m => m.id === item.id);
                  return (
                    <TouchableOpacity key={item.id}
                      style={[s.matchItem,
                        isSelected && s.matchItemSelected,
                        isMatched && matchResult?.correct && s.matchItemCorrect,
                        isMatched && !matchResult?.correct && s.matchItemWrong,
                      ]}
                      onPress={() => handleMatchSelect('word', item)}
                      disabled={isMatched}>
                      <Text style={s.matchItemText}>{item.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.matchLabel}>Traductions (FR)</Text>
              <View style={s.matchRow}>
                {ex.shuffledTranslations.map((item) => {
                  const isMatched = matchState.matched.some(m => m.id === item.id);
                  const matchResult = matchState.matched.find(m => m.id === item.id);
                  return (
                    <TouchableOpacity key={item.id}
                      style={[s.matchItem,
                        isMatched && matchResult?.correct && s.matchItemCorrect,
                        isMatched && !matchResult?.correct && s.matchItemWrong,
                      ]}
                      onPress={() => handleMatchSelect('translation', item)}
                      disabled={isMatched || !matchState.selectedWord}>
                      <Text style={s.matchItemText}>{item.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Feedback */}
          {submitted && (
            <View style={[s.feedback, isCorrect ? s.feedbackOk : s.feedbackBad]}>
              <MaterialIcons name={isCorrect ? 'check-circle' : 'cancel'} size={20}
                color={isCorrect ? '#059669' : '#DC2626'} />
              <View style={{ flex: 1 }}>
                <Text style={[s.feedbackTitle, { color: isCorrect ? '#059669' : '#DC2626' }]}>
                  {isCorrect ? 'Correct !' : 'Incorrect'}
                </Text>
                {!isCorrect && ex.correctAnswer && (
                  <Text style={s.feedbackAnswer}>
                    Réponse : <Text style={s.feedbackBold}>{ex.correctAnswer}</Text>
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={s.scoreRow}>
          <Text style={s.scoreLabel}>Score: {Math.round(score)}/{currentIndex + (submitted ? 1 : 0)}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
  counter: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.semiBold },
  progressBar: { height: 4, backgroundColor: COLORS.border, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  quizScroll: { paddingBottom: 50 },
  questionCard: { margin: 20, padding: 24, backgroundColor: COLORS.surface, borderRadius: 20, alignItems: 'center', ...SIZES.shadowMd },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginBottom: 16 },
  typeText: { fontSize: 12, color: '#FFF', ...FONTS.semiBold },
  questionText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8, ...FONTS.medium },
  promptWord: { fontSize: 30, color: COLORS.textPrimary, ...FONTS.bold, textAlign: 'center' },
  sentenceText: { fontSize: 18, color: COLORS.textPrimary, textAlign: 'center', ...FONTS.medium, lineHeight: 28, marginTop: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 8, backgroundColor: '#FFFBEB', borderRadius: 8 },
  hintText: { fontSize: 12, color: '#92400E', ...FONTS.medium },
  answerSection: { paddingHorizontal: 20 },
  inputWrap: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, paddingHorizontal: 16, ...SIZES.shadowSm },
  inputCorrect: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  inputWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  input: { fontSize: 18, color: COLORS.textPrimary, paddingVertical: 14, ...FONTS.medium },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, backgroundColor: '#7C3AED', borderRadius: 14 },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, color: COLORS.white, ...FONTS.bold },
  choicesWrap: { gap: 10 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, ...SIZES.shadowSm },
  choiceCorrect: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  choiceWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  choiceText: { fontSize: 16, color: COLORS.textPrimary, ...FONTS.medium, flex: 1 },
  matchWrap: { gap: 8 },
  matchLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.semiBold, marginTop: 8 },
  matchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matchItem: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, ...SIZES.shadowSm },
  matchItemSelected: { borderColor: '#7C3AED', backgroundColor: '#F3E8FF' },
  matchItemCorrect: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  matchItemWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  matchItemText: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.medium },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, padding: 14, borderRadius: 12 },
  feedbackOk: { backgroundColor: '#ECFDF5' },
  feedbackBad: { backgroundColor: '#FEF2F2' },
  feedbackTitle: { fontSize: 15, ...FONTS.bold },
  feedbackAnswer: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  feedbackBold: { color: COLORS.textPrimary, ...FONTS.bold },
  scoreRow: { alignItems: 'center', marginTop: 20 },
  scoreLabel: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...SIZES.shadowSm },
  emptyTitle: { fontSize: 20, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  startCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  startTitle: { fontSize: 22, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  startDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  rulesCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 12, width: '100%', marginBottom: 28, ...SIZES.shadowSm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ruleText: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.medium, flex: 1 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999, ...SIZES.shadowMd },
  ctaBtnText: { fontSize: 16, color: COLORS.white, ...FONTS.bold },
  linkBtn: { paddingVertical: 12, marginTop: 4 },
  linkText: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
  resultTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 24 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...SIZES.shadowLg },
  scoreNum: { fontSize: 28, color: COLORS.white, ...FONTS.bold },
  scorePct: { fontSize: 14, color: 'rgba(255,255,255,0.8)', ...FONTS.medium },
  resultDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
});

export default AIExerciseScreen;
