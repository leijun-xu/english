import type { Course, CourseList } from '@en/common/course'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { BookOpen, Clock3, ShoppingCart } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View, ScrollView } from 'react-native'
import { courseApi, payApi, resolveUploadUrl } from '../api'
import { Button, EmptyState, LoadingState, Segments, Sheet } from '../components/ui'
import { getSocket, notify } from '../services/native'
import { requireLogin, useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'
import type { CourseTab } from '../types'

export function CoursesScreen() {
  const user = useAppStore((state) => state.user)
  const [tab, setTab] = useState<CourseTab>('list')
  const [courses, setCourses] = useState<CourseList>([])
  const [selected, setSelected] = useState<Course | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (currentTab: CourseTab) => {
    setLoading(true)
    try {
      const response = currentTab === 'list' ? await courseApi.list() : await courseApi.mine()
      if (response.success) setCourses(response.data)
      else notify(response.message)
    } catch {
      notify('课程加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tab)
  }, [load, tab])

  const openCourse = (course: Course) => {
    if (!requireLogin()) return
    if (tab === 'mine') {
      router.push({ pathname: '/learn/[courseId]', params: { courseId: course.id, title: course.name } })
    } else {
      setSelected(course)
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>VOCABULARY COURSES</Text>
        <Text style={commonStyles.title}>精选课程</Text>
        <Text style={commonStyles.subtitle}>一次购买，长期有效，覆盖主流考试词汇</Text>
      </View>
      <Segments
        value={tab}
        options={[
          { value: 'list', label: '精选课程' },
          ...(user ? [{ value: 'mine' as const, label: '我的课程' }] : []),
        ]}
        onChange={setTab}
      />
      <View style={styles.list}>
        {loading ? <LoadingState /> : !courses.length ? (
          <EmptyState title={tab === 'mine' ? '暂无已购课程' : '暂无课程'} />
        ) : courses.map((course) => (
          <View key={course.id} style={[commonStyles.card, styles.course]}>
            <View style={styles.cover}>
              <Image source={{ uri: resolveUploadUrl(course.url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.coverTag}><BookOpen size={13} color={colors.text} /><Text style={styles.coverTagText}>词汇</Text></View>
            </View>
            <View style={styles.body}>
              <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
              <Text style={styles.description} numberOfLines={2}>{course.description || '--'}</Text>
              <View style={styles.meta}>
                <Text style={styles.teacher}>讲师 {course.teacher || '--'}</Text>
                <Text style={styles.price}>¥{course.price}</Text>
              </View>
              <Button
                title={tab === 'mine' ? '学习课程' : '购买课程'}
                variant={tab === 'mine' ? 'primary' : 'secondary'}
                icon={tab === 'mine' ? BookOpen : ShoppingCart}
                onPress={() => openCourse(course)}
              />
            </View>
          </View>
        ))}
      </View>
      <PaySheet
        course={selected}
        onClose={() => setSelected(null)}
        onSuccess={() => {
          setSelected(null)
          setTab('mine')
          load('mine')
        }}
      />
    </ScrollView>
  )
}

function PaySheet({ course, onClose, onSuccess }: { course: Course | null; onClose: () => void; onSuccess: () => void }) {
  const [expireAt, setExpireAt] = useState(0)
  const [paying, setPaying] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!course) return
    const success = () => {
      setPaying(false)
      setExpireAt(0)
      notify('支付成功')
      onSuccess()
    }
    getSocket()?.on('paymentSuccess', success)
    return () => { getSocket()?.off('paymentSuccess', success) }
  }, [course, onSuccess])

  useEffect(() => {
    if (!expireAt) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= expireAt) {
        setExpireAt(0)
        setPaying(false)
        notify('支付超时，请重新支付')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expireAt])

  const remaining = Math.max(0, Math.ceil((expireAt - now) / 1000))
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
  const confirm = async () => {
    if (!course) return
    try {
      const response = await payApi.create({
        subject: course.name,
        body: course.description || '',
        total_amount: course.price,
        courseId: course.id,
      })
      if (!response.success) return notify(response.message)
      setPaying(true)
      setExpireAt(response.data.timeExpire)
      setNow(Date.now())
      await WebBrowser.openBrowserAsync(response.data.payUrl)
    } catch {
      notify('支付创建失败')
    }
  }

  return (
    <Sheet open={Boolean(course)} title="确认支付" onClose={onClose}>
      {course && (
        <View style={styles.payContent}>
          <View style={styles.payCourse}>
            <Image source={{ uri: resolveUploadUrl(course.url) }} style={styles.payImage} />
            <View style={{ flex: 1 }}><Text style={styles.courseName}>{course.name}</Text><Text style={styles.teacher}>讲师 {course.teacher}</Text></View>
          </View>
          <Text style={styles.amountLabel}>支付金额</Text>
          <Text style={styles.amount}>¥{course.price}</Text>
          {paying && <View style={styles.timer}><Clock3 size={16} color={colors.amber} /><Text style={styles.timerText}>支付剩余时间 {time}</Text></View>}
          <View style={styles.payActions}>
            <View style={{ flex: 1 }}><Button title="取消" variant="secondary" onPress={onClose} /></View>
            <View style={{ flex: 1 }}><Button title={paying ? '等待支付' : '确认支付'} loading={paying} onPress={confirm} /></View>
          </View>
        </View>
      )}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 11, marginBottom: 6 },
  list: { marginTop: 18, gap: 14 },
  course: { overflow: 'hidden' },
  cover: { height: 220, backgroundColor: '#EDF0F4' },
  coverTag: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.92)' },
  coverTagText: { color: colors.text, fontSize: 11 },
  body: { padding: 18 },
  courseName: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  description: { height: 44, marginTop: 8, color: colors.muted, lineHeight: 21 },
  meta: { minHeight: 50, marginVertical: 15, paddingTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  teacher: { marginTop: 4, color: colors.muted, fontSize: 13 },
  price: { color: '#D94F3D', fontSize: 20, fontWeight: '700' },
  payContent: { gap: 16 },
  payCourse: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 6 },
  payImage: { width: 76, height: 76, borderRadius: 4, backgroundColor: '#EDF0F4' },
  amountLabel: { color: colors.muted, fontSize: 13 },
  amount: { color: colors.ink, fontSize: 30, fontWeight: '700' },
  timer: { alignSelf: 'flex-start', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 5, backgroundColor: colors.amberSoft },
  timerText: { color: colors.amber, fontSize: 12, fontWeight: '600' },
  payActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
})
