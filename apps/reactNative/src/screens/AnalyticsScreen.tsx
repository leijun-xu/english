import type { TrackerAnalytics, TrackerMetric } from '@en/common/tracker'
import { AlertTriangle, BarChart3, Bug, Clock3, Eye, Flame, UserRound, Zap } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { trackerApi } from '../api'
import { EmptyState, Segments } from '../components/ui'
import { notify } from '../services/native'
import { colors, commonStyles } from '../theme'
import type { RangeKey } from '../types'

const emptyAnalytics: TrackerAnalytics = {
  metrics: [], trendData: [], topPaths: [], eventRanks: [], recentErrors: [],
  moduleCounts: { visitors: 0, pageViews: 0, events: 0, performance: 0, errors: 0 },
}
const metricConfig: Record<TrackerMetric['key'], { title: string; icon: typeof UserRound; color: string; background: string }> = {
  visitors: { title: '访客数', icon: UserRound, color: colors.green, background: colors.greenSoft },
  pageViews: { title: '浏览量', icon: Eye, color: colors.primary, background: colors.primarySoft },
  events: { title: '事件数', icon: Zap, color: colors.green, background: colors.greenSoft },
  lcp: { title: '平均 LCP', icon: Clock3, color: colors.amber, background: colors.amberSoft },
  errors: { title: '错误数', icon: Bug, color: colors.red, background: colors.redSoft },
}

export function AnalyticsScreen() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [loading, setLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await trackerApi.analytics({ range })
      if (response.success) setAnalytics(response.data)
      else notify(response.message)
    } catch {
      setAnalytics(emptyAnalytics)
      notify('分析数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [range])
  useEffect(() => { load() }, [load])
  const maxTrend = useMemo(() => Math.max(...analytics.trendData.flatMap((item) => [item.pageViews, item.visitors, item.events]), 1), [analytics.trendData])
  const maxPath = useMemo(() => Math.max(...analytics.topPaths.map((item) => item.views), 1), [analytics.topPaths])

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}><BarChart3 color={colors.primary} size={22} /></View>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>TRACKING DASHBOARD</Text><Text style={commonStyles.title}>埋点分析看板</Text><Text style={commonStyles.subtitle}>聚合访客、浏览、事件、性能和错误数据</Text></View>
      </View>
      <Segments value={range} options={[{ value: 'today', label: '今日' }, { value: '7d', label: '近 7 天' }, { value: '30d', label: '近 30 天' }]} onChange={setRange} />
      <View style={styles.metrics}>
        {(Object.keys(metricConfig) as TrackerMetric['key'][]).map((key) => {
          const item = analytics.metrics.find((metric) => metric.key === key)
          const config = metricConfig[key]
          const Icon = config.icon
          return <View key={key} style={[commonStyles.card, styles.metric]}><View style={[styles.metricIcon, { backgroundColor: config.background }]}><Icon size={18} color={config.color} /></View><Text style={styles.metricTitle}>{config.title}</Text><Text style={styles.metricValue}>{loading ? '--' : `${item?.value ?? 0}${key === 'lcp' ? 's' : ''}`}</Text><Text style={[styles.trend, { color: config.color }]}>{item?.trend ?? (key === 'errors' ? '+0' : '0.0%')}</Text></View>
        })}
      </View>
      <Panel title="访问趋势" subtitle="PV、UV 和事件量走势">
        {!analytics.trendData.length ? <EmptyState title="暂无趋势数据" /> : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
              {analytics.trendData.map((item) => <View key={item.date} style={styles.chartItem}><View style={styles.bars}><View style={[styles.bar, { height: Math.max(10, item.pageViews / maxTrend * 150), backgroundColor: colors.primary }]} /><View style={[styles.bar, { height: Math.max(10, item.visitors / maxTrend * 150), backgroundColor: colors.green }]} /><View style={[styles.bar, { height: Math.max(10, item.events / maxTrend * 150), backgroundColor: '#D5A430' }]} /></View><Text style={styles.chartLabel}>{item.date}</Text></View>)}
            </ScrollView>
            <Text style={styles.legend}>蓝色 浏览量   绿色 访客数   黄色 事件数</Text>
          </>
        )}
      </Panel>
      <Panel title="热门页面" subtitle="按浏览量排序" icon={<Flame color={colors.amber} size={20} />}>
        {!analytics.topPaths.length ? <EmptyState title="暂无页面数据" /> : analytics.topPaths.map((item, index) => <View key={item.path} style={styles.rank}><View style={styles.rankLine}><Text style={styles.rankNumber}>{index + 1}</Text><Text style={styles.rankPath} numberOfLines={1}>{item.path || '--'}</Text><Text style={styles.rankValue}>{item.views}</Text></View><View style={styles.rankBar}><View style={[styles.rankFill, { width: `${item.views / maxPath * 100}%` }]} /></View><Text style={styles.rankVisitors}>{item.visitors} 访客</Text></View>)}
      </Panel>
      <Panel title="事件排行" subtitle="高频行为与转化占比">
        {!analytics.eventRanks.length ? <EmptyState title="暂无事件数据" /> : analytics.eventRanks.map((item) => <View key={item.event} style={styles.event}><View style={{ flex: 1 }}><Text style={styles.eventName}>{item.event || '--'}</Text><Text style={styles.eventConversion}>{item.conversion} 转化占比</Text></View><Text style={styles.eventCount}>{item.count}</Text></View>)}
      </Panel>
      <Panel title="最近错误" subtitle="最新上报异常" icon={<AlertTriangle color={colors.red} size={20} />}>
        {!analytics.recentErrors.length ? <EmptyState title="暂无错误数据" /> : analytics.recentErrors.map((item) => <View key={item.id} style={styles.error}><Text style={styles.errorType}>{item.error || '--'}</Text><Text style={styles.errorMessage} numberOfLines={2}>{item.message || '--'}</Text><Text style={styles.errorMeta}>{item.url || '--'}  ·  {new Date(item.createdAt).toLocaleString()}</Text></View>)}
      </Panel>
      <Panel title="明细模块" subtitle="各采集模块数据量">
        {Object.entries(analytics.moduleCounts).map(([key, count]) => <View key={key} style={styles.module}><Text style={styles.moduleName}>{key}</Text><Text style={styles.moduleCount}>{count}</Text></View>)}
      </Panel>
    </ScrollView>
  )
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <View style={[commonStyles.card, styles.panel]}><View style={styles.panelHeading}><View><Text style={styles.panelTitle}>{title}</Text><Text style={styles.panelSubtitle}>{subtitle}</Text></View>{icon}</View>{children}</View>
}

