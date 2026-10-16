import {
  AlertOutlined,
  AreaChartOutlined,
  BugOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ExportOutlined,
  EyeOutlined,
  FireOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type {
  TrackerAnalytics,
  TrackerAnalyticsQuery,
  TrackerEventRank,
  TrackerMetric,
  TrackerTopPath,
  TrackerTrendPoint,
} from '@en/common/tracker'
import { Button, Col, DatePicker, Empty, Row, Segmented, Statistic, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { trackerApi } from '@/api'

type RangeKey = 'today' | '7d' | '30d'

interface MetricCard {
  key: TrackerMetric['key']
  title: string
  value: number
  suffix?: string
  precision?: number
  trend: string
  status: 'success' | 'processing' | 'warning' | 'error'
  icon: ReactNode
}

interface RecentError {
  key: string
  error: string
  message: string | null
  url: string | null
  createdAt: string
}

const emptyAnalytics: TrackerAnalytics = {
  metrics: [],
  trendData: [],
  topPaths: [],
  eventRanks: [],
  recentErrors: [],
  moduleCounts: {
    visitors: 0,
    pageViews: 0,
    events: 0,
    performance: 0,
    errors: 0,
  },
}

const metricConfigs: Record<TrackerMetric['key'], Omit<MetricCard, 'value' | 'trend'>> = {
  visitors: {
    key: 'visitors',
    title: '访客数',
    status: 'success',
    icon: <UserOutlined />,
  },
  pageViews: {
    key: 'pageViews',
    title: '浏览量',
    status: 'processing',
    icon: <EyeOutlined />,
  },
  events: {
    key: 'events',
    title: '事件数',
    status: 'success',
    icon: <ThunderboltOutlined />,
  },
  lcp: {
    key: 'lcp',
    title: '平均 LCP',
    suffix: 's',
    precision: 2,
    status: 'warning',
    icon: <ClockCircleOutlined />,
  },
  errors: {
    key: 'errors',
    title: '错误数',
    status: 'error',
    icon: <BugOutlined />,
  },
}

const defaultMetrics: MetricCard[] = [
  {
    key: 'visitors',
    title: '访客数',
    value: 0,
    trend: '0.0%',
    status: 'success',
    icon: <UserOutlined />,
  },
  {
    key: 'pageViews',
    title: '浏览量',
    value: 0,
    trend: '0.0%',
    status: 'processing',
    icon: <EyeOutlined />,
  },
  {
    key: 'events',
    title: '事件数',
    value: 0,
    trend: '0.0%',
    status: 'success',
    icon: <ThunderboltOutlined />,
  },
  {
    key: 'lcp',
    title: '平均 LCP',
    value: 0,
    suffix: 's',
    precision: 2,
    trend: '0s',
    status: 'warning',
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'errors',
    title: '错误数',
    value: 0,
    trend: '+0',
    status: 'error',
    icon: <BugOutlined />,
  },
]

const moduleCardConfigs = [
  { name: 'Visitor', desc: '用户标识、设备、系统、浏览器', countKey: 'visitors', path: '/analytics/visitors' },
  { name: 'PageView', desc: '访问路径、来源、访问时间', countKey: 'pageViews', path: '/analytics/page-views' },
  { name: 'TrackEvent', desc: '点击、提交、学习等业务事件', countKey: 'events', path: '/analytics/events' },
  { name: 'PerformanceEntry', desc: 'FP、FCP、LCP、INP、CLS', countKey: 'performance', path: '/analytics/performance' },
  { name: 'ErrorEntry', desc: '错误类型、消息、堆栈与页面', countKey: 'errors', path: '/analytics/errors' },
] as const

const errorColumns: ColumnsType<RecentError> = [
  {
    title: '错误类型',
    dataIndex: 'error',
    render: (value: string) => <Typography.Text strong>{value || '--'}</Typography.Text>,
  },
  {
    title: '错误信息',
    dataIndex: 'message',
    ellipsis: true,
    render: (value: string) => value || '--',
  },
  {
    title: '页面',
    dataIndex: 'url',
    render: (value: string) => <Tag>{value || '--'}</Tag>,
  },
  {
    title: '时间',
    dataIndex: 'createdAt',
    width: 110,
    render: (value: string) => value || '--',
  },
]

const formatDate = (value: Date | string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

export function AnalyticsDashboardPage() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [dateRange, setDateRange] = useState<Pick<TrackerAnalyticsQuery, 'startDate' | 'endDate'>>({})
  const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs] | null>(null)
  const [analytics, setAnalytics] = useState<TrackerAnalytics>(emptyAnalytics)
  const [loading, setLoading] = useState(false)
  const trendData = analytics.trendData
  const topPaths = analytics.topPaths
  const eventRanks = analytics.eventRanks
  const recentErrors = useMemo(
    () => analytics.recentErrors.map((item) => ({
      key: item.id,
      error: item.error,
      message: item.message,
      url: item.url,
      createdAt: formatDate(item.createdAt),
    })),
    [analytics.recentErrors],
  )
  const metrics = useMemo(() => {
    const metricMap = new Map(analytics.metrics.map((item) => [item.key, item]))
    return defaultMetrics.map((item) => {
      const metric = metricMap.get(item.key)
      return metric ? { ...metricConfigs[item.key], value: metric.value, trend: metric.trend } : item
    })
  }, [analytics.metrics])
  const moduleCards = useMemo(
    () => moduleCardConfigs.map((item) => ({
      ...item,
      count: analytics.moduleCounts[item.countKey],
    })),
    [analytics.moduleCounts],
  )
  const maxTrendValue = useMemo(
    () => Math.max(...trendData.flatMap((item) => [item.pageViews, item.visitors, item.events]), 1),
    [trendData],
  )
  const maxPathViews = useMemo(
    () => Math.max(...topPaths.map((item) => item.views), 1),
    [topPaths],
  )
  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const query = dateRange.startDate && dateRange.endDate ? dateRange : { range }
      const response = await trackerApi.analytics(query)
      if (response.success) {
        setAnalytics(response.data)
      } else {
        message.error(response.message)
      }
    } catch {
      setAnalytics(emptyAnalytics)
    } finally {
      setLoading(false)
    }
  }, [dateRange, range])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return (
    <div className="page-container section analytics-page">
      <div className="analytics-heading">
        <div className="analytics-title">
          <span className="heading-icon"><DashboardOutlined /></span>
          <div>
            <Typography.Text type="secondary">TRACKING DASHBOARD</Typography.Text>
            <Typography.Title level={2}>埋点分析看板</Typography.Title>
            <Typography.Paragraph type="secondary">
              聚合访客、浏览、事件、性能和错误数据，快速判断页面表现和用户行为。
            </Typography.Paragraph>
          </div>
        </div>
        <div className="analytics-actions">
          <Segmented
            value={range}
            onChange={(value) => {
              setRange(value as RangeKey)
              setDateRange({})
              setSelectedDates(null)
            }}
            options={[
              { label: '今日', value: 'today' },
              { label: '近 7 天', value: '7d' },
              { label: '近 30 天', value: '30d' },
            ]}
          />
          <DatePicker.RangePicker
            value={selectedDates}
            onChange={(dates, dateStrings) => {
              const [startDate, endDate] = dateStrings
              setSelectedDates(dates as [Dayjs, Dayjs] | null)
              setDateRange(startDate && endDate ? { startDate, endDate } : {})
            }}
          />
        </div>
      </div>

      <Row gutter={[16, 16]} className="analytics-metrics">
        {metrics.map((item) => (
          <Col xs={24} sm={12} lg={8} flex="1 1 190px" key={item.key}>
            <section className={`analytics-metric-card ${item.status}`}>
              <div className="analytics-metric-icon">{item.icon}</div>
              <Statistic
                title={item.title}
                value={item.value}
                precision={item.precision}
                suffix={item.suffix}
              />
              <Tag color={item.status}>{loading ? '--' : item.trend}</Tag>
            </section>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]} className="analytics-main-grid">
        <Col xs={24} xl={16}>
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <Typography.Title level={4}>访问趋势</Typography.Title>
                <Typography.Text type="secondary">PV、UV 和事件量的日维度走势</Typography.Text>
              </div>
              <Tag icon={<AreaChartOutlined />} color="blue">{range === 'today' ? '小时' : '天'}</Tag>
            </div>
            <div className="analytics-trend-chart" aria-label="访问趋势柱状图">
              {trendData.length ? trendData.map((item: TrackerTrendPoint) => (
                <div className="analytics-trend-item" key={item.date}>
                  <div className="analytics-trend-bars">
                    <span
                      className="page-views"
                      style={{ height: `${Math.max(12, (item.pageViews / maxTrendValue) * 100)}%` }}
                      title={`PV ${item.pageViews}`}
                    />
                    <span
                      className="visitors"
                      style={{ height: `${Math.max(12, (item.visitors / maxTrendValue) * 100)}%` }}
                      title={`UV ${item.visitors}`}
                    />
                    <span
                      className="events"
                      style={{ height: `${Math.max(12, (item.events / maxTrendValue) * 100)}%` }}
                      title={`事件 ${item.events}`}
                    />
                  </div>
                  <span>{item.date}</span>
                </div>
              )) : (
                <div className="analytics-empty-chart">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无趋势数据" />
                </div>
              )}
            </div>
            <div className="analytics-legend">
              <span><i className="page-views" />浏览量</span>
              <span><i className="visitors" />访客数</span>
              <span><i className="events" />事件数</span>
            </div>
          </section>
        </Col>

        <Col xs={24} xl={8}>
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <Typography.Title level={4}>热门页面</Typography.Title>
                <Typography.Text type="secondary">按浏览量排序</Typography.Text>
              </div>
              <FireOutlined className="analytics-panel-icon" />
            </div>
            {topPaths.length ? (
              <div className="analytics-rank-list">
                {topPaths.map((item: TrackerTopPath, index) => (
                  <div className="analytics-rank-item" key={item.path}>
                    <div className="analytics-rank-meta">
                      <strong>{index + 1}</strong>
                      <span>{item.path || '--'}</span>
                      <em>{item.views}</em>
                    </div>
                    <div className="analytics-rank-bar">
                      <span style={{ width: `${(item.views / maxPathViews) * 100}%` }} />
                    </div>
                    <Typography.Text type="secondary">{item.visitors} 访客</Typography.Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无页面数据" />
            )}
          </section>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <Typography.Title level={4}>事件排行</Typography.Title>
                <Typography.Text type="secondary">高频行为与转化占比</Typography.Text>
              </div>
              <ThunderboltOutlined className="analytics-panel-icon" />
            </div>
            {eventRanks.length ? (
              <div className="analytics-event-list">
                {eventRanks.map((item: TrackerEventRank) => (
                  <div className="analytics-event-item" key={item.event}>
                    <div>
                      <Typography.Text strong>{item.event || '--'}</Typography.Text>
                      <Typography.Text type="secondary">{item.conversion} 转化占比</Typography.Text>
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无事件数据" />
            )}
          </section>
        </Col>

        <Col xs={24} lg={14}>
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <Typography.Title level={4}>最近错误</Typography.Title>
                <Typography.Text type="secondary">来自 ErrorEntry 的最新异常</Typography.Text>
              </div>
              <Tag icon={<AlertOutlined />} color="error">需关注</Tag>
            </div>
            <Table
              className="analytics-error-table"
              size="middle"
              columns={errorColumns}
              dataSource={recentErrors}
              loading={loading}
              pagination={false}
              scroll={{ x: 620 }}
            />
          </section>
        </Col>
      </Row>

      <section className="analytics-panel analytics-modules">
        <div className="analytics-panel-heading">
          <div>
            <Typography.Title level={4}>明细模块</Typography.Title>
            <Typography.Text type="secondary">后续五个列表查询模块从这里进入</Typography.Text>
          </div>
        </div>
        <Row gutter={[14, 14]}>
          {moduleCards.map((item) => (
            <Col xs={24} sm={12} lg={8} flex="1 1 190px" key={item.name}>
              <article className="analytics-module-card">
                <Typography.Text strong>{item.name}</Typography.Text>
                <Typography.Paragraph type="secondary">{item.desc}</Typography.Paragraph>
                <div>
                  <strong>{item.count}</strong>
                  <Button type="link" disabled>列表查询</Button>
                </div>
              </article>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  )
}
