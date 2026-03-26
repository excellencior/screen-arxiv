import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { PolestarTheme } from '../../theme';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'serif', fontWeight: '600' as const, letterSpacing: 0.5 };

interface ConfirmDeleteModalProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDeleteModal({
  visible,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel'
}: ConfirmDeleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onHide}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onHide}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: PolestarTheme.colors.surface,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: PolestarTheme.colors.border
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    ...FONT_BOLD,
    marginBottom: 12
  },
  message: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    ...FONT_REGULAR,
    lineHeight: 22,
    marginBottom: 32
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  cancelText: {
    color: '#FFF',
    ...FONT_BOLD,
    fontSize: 14
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,68,68,0.2)'
  },
  confirmText: {
    color: '#ff4444',
    ...FONT_BOLD,
    fontSize: 14
  }
});
