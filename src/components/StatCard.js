import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const StatCard = ({ label, count, color, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.card, { backgroundColor: color }]}>
        <Text style={styles.count}>{count}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    marginHorizontal: SIZES.spacing4,
  },
  card: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'flex-end',
    padding: SIZES.spacing12,
    ...SIZES.shadowMd,
  },
  count: {
    fontSize: SIZES.xxl,
    color: COLORS.white,
    ...FONTS.bold,
  },
  label: {
    marginTop: SIZES.spacing8,
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
});

export default StatCard;
