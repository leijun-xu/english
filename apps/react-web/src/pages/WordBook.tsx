import { ReadOutlined, SearchOutlined, SoundOutlined } from '@ant-design/icons'
import type { Word, WordQuery } from '@en/common/word'
import { Button, Checkbox, Col, Empty, Input, Pagination, Row, Skeleton, Tag, Typography } from 'antd'
import DOMPurify from 'dompurify'
import { useCallback, useEffect, useState } from 'react'
import { wordApi } from '@/api'
import { speakEnglish } from '@/hooks/services'

const filters = [
  ['gk', '高考'],
  ['zk', '中考'],
  ['gre', 'GRE'],
  ['toefl', 'TOEFL'],
  ['ielts', 'IELTS'],
  ['cet6', '六级'],
  ['cet4', '四级'],
  ['ky', '考研'],
] as const

type FilterKey = (typeof filters)[number][0]

export function WordBookPage() {
  const [query, setQuery] = useState<WordQuery>({ page: 1, pageSize: 12, word: '' })
  const [selected, setSelected] = useState<FilterKey[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (nextQuery: WordQuery, nextSelected: FilterKey[]) => {
    setLoading(true)
    try {
      const filterQuery = Object.fromEntries(filters.map(([key]) => [key, nextSelected.includes(key)]))
      const response = await wordApi.list({ ...nextQuery, ...filterQuery })
      if (response.success) {
        setWords(response.data.list)
        setTotal(response.data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(query, selected)
  }, [load, query.page, query.pageSize])

  const search = () => {
    const next = { ...query, page: 1 }
    setQuery(next)
    load(next, selected)
  }

  return (
    <div className="page-container section">
      <header className="page-heading">
        <div className="heading-icon"><ReadOutlined /></div>
        <div>
          <Typography.Title level={2}>词库列表</Typography.Title>
          <Typography.Text type="secondary">
            来源覆盖牛津、柯林斯、高考、四六级、考研、GRE、TOEFL 和 IELTS
          </Typography.Text>
        </div>
      </header>

      <div className="filter-bar">
        <Input
          allowClear
          value={query.word}
          prefix={<SearchOutlined />}
          placeholder="搜索单词"
          onPressEnter={search}
          onChange={(event) => setQuery((current) => ({ ...current, word: event.target.value }))}
        />
        <Checkbox.Group
          className="filter-options"
          value={selected}
          options={filters.map(([value, label]) => ({ value, label }))}
          onChange={(values) => setSelected(values as FilterKey[])}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: query.pageSize }).map((_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <article className="word-card word-card-skeleton">
                <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 3 }} />
              </article>
            </Col>
          ))}
        </Row>
      ) : words.length ? (
        <>
          <Row gutter={[16, 16]}>
            {words.map((word) => (
              <Col xs={24} sm={12} lg={8} key={word.id}>
                <article className="word-card">
                  <div className="word-title">
                    <div>
                      <Typography.Title level={4}>{word.word}</Typography.Title>
                      <Typography.Text type="secondary">{word.phonetic || '--'}</Typography.Text>
                    </div>
                    <Button
                      type="text"
                      shape="circle"
                      icon={<SoundOutlined />}
                      aria-label={`播放 ${word.word} 发音`}
                      onClick={() => speakEnglish(word.word)}
                    />
                  </div>
                  <Typography.Paragraph ellipsis={{ rows: 2 }}>{word.definition || '--'}</Typography.Paragraph>
                  <div
                    className="word-translation"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(word.translation || '--'),
                    }}
                  />
                  <div className="word-tags">
                    {filters.map(([key, label]) => word[key] && <Tag key={key}>{label}</Tag>)}
                  </div>
                </article>
              </Col>
            ))}
          </Row>
          <Pagination
            className="page-pagination"
            current={query.page}
            pageSize={query.pageSize}
            total={total}
            showSizeChanger
            onChange={(page, pageSize) => setQuery((current) => ({ ...current, page, pageSize }))}
          />
        </>
      ) : (
        <Empty className="page-empty" description="暂无匹配单词" />
      )}
    </div>
  )
}