const styles = StyleSheet.create({
  heading: { marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.primarySoft },
  eyebrow: { marginBottom: 4, color: colors.muted, fontSize: 10 },
  metrics: { marginVertical: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', minHeight: 145, padding: 15 },
  metricIcon: { width: 36, height: 36, marginBottom: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  metricTitle: { color: colors.muted, fontSize: 12 },
  metricValue: { marginTop: 5, color: colors.ink, fontSize: 24, fontWeight: '700' },
  trend: { marginTop: 5, fontSize: 12, fontWeight: '600' },
  panel: { marginBottom: 14, padding: 16 },
  panelHeading: { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' },
  panelTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  panelSubtitle: { marginTop: 3, color: colors.muted, fontSize: 12 },
  chart: { height: 200, alignItems: 'flex-end', gap: 14, paddingHorizontal: 5 },
  chartItem: { width: 46, alignItems: 'center' },
  bars: { height: 160, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { marginTop: 8, color: colors.muted, fontSize: 10 },
  legend: { marginTop: 10, color: colors.muted, fontSize: 11 },
  rank: { marginBottom: 15 },
  rankLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankNumber: { width: 24, height: 24, paddingTop: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.primarySoft, color: colors.primary, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  rankPath: { flex: 1, color: colors.text },
  rankValue: { color: colors.ink, fontWeight: '700' },
  rankBar: { height: 6, marginTop: 6, marginLeft: 32, overflow: 'hidden', borderRadius: 3, backgroundColor: '#EEF0F3' },
  rankFill: { height: '100%', backgroundColor: colors.primary },
  rankVisitors: { marginTop: 5, marginLeft: 32, color: colors.muted, fontSize: 11 },
  event: { marginBottom: 9, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEF0F3', borderRadius: 6, backgroundColor: '#FBFCFE' },
  eventName: { color: colors.text, fontWeight: '600' },
  eventConversion: { marginTop: 3, color: colors.muted, fontSize: 11 },
  eventCount: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  error: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EEF0F3' },
  errorType: { color: colors.red, fontWeight: '700' },
  errorMessage: { marginTop: 5, color: colors.text, lineHeight: 19 },
  errorMeta: { marginTop: 5, color: colors.muted, fontSize: 10 },
  module: { paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEF0F3' },
  moduleName: { color: colors.text },
  moduleCount: { color: colors.ink, fontWeight: '700' },
})
