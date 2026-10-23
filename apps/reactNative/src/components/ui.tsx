import type { LucideIcon } from 'lucide-react-native'
import type { PropsWithChildren, ReactNode } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native'
import { colors, commonStyles } from '../theme'

export function Button({
  title,
  onPress,
  icon: Icon,
  variant = 'primary',
  disabled,
  loading,
  compact,
}: {
  title?: string
  onPress: () => void
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'text' | 'danger'
  disabled?: boolean
  loading?: boolean
  compact?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        styles[`${variant}Button`],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : colors.primary} />
      ) : (
        <>
          {Icon && <Icon size={18} color={variant === 'primary' ? '#fff' : variant === 'danger' ? colors.red : colors.primary} />}
          {title && <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>}
        </>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.subtle}
        {...props}
        style={[commonStyles.input, props.multiline && styles.textarea, props.style]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export function Segments<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.segments}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.segment, value === option.value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === option.value && styles.segmentTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
    </View>
  )
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>正在加载...</Text>
    </View>
  )
}

export const htmlToText = (html?: string | null) =>
  (html || '--')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compactButton: { minHeight: 36, paddingHorizontal: 10 },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  textButton: { backgroundColor: 'transparent' },
  dangerButton: { borderWidth: 1, borderColor: '#F4C7C3', backgroundColor: colors.surface },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: colors.text },
  textText: { color: colors.primary },
  dangerText: { color: colors.red },
  field: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  textarea: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  error: { color: colors.red, fontSize: 12 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,24,40,0.38)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.surface,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    marginTop: 9,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: '#D0D5DD',
  },
  sheetTitle: { padding: 18, paddingBottom: 12, color: colors.ink, fontSize: 20, fontWeight: '700' },
  sheetContent: { padding: 18, paddingTop: 4, paddingBottom: 34 },
  segments: { flexDirection: 'row', padding: 3, borderRadius: 7, backgroundColor: '#F2F4F7' },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontWeight: '600' },
  segmentTextActive: { color: colors.ink },
  empty: { minHeight: 190, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: colors.muted },
})
