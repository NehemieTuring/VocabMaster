import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, LEVEL_CONFIG } from '../constants/theme';
import { getLevel } from '../database/db';

const LevelBars = ({ level, streak }) => {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];
  return (
    <View style={styles.barsWrap}>
      <View style={styles.barsContainer}>
        <View style={[styles.bar, { backgroundColor: config.color, height: 8 }]} />
        <View style={[styles.bar, { backgroundColor: level >= 1 ? config.color : '#E0E0E0', height: 12 }]} />
        <View style={[styles.bar, { backgroundColor: level >= 2 ? config.color : '#E0E0E0', height: 16 }]} />
      </View>
      <Text style={[styles.streakNum, { color: config.color }]}>{streak}</Text>
    </View>
  );
};

const WordCard = ({ item, onPress, onDelete, onEdit }) => {
  const level = item.level !== undefined ? item.level : getLevel(item.streak || 0);
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left color accent */}
      <View style={[styles.levelAccent, { backgroundColor: config.color }]} />

      <View style={styles.content}>
        {/* Word info */}
        <View style={styles.wordSection}>
          <Text style={styles.word} numberOfLines={1}>{item.word}</Text>
          <Text style={styles.translation} numberOfLines={1}>{item.translation}</Text>
        </View>

        {/* Level indicator + Actions */}
        <View style={styles.rightSection}>
          <LevelBars level={level} streak={item.streak || 0} />
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="edit" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    marginHorizontal: SIZES.spacing16,
    marginBottom: SIZES.spacing10,
    overflow: 'hidden',
    ...SIZES.shadowMd,
  },
  levelAccent: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing12,
    paddingHorizontal: SIZES.spacing16,
  },
  wordSection: {
    flex: 1,
    marginRight: SIZES.spacing12,
  },
  word: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  translation: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  rightSection: {
    alignItems: 'center',
    gap: 6,
  },
  barsWrap: {
    alignItems: 'center',
    gap: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  streakNum: {
    fontSize: 9,
    fontWeight: '700',
  },
  bar: {
    width: 5,
    height: 8,
    borderRadius: 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
});

export default WordCard;
