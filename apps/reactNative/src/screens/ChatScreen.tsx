import type { ChatMessageList, ChatMode, ChatRoleType } from '@en/common/chat'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { AudioLines, Globe2, Pause, Send, Zap } from 'lucide-react-native'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { chatApi } from '../api'
import { Button, EmptyState } from '../components/ui'
import { notify } from '../services/native'
import { useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'

export function ChatScreen() {
  const user = useAppStore((state) => state.user)
  const [modes, setModes] = useState<ChatMode[]>([])
  const [role, setRole] = useState<ChatRoleType>('normal')
  const [messages, setMessages] = useState<ChatMessageList>([])
  const [content, setContent] = useState('')
  const [deepThink, setDeepThink] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [recording, setRecording] = useState(false)
  const streamRef = useRef<{ abort: () => void } | null>(null)
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)

  useSpeechRecognitionEvent('start', () => setRecording(true))
  useSpeechRecognitionEvent('end', () => setRecording(false))
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results.map((result) => result.transcript).join('')
    if (text) setContent(text)
  })
  useSpeechRecognitionEvent('error', (event) => {
    setRecording(false)
    notify(event.message || '语音识别失败')
  })

  useEffect(() => {
    chatApi.modes().then((response) => {
      if (response.success && response.data.length) {
        setModes(response.data)
        setRole(response.data[0].role)
      }
    }).catch(() => notify('对话模式加载失败'))
  }, [])

  useEffect(() => {
    if (!user?.id) return
    streamRef.current?.abort()
    setStreaming(false)
    chatApi.history(user.id, role).then((response) => {
      if (response.success) setMessages(response.data)
    }).catch(() => notify('历史记录加载失败'))
  }, [role, user?.id])

  useEffect(() => () => streamRef.current?.abort(), [])
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40)
  }, [messages])

  const send = () => {
    const text = content.trim()
    if (!text || !user?.id || streaming) return
    setContent('')
    setStreaming(true)
    setMessages((current) => [...current, { role: 'human', content: text, type: 'chat' }, { role: 'ai', content: '', reasoning: '', type: 'chat' }])
    streamRef.current = chatApi.stream(
      { userId: user.id, role, content: text, deepThink, webSearch },
      (chunk) => setMessages((current) => current.map((item, index) => {
        if (index !== current.length - 1) return item
        return chunk.type === 'reasoning'
          ? { ...item, reasoning: `${item.reasoning ?? ''}${chunk.content}` }
          : { ...item, content: `${item.content}${chunk.content}` }
      })),
      (error) => { notify(error.message); setStreaming(false) },
      () => setStreaming(false),
    )
  }

  const toggleVoice = async () => {
    if (recording) {
      ExpoSpeechRecognitionModule.stop()
      return
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!permission.granted) return notify('请先允许麦克风与语音识别权限')
    ExpoSpeechRecognitionModule.start({ lang: 'zh-CN', interimResults: true, continuous: true })
  }

  const selectedMode = modes.find((mode) => mode.role === role)
  return (
    <KeyboardAvoidingView style={commonStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96}>
      <View style={styles.modes}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {modes.map((mode) => (
            <Pressable key={mode.id} onPress={() => setRole(mode.role)} style={[styles.mode, role === mode.role && styles.modeActive]}>
              <Text style={[styles.modeText, role === mode.role && styles.modeTextActive]}>{mode.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>{selectedMode?.label ?? 'AI 对话'}</Text>
        <Text style={styles.headingText}>对话会按当前模式自动保存</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={messages.length ? styles.messageContent : styles.emptyContent}>
        {!messages.length ? <EmptyState title="发送一条消息开始对话" /> : messages.map((item, index) => (
          <View key={`${index}-${item.role}`} style={[styles.messageRow, item.role === 'human' && styles.humanRow]}>
            <View style={[styles.avatar, item.role === 'human' && styles.userAvatar]}>
              <Text style={styles.avatarText}>{item.role === 'ai' ? 'AI' : (user?.name?.[0] ?? 'U')}</Text>
            </View>
            <View style={[styles.bubble, item.role === 'human' && styles.humanBubble]}>
              {item.reasoning ? <Text style={styles.reasoning}>{item.reasoning}</Text> : null}
              {item.role === 'ai'
                ? <Markdown style={markdownStyles}>{item.content || ' '}</Markdown>
                : <Text style={styles.humanText}>{item.content}</Text>}
            </View>
          </View>
        ))}
        {streaming && <Text style={styles.streaming}>AI 正在回复...</Text>}
      </ScrollView>
      <View style={styles.composer}>
        <View style={styles.switches}>
          <View style={styles.switchItem}><Zap size={15} color={colors.amber} /><Text style={styles.switchText}>深度思考</Text><Switch value={deepThink} onValueChange={setDeepThink} trackColor={{ true: colors.primary }} /></View>
          <View style={styles.switchItem}><Globe2 size={15} color={colors.green} /><Text style={styles.switchText}>联网搜索</Text><Switch value={webSearch} onValueChange={setWebSearch} trackColor={{ true: colors.primary }} /></View>
        </View>
        <View style={styles.composerRow}>
          <TextInput value={content} onChangeText={setContent} placeholder="输入消息" placeholderTextColor={colors.subtle} multiline style={styles.input} />
          <Button compact variant="secondary" icon={recording ? Pause : AudioLines} onPress={toggleVoice} />
          <Button compact icon={Send} loading={streaming} onPress={send} />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  modes: { padding: 10, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  mode: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F2F4F7' },
  modeActive: { backgroundColor: colors.primary },
  modeText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  heading: { padding: 13, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  headingTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  headingText: { marginTop: 2, color: colors.muted, fontSize: 12 },
  messages: { flex: 1, backgroundColor: '#F8FAFC' },
  messageContent: { padding: 12, paddingBottom: 20 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  messageRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  humanRow: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark },
  userAvatar: { backgroundColor: colors.green },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bubble: { maxWidth: '82%', paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.surface },
  humanBubble: { borderColor: colors.primary, backgroundColor: colors.primary },
  humanText: { color: '#fff', lineHeight: 21 },
  reasoning: { marginBottom: 8, padding: 8, borderLeftWidth: 3, borderLeftColor: '#D5A430', backgroundColor: '#FFF8DF', color: colors.muted, lineHeight: 20 },
  streaming: { color: colors.muted, fontSize: 12 },
  composer: { padding: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  switches: { flexDirection: 'row', gap: 14 },
  switchItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  switchText: { color: colors.text, fontSize: 11 },
  composerRow: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  input: { flex: 1, maxHeight: 100, minHeight: 42, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 6, color: colors.ink, textAlignVertical: 'top' },
})

const markdownStyles = {
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  paragraph: { marginTop: 0, marginBottom: 7 },
  code_inline: { backgroundColor: '#EEF0F3', color: colors.ink },
  fence: { backgroundColor: colors.dark, color: '#F8FAFC', padding: 10 },
}
