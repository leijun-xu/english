import { EyeInvisibleOutlined, EyeOutlined, LeftOutlined, RightOutlined, SoundOutlined } from '@ant-design/icons'
import type { Word } from '@en/common/word'
import { Button, Empty, Progress, Result, Skeleton, Space, Typography, message } from 'antd'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { courseApi } from '@/api'
import { speakEnglish } from '@/hooks/services'
import { useAppStore } from '@/store/app'

interface LetterState {
  expected: string
  input: string
  valid?: boolean
}

export function LearnPage() {
  const { courseId = '', title = '我的课程' } = useParams()
  const [words, setWords] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [letters, setLetters] = useState<LetterState[]>([])
  const [blurred, setBlurred] = useState(true)
  const [loading, setLoading] = useState(true)
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const updateWordNumber = useAppStore((state) => state.updateWordNumber)
  const current = words[index]

  const load = async () => {
    setLoading(true)
    try {
      const response = await courseApi.words(courseId)
      if (response.success) setWords(response.data)
      else message.error(response.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [courseId])

  useEffect(() => {
    setBlurred(true)
    setLetters(
      Array.from(current?.word ?? '').map((expected) => ({ expected, input: '', valid: undefined })),
    )
    inputs.current = []
  }, [current?.id])

  const complete = useMemo(
    () => letters.length > 0 && letters.every((letter) => letter.valid),
    [letters],
  )

  const updateLetter = (letterIndex: number, value: string) => {
    const input = value.slice(-1)
    setLetters((currentLetters) =>
      currentLetters.map((letter, currentIndex) =>
        currentIndex === letterIndex
          ? { ...letter, input, valid: input ? letter.expected === input : undefined }
          : letter,
      ),
    )
    if (input && letterIndex < letters.length - 1) {
      window.setTimeout(() => inputs.current[letterIndex + 1]?.focus())
    }
  }

  const finishGroup = async () => {
    const response = await courseApi.saveWords(words.map((word) => word.id))
    if (!response.success) {
      message.error(response.message)
      return
    }
    updateWordNumber(response.data.wordNumber)
    message.success(response.message)
    setIndex(0)
    await load()
  }

  if (loading) {
    return <div className="page-container section"><Skeleton active paragraph={{ rows: 12 }} /></div>
  }

  return (
    <div className="page-container section learn-page">
      <header className="section-heading">
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Text type="secondary">请根据释义和翻译完成单词拼写</Typography.Text>
      </header>
      {!words.length ? (
        <Empty description="暂无单词或您尚未购买该课程" />
      ) : index >= words.length ? (
        <Result
          status="success"
          title="本组单词已学完"
          subTitle="保存后将记录为已掌握，并自动获取下一组单词。"
          extra={<Button type="primary" size="large" onClick={finishGroup}>保存并继续</Button>}
        />
      ) : (
        <>
          <Progress percent={Math.round((index / words.length) * 100)} showInfo={false} />
          <article className="learn-panel">
            <div className="learn-word-row">
              <div className={blurred ? 'learn-word blurred' : 'learn-word'}>
                <Typography.Title level={2}>{current.word}</Typography.Title>
                <Space>
                  <Typography.Text type="secondary">{current.phonetic || '--'}</Typography.Text>
                  <Button
                    type="text"
                    shape="circle"
                    icon={<SoundOutlined />}
                    onClick={() => speakEnglish(current.word)}
                  />
                </Space>
              </div>
              <Button
                type="text"
                shape="circle"
                icon={blurred ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                aria-label={blurred ? '显示单词' : '隐藏单词'}
                onClick={() => setBlurred((value) => !value)}
              />
            </div>
            <Definition label="释义" html={current.definition} />
            <Definition label="翻译" html={current.translation} />
            <div className="definition-block">
              <Typography.Text type="secondary">拼写</Typography.Text>
              <div className="letter-inputs">
                {letters.map((letter, letterIndex) => (
                  <input
                    key={letterIndex}
                    ref={(element) => { inputs.current[letterIndex] = element }}
                    value={letter.input}
                    maxLength={1}
                    className={letter.valid === true ? 'valid' : letter.valid === false ? 'invalid' : ''}
                    aria-label={`第 ${letterIndex + 1} 个字母`}
                    onChange={(event) => updateLetter(letterIndex, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !letter.input && letterIndex > 0) {
                        inputs.current[letterIndex - 1]?.focus()
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="learn-actions">
              <Button
                icon={<LeftOutlined />}
                disabled={index === 0}
                onClick={() => setIndex((value) => value - 1)}
              >
                上一个
              </Button>
              <Button
                type="primary"
                icon={<RightOutlined />}
                disabled={!complete}
                onClick={() => setIndex((value) => value + 1)}
              >
                下一个
              </Button>
            </div>
          </article>
        </>
      )}
    </div>
  )
}

function Definition({ label, html }: { label: string; html?: string }) {
  return (
    <div className="definition-block">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || '--') }} />
    </div>
  )
}
