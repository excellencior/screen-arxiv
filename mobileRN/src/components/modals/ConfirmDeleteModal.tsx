import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };

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
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onHide}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceHighlight }]} onPress={onHide}>
              <Text style={[styles.cancelText, { color: theme.colors.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.colors.danger + '22' }]} onPress={onConfirm}>
              <Text style={[styles.confirmText, { color: theme.colors.danger }]}>{confirmLabel}</Text>
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
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    ...FONT_BOLD,
    marginBottom: 12
  },
  message: {
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
  },
  cancelText: {
    ...FONT_BOLD,
    fontSize: 14
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmText: {
    ...FONT_BOLD,
    fontSize: 14
  }
});
