import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS, LEVEL_CONFIG } from '../constants/theme';
import { getWordsForQuiz, incrementStreak, resetStreak, getTotalWordsCount, getLevel } from '../database/db';

const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

const QuizScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [notEnough, setNotEnough] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [directions, setDirections] = useState([]); // true = word→translation, false = translation→word
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const loadQuiz = useCallback(async () => {
    const count = await getTotalWordsCount();
    if (count < 4) { setNotEnough(true); setQuizStarted(false); return; }
    setNotEnough(false);
    const words = await getWordsForQuiz(10);
    setQuestions(words);
    // Random direction for each question
    setDirections(words.map(() => Math.random() > 0.5));
    setCurrentIndex(0); setScore(0); setAnswer('');
    setSubmitted(false); setIsCorrect(false);
    setQuizDone(false); setQuizStarted(false);
    progressAnim.setValue(0); fadeAnim.setValue(1);
  }, []);

  useFocusEffect(useCallback(() => { loadQuiz(); }, [loadQuiz]));

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSubmit = async () => {
    if (submitted || !answer.trim()) return;
    setSubmitted(true);
    const current = questions[currentIndex];
    const dir = directions[currentIndex];
    // dir=true: shown=word, expected=translation
    // dir=false: shown=translation, expected=word
    const expected = dir ? current.translation : current.word;
    const correct = normalize(answer) === normalize(expected);
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      await incrementStreak(current.id);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      await resetStreak(current.id);
    }
    setTimeout(goNext, 1800);
  };

  const goNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) { setQuizDone(true); return; }
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentIndex(nextIdx); setAnswer(''); setSubmitted(false); setIsCorrect(false);
      Animated.timing(progressAnim, { toValue: nextIdx / questions.length, duration: 300, useNativeDriver: false }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
        inputRef.current?.focus();
      });
    });
  };

  // --- Not enough words ---
  if (notEnough) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[s.header, { paddingTop: insets.top + 10 }]}><Text style={s.headerTitle}>S'exercer</Text></View>
        <View style={s.centered}>
          <View style={s.emptyIcon}>
            <MaterialIcons name="school" size={56} color={COLORS.border} />
          </View>
          <Text style={s.emptyTitle}>Pas assez de mots</Text>
          <Text style={s.emptyDesc}>Ajoute au moins 4 mots pour{'\n'}commencer un quiz !</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Ajouter')}>
            <MaterialIcons name="add-circle" size={20} color={COLORS.white} />
            <Text style={s.ctaBtnText}>Ajouter des mots</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Welcome ---
  if (!quizStarted) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[s.header, { paddingTop: insets.top + 10 }]}><Text style={s.headerTitle}>S'exercer</Text></View>
        <View style={s.centered}>
          <View style={s.startCircle}>
            <MaterialIcons name="psychology" size={60} color={COLORS.primary} />
          </View>
          <Text style={s.startTitle}>Prêt à t'entraîner ?</Text>
          <Text style={s.startDesc}>
            {questions.length} questions sur ton vocabulaire.{'\n'}Écris la traduction du mot affiché !
          </Text>
          <View style={s.rulesCard}>
            <View style={s.ruleRow}>
              <View style={[s.ruleDot, { backgroundColor: COLORS.levelBeginner }]} />
              <Text style={s.ruleText}>À travailler : moins de 3 bonnes réponses d'affilée</Text>
            </View>
            <View style={s.ruleRow}>
              <View style={[s.ruleDot, { backgroundColor: COLORS.levelIntermediate }]} />
              <Text style={s.ruleText}>À revoir : 3 bonnes réponses consécutives</Text>
            </View>
            <View style={s.ruleRow}>
              <View style={[s.ruleDot, { backgroundColor: COLORS.levelAdvanced }]} />
              <Text style={s.ruleText}>Acquis : 5 bonnes réponses consécutives</Text>
            </View>
          </View>
          <TouchableOpacity style={s.ctaBtn} onPress={startQuiz} activeOpacity={0.85}>
            <Text style={s.ctaBtnText}>Commencer le quiz</Text>
            <MaterialIcons name="arrow-forward" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Results ---
  if (quizDone) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
    const msg = pct >= 80 ? 'Excellent !' : pct >= 50 ? 'Bon effort !' : 'Continue !';
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={s.centered}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</Text>
          <Text style={s.resultTitle}>{msg}</Text>
          <View style={s.scoreCircle}>
            <Text style={s.scoreNum}>{score}/{questions.length}</Text>
            <Text style={s.scorePct}>{pct}%</Text>
          </View>
          <Text style={s.resultDesc}>Les séries de tes mots ont été mises à jour</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={loadQuiz}>
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

  // --- Quiz ---
  const current = questions[currentIndex];
  const dir = directions[currentIndex];
  const shown = dir ? current.word : current.translation;
  const expected = dir ? current.translation : current.word;
  const langFrom = dir ? 'Anglais' : 'Français';
  const langTo = dir ? 'Français' : 'Anglais';
  const level = getLevel(current.streak);
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.headerTitle}>Quiz</Text>
        <Text style={s.counter}>{currentIndex + 1}/{questions.length}</Text>
      </View>
      <View style={s.progressBar}>
        <Animated.View style={[s.progressFill, { width: progressWidth }]} />
      </View>
      <ScrollView contentContainerStyle={s.quizScroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[s.questionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={s.dirBadge}>
            <Text style={s.dirText}>{langFrom} → {langTo}</Text>
          </View>
          <View style={[s.levelBadge, { backgroundColor: LEVEL_CONFIG[level]?.lightColor }]}>
            <View style={[s.levelDot, { backgroundColor: LEVEL_CONFIG[level]?.color }]} />
            <Text style={s.levelText}>{LEVEL_CONFIG[level]?.label}</Text>
            <Text style={s.streakText}>({current.streak} série)</Text>
          </View>
          <Text style={s.promptText}>Comment traduit-on :</Text>
          <Text style={s.shownWord}>{shown}</Text>
        </Animated.View>

        <View style={s.answerSection}>
          <Text style={s.answerLabel}>Ta réponse en {langTo.toLowerCase()} :</Text>
          <View style={[s.inputWrap,
            submitted && isCorrect && s.inputCorrect,
            submitted && !isCorrect && s.inputWrong,
          ]}>
            <TextInput ref={inputRef} style={s.input} value={answer}
              onChangeText={setAnswer} placeholder="Écris ta réponse..."
              placeholderTextColor={COLORS.textLight} editable={!submitted}
              returnKeyType="done" onSubmitEditing={handleSubmit}
              autoCapitalize="none" autoCorrect={false} />
          </View>

          {submitted && (
            <View style={[s.feedback, isCorrect ? s.feedbackOk : s.feedbackBad]}>
              <MaterialIcons name={isCorrect ? 'check-circle' : 'cancel'} size={20}
                color={isCorrect ? COLORS.levelAdvanced : COLORS.levelBeginner} />
              <View style={{ flex: 1 }}>
                <Text style={[s.feedbackTitle, { color: isCorrect ? COLORS.levelAdvanced : COLORS.levelBeginner }]}>
                  {isCorrect ? 'Correct !' : 'Incorrect'}
                </Text>
                {!isCorrect && (
                  <Text style={s.feedbackAnswer}>
                    La bonne réponse : <Text style={s.feedbackBold}>{expected}</Text>
                  </Text>
                )}
              </View>
            </View>
          )}

          {!submitted && (
            <TouchableOpacity style={[s.submitBtn, !answer.trim() && s.submitDisabled]}
              onPress={handleSubmit} activeOpacity={0.8} disabled={!answer.trim()}>
              <Text style={s.submitText}>Valider</Text>
              <MaterialIcons name="check" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.scoreRow}>
          <Text style={s.scoreLabel}>Score: {score}/{currentIndex + (submitted ? 1 : 0)}</Text>
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
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  quizScroll: { paddingBottom: 40 },
  // Question
  questionCard: { margin: 20, padding: 24, backgroundColor: COLORS.surface, borderRadius: 20, alignItems: 'center', ...SIZES.shadowMd },
  dirBadge: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: COLORS.primary, borderRadius: 999, marginBottom: 12 },
  dirText: { fontSize: 12, color: COLORS.white, ...FONTS.semiBold },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 16 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelText: { fontSize: 11, color: COLORS.textSecondary, ...FONTS.medium },
  streakText: { fontSize: 10, color: COLORS.textLight, ...FONTS.regular },
  promptText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  shownWord: { fontSize: 32, color: COLORS.textPrimary, ...FONTS.bold, textAlign: 'center' },
  // Answer
  answerSection: { paddingHorizontal: 20 },
  answerLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.semiBold, marginBottom: 8 },
  inputWrap: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, paddingHorizontal: 16, ...SIZES.shadowSm },
  inputCorrect: { borderColor: COLORS.levelAdvanced, backgroundColor: '#E8F5E9' },
  inputWrong: { borderColor: COLORS.levelBeginner, backgroundColor: '#FFEBEE' },
  input: { fontSize: 18, color: COLORS.textPrimary, paddingVertical: 14, ...FONTS.medium },
  // Feedback
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, padding: 14, borderRadius: 12 },
  feedbackOk: { backgroundColor: '#E8F5E9' },
  feedbackBad: { backgroundColor: '#FFEBEE' },
  feedbackTitle: { fontSize: 15, ...FONTS.bold },
  feedbackAnswer: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  feedbackBold: { color: COLORS.textPrimary, ...FONTS.bold },
  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 14 },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, color: COLORS.white, ...FONTS.bold },
  scoreRow: { alignItems: 'center', marginTop: 20 },
  scoreLabel: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
  // Centered
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...SIZES.shadowSm },
  emptyTitle: { fontSize: 20, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  startCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(21,101,192,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  startTitle: { fontSize: 22, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  startDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  rulesCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 12, width: '100%', marginBottom: 28, ...SIZES.shadowSm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleDot: { width: 10, height: 10, borderRadius: 5 },
  ruleText: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.medium, flex: 1 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16, backgroundColor: COLORS.primary, borderRadius: 999, ...SIZES.shadowMd },
  ctaBtnText: { fontSize: 16, color: COLORS.white, ...FONTS.bold },
  linkBtn: { paddingVertical: 12, marginTop: 4 },
  linkText: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
  // Results
  resultTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 24 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...SIZES.shadowLg },
  scoreNum: { fontSize: 28, color: COLORS.white, ...FONTS.bold },
  scorePct: { fontSize: 14, color: 'rgba(255,255,255,0.8)', ...FONTS.medium },
  resultDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
});

export default QuizScreen;
