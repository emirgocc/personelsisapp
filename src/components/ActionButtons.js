import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActionButtons({ onClear, onPlus }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClear} style={[styles.button, styles.clearButton]}>
        <MaterialIcons name="cancel" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlus} style={[styles.button, styles.plusButton]}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  clearButton: {
    backgroundColor: 'rgba(229, 57, 53, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  plusButton: {
    backgroundColor: 'rgba(25, 118, 210, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
});
