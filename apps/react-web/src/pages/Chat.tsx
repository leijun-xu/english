import {
  AudioOutlined,
  GlobalOutlined,
  PauseCircleOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ChatMessage, ChatMessageList, ChatMode, ChatRoleType } from '@en/common/chat'
import { Avatar, Button, Empty, Input, Segmented, Select, Space, Switch, Typography, message } from 'antd'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useRef, useState } from 'react'
import { chatApi } from '@/api'
import { useVoiceInput } from '@/hooks/services'
import { useAppStore } from '@/store/app'

export function ChatPage() {
  const userId = useAppStore((state) => state.user?.id)
  const [modes, setModes] = useState<ChatMode[]>([])
  const [role, setRole] = useState<ChatRoleType>('normal')
  const [messages, setMessages] = useState<ChatMessageList>([])
  const [content, setContent] = useState('')
  const [deepThink, setDeepThink] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<AbortController | null>(null)
  const { recording, start, stop } = useVoiceInput(setContent)

  useEffect(() => {
    chatApi.modes().then((response) => {
      if (response.success && response.data.length) {
        setModes(response.data)
        setRole(response.data[0].role)
      }
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    streamRef.current?.abort()
    chatApi.history(userId, role).then((response) => {
      if (response.success) setMessages(response.data)
    })
  }, [role, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => streamRef.current?.abort(), [])

  const send = () => {
    const text = content.trim()
    if (!text || !userId || streaming) return
    setContent('')
    setStreaming(true)
    setMessages((current) => [
      ...current,
      { role: 'human', content: text, type: 'chat' },
      { role: 'ai', content: '', reasoning: '', type: 'chat' },
    ])
    streamRef.current = chatApi.stream(
      { userId, role, content: text, deepThink, webSearch },
      (chunk) => {
        setMessages((current) =>
          current.map((item, index) => {
            if (index !== current.length - 1) return item
            return chunk.type === 'reasoning'
              ? { ...item, reasoning: `${item.reasoning ?? ''}${chunk.content}` }
              : { ...item, content: `${item.content}${chunk.content}` }
          }),
        )
      },
      () => {
        message.error('AI 服务连接失败')
        setStreaming(false)
      },
      () => setStreaming(false),
    )
    streamRef.current.signal.addEventListener('abort', () => setStreaming(false), { once: true })
  }

  const selectedMode = modes.find((mode) => mode.role === role)

  return (
    <div className="page-container section chat-page">
      <header className="chat-mobile-mode">
        <Select
          value={role}
          options={modes.map((mode) => ({ value: mode.role, label: mode.label }))}
          onChange={setRole}
        />
      </header>
      <aside className="chat-sidebar">
        <Typography.Title level={4}>对话模式</Typography.Title>
        <Segmented
          vertical
          value={role}
          options={modes.map((mode) => ({ value: mode.role, label: mode.label }))}
          onChange={(value) => setRole(value as ChatRoleType)}
        />
      </aside>
      <section className="chat-main">
        <header className="chat-heading">
          <div>
            <Typography.Title level={4}>{selectedMode?.label ?? 'AI 对话'}</Typography.Title>
            <Typography.Text type="secondary">对话会按当前模式自动保存</Typography.Text>
          </div>
        </header>
        <div className="chat-messages">
          {!messages.length && (
            <div className="chat-empty">
              <Empty description="发送一条消息开始对话" />
            </div>
          )}
          {messages.map((item, index) => (
            <div key={`${index}-${item.role}`} className={`chat-message ${item.role}`}>
              <Avatar>{item.role === 'human' ? '我' : 'AI'}</Avatar>
              <div className="message-content">
                {item.reasoning && (
                  <div className="reasoning">
                    <Typography.Text type="secondary">{item.reasoning}</Typography.Text>
                  </div>
                )}
                {item.content && (
                  item.role === 'ai' ? (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(item.content, { async: false }) as string),
                      }}
                    />
                  ) : (
                    <span>{item.content}</span>
                  )
                )}
              </div>
            </div>
          ))}
          {streaming && <Typography.Text type="secondary">AI 正在回复...</Typography.Text>}
          <div ref={bottomRef} />
        </div>
        <footer className="chat-composer">
          <Space wrap>
            <Space size="small">
              <ThunderboltOutlined />
              <Typography.Text>深度思考</Typography.Text>
              <Switch size="small" checked={deepThink} onChange={setDeepThink} />
            </Space>
            <Space size="small">
              <GlobalOutlined />
              <Typography.Text>联网搜索</Typography.Text>
              <Switch size="small" checked={webSearch} onChange={setWebSearch} />
            </Space>
          </Space>
          <div className="composer-row">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 5 }}
              value={content}
              placeholder="输入消息，Enter 发送，Shift + Enter 换行"
              onChange={(event) => setContent(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
            />
            <Button
              shape="circle"
              icon={recording ? <PauseCircleOutlined /> : <AudioOutlined />}
              aria-label={recording ? '停止语音输入' : '开始语音输入'}
              onClick={() => {
                try {
                  if (recording) stop()
                  else start()
                } catch (error) {
                  message.error(error instanceof Error ? error.message : '语音识别启动失败')
                }
              }}
            />
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              loading={streaming}
              aria-label="发送消息"
              onClick={send}
            />
          </div>
        </footer>
      </section>
    </div>
  )
}
