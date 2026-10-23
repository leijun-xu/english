import { router } from 'expo-router'
import { AudioLines, BookOpen, Bot, MessageCircle, Sparkles } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui'
import { requireLogin, useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'

const stats = [
  ['1,000,000+', '累计学员'],
  ['500+', '精品课程'],
  ['98%', '学员满意度'],
  ['5,000,000小时', '学习时长'],
]

const features = [
  { icon: Sparkles, color: colors.primary, background: colors.primarySoft, title: 'AI 情境学习', description: '沉浸式场景模拟，在真实语境中自然习得英语。' },
  { icon: MessageCircle, color: colors.green, background: colors.greenSoft, title: '智能对话练习', description: 'AI 实时反馈，多种对话模式，随时练习表达。' },
  { icon: AudioLines, color: colors.amber, background: colors.amberSoft, title: '词汇拼写训练', description: '结合发音、释义和逐字母校验，稳步积累词汇。' },
]

export function HomeScreen() {
  const user = useAppStore((state) => state.user)
  const showAuth = useAppStore((state) => state.showAuth)

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.badge}><Text style={styles.badgeText}>坚持学习，让进步可见</Text></View>
        <View style={styles.assistant}>
          <Bot size={58} color="#A8EEE0" />
        </View>
        <Text style={styles.heroTitle}>通过 AI 对话与词汇训练，提高你的英语能力</Text>
        <Text style={styles.heroDescription}>
          从查词、选课到拼写练习和 AI 陪练，在一个学习空间完成每天的英语训练。
        </Text>
        <View style={styles.heroActions}>
          <Button title="立即学习" onPress={() => requireLogin() && router.push('/chat')} />
          <Button title="查看课程" variant="secondary" icon={BookOpen} onPress={() => router.push('/courses')} />
        </View>
      </View>

      {!user && (
        <View style={styles.loginBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loginTitle}>保存你的学习进度</Text>
            <Text style={styles.loginText}>登录后同步课程、已学单词和打卡天数。</Text>
          </View>
          <Button compact title="登录" onPress={() => showAuth()} />
        </View>
      )}

      <View style={styles.stats}>
        {stats.map(([value, label]) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.eyebrow}>核心能力</Text>
        <Text style={commonStyles.title}>重新组织英语学习方式</Text>
      </View>
      <View style={styles.features}>
        {features.map(({ icon: Icon, ...item }) => (
          <View key={item.title} style={[commonStyles.card, styles.feature]}>
            <View style={[styles.featureIcon, { backgroundColor: item.background }]}>
              <Icon size={22} color={item.color} />
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { paddingBottom: 34 },
  hero: { minHeight: 500, padding: 24, justifyContent: 'center', backgroundColor: colors.dark },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#3D8C7D', borderRadius: 14, backgroundColor: '#153D39' },
  badgeText: { color: '#A8EEE0', fontSize: 12, fontWeight: '600' },
  assistant: { width: 104, height: 104, marginTop: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#506ED5', borderRadius: 52, backgroundColor: '#232D49' },
  heroTitle: { marginTop: 26, color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 42 },
  heroDescription: { marginTop: 16, color: '#BEC5D3', fontSize: 16, lineHeight: 25 },
  heroActions: { marginTop: 26, flexDirection: 'row', gap: 10 },
  loginBanner: { margin: 16, marginBottom: 0, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#CDD5F5', borderRadius: 8, backgroundColor: colors.primarySoft },
  loginTitle: { color: colors.ink, fontWeight: '700' },
  loginText: { marginTop: 3, color: colors.muted, fontSize: 12, lineHeight: 18 },
  stats: { paddingVertical: 22, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface },
  stat: { width: '50%', paddingVertical: 13, alignItems: 'center' },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  statLabel: { marginTop: 5, color: colors.muted, fontSize: 12 },
  sectionHeading: { padding: 20, paddingTop: 34, alignItems: 'center' },
  eyebrow: { marginBottom: 6, color: colors.muted, fontSize: 12 },
  features: { paddingHorizontal: 16, gap: 12 },
  feature: { padding: 20 },
  featureIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  featureTitle: { marginTop: 16, color: colors.ink, fontSize: 17, fontWeight: '700' },
  featureDescription: { marginTop: 7, color: colors.muted, lineHeight: 22 },
})
