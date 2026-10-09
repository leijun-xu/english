import { CopyOutlined, SearchOutlined, SoundOutlined } from '@ant-design/icons'
import type { Word } from '@en/common/word'
import { Button, Empty, Input, List, Modal, Tooltip, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { wordApi } from '@/api'
import { speakEnglish } from '@/hooks/services'
import { useAppStore } from '@/store/app'

export function SearchModal() {
  const open = useAppStore((state) => state.searchOpen)
  const setOpen = useAppStore((state) => state.setSearchOpen)
  const [keyword, setKeyword] = useState('')
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [setOpen])

  useEffect(() => {
    if (!keyword.trim()) {
      setWords([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const timer = window.setTimeout(async () => {
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
      window.clearTimeout(timer)
    }
  }, [keyword])

  const close = () => {
    setOpen(false)
    setKeyword('')
    setWords([])
    setLoading(false)
  }

  const copyWord = async (word: string) => {
    await navigator.clipboard.writeText(word)
    message.success('单词已复制')
  }

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      width={640}
      centered
      className="search-modal"
      title={(
        <div className="search-modal-title">
          <span><SearchOutlined /></span>
          <strong>搜索单词</strong>
        </div>
      )}
    >
      <Input
        className="search-modal-input"
        autoFocus
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        value={keyword}
        placeholder="输入英文单词"
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="search-results">
        {!keyword.trim() ? (
          <div className="search-initial">
            <SearchOutlined />
            <Typography.Text type="secondary">搜索你的词汇</Typography.Text>
          </div>
        ) : !loading && words.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有找到相关单词" />
        ) : (
          <List
            loading={loading}
            dataSource={words}
            renderItem={(word) => (
              <List.Item className="search-result"
                actions={[
                  <Tooltip title="播放发音" key="sound">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<SoundOutlined />}
                      aria-label={`播放 ${word.word} 发音`}
                      onClick={() => speakEnglish(word.word)}
                    />
                  </Tooltip>,
                  <Tooltip title="复制单词" key="copy">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<CopyOutlined />}
                      aria-label={`复制 ${word.word}`}
                      onClick={() => copyWord(word.word)}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  title={(
                    <div className="search-word-title">
                      <Typography.Text strong>{word.word}</Typography.Text>
                      <Typography.Text type="secondary">{word.phonetic || '--'}</Typography.Text>
                    </div>
                  )}
                  description={
                    <span className="search-word-translation"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(word.translation ?? '--'),
                      }}
                    />
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  )
}
