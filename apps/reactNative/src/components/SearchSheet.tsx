import type { Word } from '@en/common/word'
import * as Clipboard from 'expo-clipboard'
import { Copy, Search, Volume2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { wordApi } from '../api'
import { notify, speakEnglish } from '../services/native'
import { useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'
import { Button, EmptyState, Field, htmlToText, Sheet } from './ui'

export function SearchSheet() {
  const open = useAppStore((state) => state.searchOpen)
  const setOpen = useAppStore((state) => state.setSearchOpen)
  const [keyword, setKeyword] = useState('')
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !keyword.trim()) {
      setWords([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await wordApi.list({ word: keyword.trim(), page: 1, pageSize: 20 })
        if (active) setWords(response.success ? response.data.list : [])
      } catch {
        if (active) setWords([])
      } finally {
        if (active) setLoading(false)
      }
    }, 400)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [keyword, open])

  const close = () => {
    setOpen(false)
    setKeyword('')
    setWords([])
  }

  return (
    <Sheet open={open} title="搜索单词" onClose={close}>
      <Field value={keyword} onChangeText={setKeyword} autoCapitalize="none" autoFocus placeholder="输入英文单词" />
      <View style={styles.results}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !keyword.trim() ? (
          <EmptyState icon={<Search color={colors.subtle} />} title="搜索你的词汇" />
        ) : !words.length ? (
          <EmptyState title="没有找到相关单词" />
        ) : (
          words.map((word) => (
            <View key={word.id} style={styles.item}>
              <View style={styles.copy}>
                <Text style={styles.word}>{word.word}</Text>
                <Text style={styles.phonetic}>{word.phonetic || '--'}</Text>
                <Text style={styles.translation} numberOfLines={2}>{htmlToText(word.translation)}</Text>
              </View>
              <View style={commonStyles.row}>
                <Button compact variant="text" icon={Volume2} onPress={() => speakEnglish(word.word)} />
                <Button
                  compact
                  variant="text"
                  icon={Copy}
                  onPress={async () => {
                    await Clipboard.setStringAsync(word.word)
                    notify('单词已复制')
                  }}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  results: { minHeight: 220, marginTop: 12, justifyContent: 'center' },
  item: {
    minHeight: 84,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  copy: { flex: 1, paddingRight: 8 },
  word: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  phonetic: { marginTop: 2, color: colors.muted, fontSize: 12 },
  translation: { marginTop: 6, color: colors.text, lineHeight: 19 },
})
