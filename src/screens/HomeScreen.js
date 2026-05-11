import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Animated, StatusBar, RefreshControl, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
// expo-file-system & expo-sharing loaded dynamically on native only
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { getAllWords, deleteWord, updateWord, searchWords, getWordsCount } from '../database/db';
import { exportData } from '../utils/exportService';
import WordCard from '../components/WordCard';
import StatCard from '../components/StatCard';
import AddWordModal from '../components/AddWordModal';

const SORT_OPTIONS = [
  { key: 'created_at', label: 'Date', icon: 'schedule' },
  { key: 'word', label: 'A-Z', icon: 'sort-by-alpha' },
  { key: 'streak', label: 'Niveau', icon: 'bar-chart' },
];

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState([]);
  const [counts, setCounts] = useState({ 0: 0, 1: 0, 2: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [refreshing, setRefreshing] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const loadWords = useCallback(async () => {
    try {
      const result = searchQuery.trim()
        ? await searchWords(searchQuery)
        : await getAllWords(sortBy, sortOrder);
      setWords(result);
      setCounts(await getWordsCount());
    } catch (err) { console.error(err); }
  }, [sortBy, sortOrder, searchQuery]);

  useFocusEffect(useCallback(() => { loadWords(); }, [loadWords]));

  const handleRefresh = async () => {
    setRefreshing(true); await loadWords(); setRefreshing(false);
  };

  const toggleSearch = () => {
    const next = !showSearch;
    setShowSearch(next);
    Animated.timing(searchAnim, {
      toValue: next ? 1 : 0, duration: 250, useNativeDriver: false,
    }).start();
    if (!next) setSearchQuery('');
  };

  const handleSort = (idx) => {
    const opt = SORT_OPTIONS[idx];
    if (sortBy === opt.key) setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(opt.key); setSortOrder(opt.key === 'word' ? 'ASC' : 'DESC'); }
  };

  const handleEditSave = async (w, t) => {
    try {
      if (editingWord) await updateWord(editingWord.id, w, t);
      setModalVisible(false); setEditingWord(null); await loadWords();
    } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Supprimer le mot', 'Êtes-vous sûr de vouloir supprimer ce mot ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive',
        onPress: async () => { await deleteWord(id); await loadWords(); } },
    ]);
  };

  const handleEdit = (item) => { setEditingWord(item); setModalVisible(true); };

  const handleExport = async () => {
    try {
      if (words.length === 0) {
        Alert.alert('Export impossible', 'Aucun mot à exporter.');
        return;
      }

      Alert.alert(
        'Exporter le vocabulaire',
        'Choisissez le format d\'exportation :',
        [
          { text: 'Format CSV (Excel)', onPress: () => performExport(words, 'csv') },
          { text: 'Format JSON', onPress: () => performExport(words, 'json') },
          { text: 'Format Texte', onPress: () => performExport(words, 'txt') },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Erreur', "Impossible de préparer l'exportation.");
    }
  };

  const performExport = async (data, format) => {
    try {
      await exportData(data, format);
    } catch (err) {
      Alert.alert('Erreur', "L'exportation a échoué.");
    }
  };

  const totalWords = counts[0] + counts[1] + counts[2];
  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 56],
  });

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.statsRow}>
        <StatCard label="À travailler" count={counts[0]} color={COLORS.levelBeginner} />
        <StatCard label="À revoir" count={counts[1]} color={COLORS.levelIntermediate} />
        <StatCard label="Acquis" count={counts[2]} color={COLORS.levelAdvanced} />
      </View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="bookmark" size={22} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Tes mots sauvegardés</Text>
        </View>
        <Text style={styles.wordCount}>
          {totalWords} mot{totalWords !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortPill, sortBy === opt.key && styles.sortPillActive]}
            onPress={() => handleSort(i)}
          >
            <MaterialIcons name={opt.icon} size={14}
              color={sortBy === opt.key ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.sortPillText,
              sortBy === opt.key && styles.sortPillTextActive]}>
              {opt.label}
            </Text>
            {sortBy === opt.key && (
              <MaterialIcons
                name={sortOrder === 'ASC' ? 'arrow-upward' : 'arrow-downward'}
                size={12} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="menu-book" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>Aucun mot enregistré</Text>
      <Text style={styles.emptySubtitle}>
        Va dans l'onglet "Ajouter" pour enregistrer{'\n'}ton premier mot de vocabulaire
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.appTitle}>Vocabulaire</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={handleExport} style={styles.topBarBtn}>
            <MaterialIcons name="file-download" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSearch} style={styles.topBarBtn}>
            <MaterialIcons name={showSearch ? 'close' : 'search'}
              size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.searchWrapper,
        { height: searchHeight, opacity: searchAnim }]}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={COLORS.textLight} />
          <TextInput style={styles.searchInput} value={searchQuery}
            onChangeText={setSearchQuery} placeholder="Rechercher un mot..."
            placeholderTextColor={COLORS.textLight} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      <FlatList data={words} keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <WordCard item={item} onPress={() => {}}
            onDelete={handleDelete} onEdit={handleEdit} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={words.length === 0 ? styles.emptyList : { paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      />
      <AddWordModal visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingWord(null); }}
        onSave={handleEditSave} editingWord={editingWord} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  appTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topBarBtn: { padding: 8, borderRadius: 999 },
  searchWrapper: { paddingHorizontal: 16, overflow: 'hidden' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, paddingHorizontal: 12, height: 44, ...SIZES.shadowSm,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, marginLeft: 8 },
  headerContent: { paddingTop: 8, paddingBottom: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.bold },
  wordCount: { fontSize: 12, color: COLORS.textLight, ...FONTS.medium },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  sortPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  sortPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortPillText: { fontSize: 10, color: COLORS.textSecondary, ...FONTS.semiBold },
  sortPillTextActive: { color: COLORS.white },
  list: { paddingBottom: 30 },
  emptyList: { flexGrow: 1 },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 80,
  },
  emptyTitle: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 22,
  },
});

export default HomeScreen;
