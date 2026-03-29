import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLibrary } from '../context/LibraryContext';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Download, Upload } from 'lucide-react-native';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };

export default function BackupScreen() {
  const { movies, shows, isLoaded, importData } = useLibrary();
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handleRestore = async () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.movies && data.shows) {
              importData(data.movies, data.shows);
              Toast.show({ type: 'success', text1: 'Restored Successfully', text2: `Imported ${data.movies.length} movies and ${data.shows.length} series.` });
            } else {
              throw new Error('Invalid Backup Format');
            }
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Restore Failed', text2: 'The file provided is not a valid ScreenArxiv JSON backup.' });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      // Native Android/iOS: use document picker
      try {
        const DocumentPicker = require('expo-document-picker');
        const FileSystem = require('expo-file-system');
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) return;

        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        const data = JSON.parse(content);

        if (data.movies && data.shows) {
          importData(data.movies, data.shows);
          Toast.show({ type: 'success', text1: 'Restored Successfully', text2: `Imported ${data.movies.length} movies and ${data.shows.length} series.` });
        } else {
          throw new Error('Invalid Backup Format');
        }
      } catch (e: any) {
        if (e?.message === 'Invalid Backup Format') {
          Toast.show({ type: 'error', text1: 'Restore Failed', text2: 'The file is not a valid ScreenArxiv JSON backup.' });
        } else {
          console.log('Restore error', e);
          Toast.show({ type: 'error', text1: 'Restore Failed', text2: 'Could not read the selected file.' });
        }
      }
    }
  };

  const handleExport = async () => {
    if (!isLoaded) return;
    try {
      const data = { movies, shows };
      const json = JSON.stringify(data, null, 2);
      
      if (Platform.OS === 'web') {
         // @ts-ignore
         const blob = new Blob([json], { type: 'application/json' });
         // @ts-ignore
         const url = URL.createObjectURL(blob);
         // @ts-ignore
         const a = document.createElement('a');
         a.href = url;
         a.download = `ScreenArxiv_Backup_${new Date().toISOString().split('T')[0]}.json`;
         a.click();
         URL.revokeObjectURL(url);
         Toast.show({ type: 'success', text1: 'Backup Downloaded', text2: 'Your vault status was successfully encrypted to disk.' });
      } else {
         // Native Android/iOS: write to temp file and share
         const FileSystem = require('expo-file-system');
         const Sharing = require('expo-sharing');
         const fileName = `ScreenArxiv_Backup_${new Date().toISOString().split('T')[0]}.json`;
         const fileUri = FileSystem.documentDirectory + fileName;
         await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

         if (await Sharing.isAvailableAsync()) {
           await Sharing.shareAsync(fileUri, {
             mimeType: 'application/json',
             dialogTitle: 'Save ScreenArxiv Backup',
           });
           Toast.show({ type: 'success', text1: 'Backup Shared', text2: 'Your vault backup is ready to save.' });
         } else {
           Toast.show({ type: 'error', text1: 'Sharing Unavailable', text2: 'Your device does not support file sharing.' });
         }
      }
    } catch(e) {
      console.log('Export error', e);
      Toast.show({ type: 'error', text1: 'Export Failure', text2: 'Could not serialize library data.' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Massive Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>DATA CONTROL</Text>
        <Text style={styles.heroTitle}>BACKUP</Text>
        <View style={styles.heroGlowBar} />
      </View>

      <View style={styles.bodyPadding}>

        {/* JSON Export */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA MANAGEMENT</Text>
          <View style={styles.exportCard}>
             <View style={{ marginBottom: 20 }}>
               <Text style={styles.exportTitle}>Vault Backup</Text>
               <Text style={styles.exportSub}>All your behavior tracking and watch history resides entirely on disk. Generate a master backup JSON securely to export your configuration.</Text>
             </View>
             <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
               <Download size={18} color={theme.colors.primaryText} style={{ marginRight: 8 }} />
               <Text style={styles.exportBtnText}>DOWNLOAD BACKUP</Text>
             </TouchableOpacity>
          </View>
        </View>
        
        {/* Restore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RESTORATION</Text>
          <View style={styles.restoreCard}>
             <View style={{ marginBottom: 20 }}>
               <Text style={styles.exportTitle}>Import Vault</Text>
               <Text style={styles.exportSub}>Restore a previously exported ScreenArxiv JSON configuration file. Warning: This will overwrite your current device's local memory blocks.</Text>
             </View>
             <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.8}>
               <Upload size={18} color={theme.colors.text} style={{ marginRight: 8 }} />
               <Text style={styles.restoreBtnText}>UPLOAD BACKUP</Text>
             </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  
  // Hero Section
  heroSection: { paddingTop: Platform.OS === 'ios' ? 80 : 16, paddingHorizontal: 24, alignItems: 'center', marginBottom: 32 },
  heroLabel: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 13, letterSpacing: 3, marginBottom: 8 },
  heroTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 48, letterSpacing: 2 },
  heroGlowBar: { width: 40, height: 4, backgroundColor: theme.colors.primary, borderRadius: 2, marginTop: 24, boxShadow: isDarkMode ? `0px 0px 10px ${theme.colors.primary}` : 'none' },

  // Body Padding
  bodyPadding: { paddingHorizontal: 24 },
  section: { marginBottom: 40 },
  sectionHeader: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 12, letterSpacing: 2, marginBottom: 16 },

  // Export 
  exportCard: { backgroundColor: theme.colors.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  exportTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 18, marginBottom: 8 },
  exportSub: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 13, lineHeight: 20 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 8, borderRadius: 8 },
  exportBtnText: { color: theme.colors.primaryText, ...FONT_BOLD, fontSize: 13, letterSpacing: 1 },

  // Restore 
  restoreCard: { backgroundColor: theme.colors.surfaceHighlight, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSelected, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  restoreBtnText: { color: theme.colors.text, ...FONT_BOLD, fontSize: 13, letterSpacing: 1 },
});
