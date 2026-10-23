import type { Word } from '@en/common/word'
import { Stack, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Volume2 } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { courseApi } from '../api'
import { Button, EmptyState, htmlToText, LoadingState } from '../components/ui'
import { notify, speakEnglish } from '../services/native'
import { useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'

interface LetterState {
  expected: string
  input: string
  valid?: boolean
}

export function LearnScreen() {
  const { courseId = '', title = '课程学习' } = useLocalSearchParams<{ courseId: string; title?: string }>()
  const [words, setWords] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [letters, setLetters] = useState<LetterState[]>([])
  const [hidden, setHidden] = useState(true)
  const [loading, setLoading] = useState(true)
  const inputs = useRef<Array<ComponentRef<typeof TextInput> | null>>([])
  const updateWordNumber = useAppStore((state) => state.updateWordNumber)
  const current = words[index]

  const load = async () => {
    setLoading(true)
    try {
      const response = await courseApi.words(courseId)
      if (response.success) setWords(response.data)
      else notify(response.message)
    } catch {
      notify('课程单词加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [courseId])
  useEffect(() => {
    setHidden(true)
    setLetters(Array.from(current?.word ?? '').map((expected) => ({ expected, input: '' })))
    inputs.current = []
  }, [current?.id])

  const complete = useMemo(() => letters.length > 0 && letters.every((letter) => letter.valid), [letters])
  const updateLetter = (letterIndex: number, value: string) => {
    const input = value.slice(-1).toLowerCase()
    setLetters((items) => items.map((letter, currentIndex) =>
      currentIndex === letterIndex ? { ...letter, input, valid: input ? letter.expected.toLowerCase() === input : undefined } : letter,
    ))
    if (input && letterIndex < letters.length - 1) setTimeout(() => inputs.current[letterIndex + 1]?.focus())
  }

  const finish = async () => {
    try {
      const response = await courseApi.saveWords(words.map((word) => word.id))
      if (!response.success) return notify(response.message)
      updateWordNumber(response.data.wordNumber)
      notify(response.message)
      setIndex(0)
      await load()
    } catch {
      notify('学习记录保存失败')
    }
  }

  if (loading) return <View style={commonStyles.screen}><LoadingState /></View>
  if (!words.length) return <View style={commonStyles.screen}><EmptyState title="暂无单词或您尚未购买该课程" /></View>
  if (index >= words.length) {
    return (
      <View style={[commonStyles.screen, styles.complete]}>
        <CheckCircle2 size={64} color={colors.green} />
        <Text style={styles.completeTitle}>本组单词已学完</Text>
        <Text style={styles.completeText}>保存后将记录为已掌握，并自动获取下一组单词。</Text>
        <Button title="保存并继续" onPress={finish} />
      </View>
    )
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title }} />
      <Text style={styles.tip}>请根据释义和翻译完成单词拼写</Text>
      <View style={styles.progress}><View style={[styles.progressValue, { width: `${(index / words.length) * 100}%` }]} /></View>
      <View style={[commonStyles.card, styles.panel]}>
        <View style={styles.wordRow}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.word, hidden && styles.hidden]}>{current.word}</Text>
            <View style={styles.soundRow}>
              <Text style={styles.phonetic}>{current.phonetic || '--'}</Text>
              <Button compact variant="text" icon={Volume2} onPress={() => speakEnglish(current.word)} />
            </View>
          </View>
          <Button compact variant="text" icon={hidden ? Eye : EyeOff} onPress={() => setHidden((value) => !value)} />
        </View>
        <Definition label="释义" value={current.definition} />
        <Definition label="翻译" value={current.translation} />
        <View style={styles.definition}>
          <Text style={styles.label}>拼写</Text>
          <View style={styles.letters}>
            {letters.map((letter, letterIndex) => (
              <TextInput
                key={letterIndex}
                ref={(element) => { inputs.current[letterIndex] = element }}
                value={letter.input}
                maxLength={1}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => updateLetter(letterIndex, value)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !letter.input && letterIndex > 0) inputs.current[letterIndex - 1]?.focus()
                }}
                style={[styles.letter, letter.valid === true && styles.valid, letter.valid === false && styles.invalid]}
              />
            ))}
          </View>
        </View>
        <View style={styles.actions}>
          <Button title="上一个" variant="secondary" icon={ChevronLeft} disabled={index === 0} onPress={() => setIndex((value) => value - 1)} />
          <Button title="下一个" icon={ChevronRight} disabled={!complete} onPress={() => setIndex((value) => value + 1)} />
        </View>
      </View>
    </ScrollView>
  )
}

function Definition({ label, value }: { label: string; value?: string }) {
  return <View style={styles.definition}><Text style={styles.label}>{label}</Text><Text style={styles.definitionText}>{htmlToText(value)}</Text></View>
}

const styles = StyleSheet.create({
  tip: { color: colors.muted, textAlign: 'center', marginBottom: 16 },
  progress: { height: 6, marginBottom: 16, overflow: 'hidden', borderRadius: 3, backgroundColor: '#E4E7EC' },
  progressValue: { height: '100%', backgroundColor: colors.primary },
  panel: { padding: 16 },
  wordRow: { minHeight: 90, flexDirection: 'row', alignItems: 'flex-start' },
  word: { color: colors.primary, fontSize: 30, fontWeight: '700' },
  hidden: { color: 'transparent', textShadowColor: '#7180A8', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  soundRow: { flexDirection: 'row', alignItems: 'center' },
  phonetic: { color: colors.muted },
  definition: { marginTop: 13, padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: '#F8FAFC' },
  label: { marginBottom: 8, color: colors.muted, fontSize: 12 },
  definitionText: { color: colors.text, lineHeight: 23 },
  letters: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  letter: { width: 34, height: 43, padding: 0, borderBottomWidth: 2, borderBottomColor: colors.subtle, color: colors.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  valid: { borderBottomColor: colors.green },
  invalid: { borderBottomColor: colors.red, color: colors.red },
  actions: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
  complete: { alignItems: 'center', justifyContent: 'center', padding: 26, gap: 14 },
  completeTitle: { color: colors.ink, fontSize: 23, fontWeight: '700' },
  completeText: { color: colors.muted, lineHeight: 22, textAlign: 'center' },
})
