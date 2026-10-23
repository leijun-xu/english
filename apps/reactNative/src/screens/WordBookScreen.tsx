import type { Word, WordQuery } from '@en/common/word'
import { BookOpen, ChevronLeft, ChevronRight, Search, Volume2 } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { wordApi } from '../api'
import { Button, EmptyState, Field, htmlToText, LoadingState } from '../components/ui'
import { notify, speakEnglish } from '../services/native'
import { colors, commonStyles } from '../theme'

const filters = [
  ['gk', '高考'], ['zk', '中考'], ['gre', 'GRE'], ['toefl', 'TOEFL'],
  ['ielts', 'IELTS'], ['cet6', '六级'], ['cet4', '四级'], ['ky', '考研'],
] as const
type FilterKey = (typeof filters)[number][0]

export function WordBookScreen() {
  const [query, setQuery] = useState<WordQuery>({ page: 1, pageSize: 12, word: '' })
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<FilterKey[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (next: WordQuery, activeFilters: FilterKey[]) => {
    setLoading(true)
    try {
      const filterQuery = Object.fromEntries(filters.map(([key]) => [key, activeFilters.includes(key)]))
      const response = await wordApi.list({ ...next, ...filterQuery })
      if (response.success) {
        setWords(response.data.list)
        setTotal(response.data.total)
      } else notify(response.message)
    } catch {
      notify('词库加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(query, selected)
  }, [load, query])

  const search = () => setQuery((current) => ({ ...current, page: 1, word: keyword.trim() }))
  const pages = Math.max(1, Math.ceil(total / query.pageSize))

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <View style={styles.headingIcon}><BookOpen size={22} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={commonStyles.title}>词库列表</Text>
          <Text style={commonStyles.subtitle}>覆盖主流考试词汇与权威词典来源</Text>
        </View>
      </View>
      <View style={[commonStyles.card, styles.filters]}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Field value={keyword} onChangeText={setKeyword} onSubmitEditing={search} placeholder="搜索单词" autoCapitalize="none" />
          </View>
          <Button compact icon={Search} onPress={search} />
        </View>
        <View style={styles.chips}>
          {filters.map(([key, label]) => {
            const active = selected.includes(key)
            return (
              <Pressable
                key={key}
                onPress={() => setSelected((current) => active ? current.filter((item) => item !== key) : [...current, key])}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {loading ? <LoadingState /> : !words.length ? (
        <EmptyState title="暂无匹配单词" />
      ) : (
        <View style={styles.list}>
          {words.map((word) => (
            <View key={word.id} style={[commonStyles.card, styles.card]}>
              <View style={styles.wordHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.word}>{word.word}</Text>
                  <Text style={styles.phonetic}>{word.phonetic || '--'}</Text>
                </View>
                <Button compact variant="text" icon={Volume2} onPress={() => speakEnglish(word.word)} />
              </View>
              <Text style={styles.definition} numberOfLines={2}>{htmlToText(word.definition)}</Text>
              <Text style={styles.translation} numberOfLines={2}>{htmlToText(word.translation)}</Text>
              <View style={styles.tags}>
                {filters.map(([key, label]) => word[key] && <Text key={key} style={styles.tag}>{label}</Text>)}
              </View>
            </View>
          ))}
        </View>
      )}

      {total > query.pageSize && (
        <View style={styles.pagination}>
          <Button compact variant="secondary" icon={ChevronLeft} disabled={query.page === 1} onPress={() => setQuery((current) => ({ ...current, page: current.page - 1 }))} />
          <Text style={styles.pageText}>{query.page} / {pages}</Text>
          <Button compact variant="secondary" icon={ChevronRight} disabled={query.page >= pages} onPress={() => setQuery((current) => ({ ...current, page: current.page + 1 }))} />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 22 },
  headingIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.primarySoft },
  filters: { padding: 12, gap: 14, marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 54, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', borderRadius: 5, backgroundColor: '#F2F4F7' },
  chipActive: { backgroundColor: colors.primarySoft },
  chipText: { color: colors.muted, fontSize: 12 },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { gap: 12 },
  card: { minHeight: 212, padding: 18 },
  wordHeading: { flexDirection: 'row', alignItems: 'flex-start' },
  word: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  phonetic: { marginTop: 4, color: colors.muted, fontSize: 12 },
  definition: { marginTop: 16, color: colors.text, lineHeight: 21 },
  translation: { marginTop: 10, color: colors.muted, lineHeight: 21 },
  tags: { minHeight: 24, marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: '#F2F4F7', color: colors.text, fontSize: 11 },
  pagination: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  pageText: { color: colors.text, fontWeight: '600' },
})
