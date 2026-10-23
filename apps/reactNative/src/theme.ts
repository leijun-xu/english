import { DarkTheme, type Theme } from '@react-navigation/native'
import { Platform, StyleSheet } from 'react-native'

export const colors = {
  primary: '#3157D5',
  primarySoft: '#E9EDFF',
  ink: '#172033',
  text: '#344054',
  muted: '#667085',
  subtle: '#98A2B3',
  line: '#E4E7EC',
  surface: '#FFFFFF',
  canvas: '#F6F7F9',
  dark: '#171D2B',
  green: '#23856D',
  greenSoft: '#E8F5F1',
  amber: '#A56800',
  amberSoft: '#FFF4DD',
  red: '#D92D20',
  redSoft: '#FFF0EE',
}

export const navigationTheme: Theme = {
  ...DarkTheme,
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.canvas,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.red,
  },
}

export const shadow = Platform.select({
  ios: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
})

export const commonStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingBottom: 36 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700' },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  empty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.muted,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 15,
  },
})
