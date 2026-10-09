import { ClockCircleOutlined, ReadOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import type { Course, CourseList } from '@en/common/course'
import { Button, Col, Empty, Image, Modal, Row, Skeleton, Space, Statistic, Tabs, Tag, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseApi, payApi, uploadUrl } from '@/api'
import { getSocket } from '@/hooks/services'
import { requireLogin, useAppStore } from '@/store/app'

type CourseTab = 'list' | 'mine'

export function CoursesPage() {
  const user = useAppStore((state) => state.user)
  const [tab, setTab] = useState<CourseTab>('list')
  const [courses, setCourses] = useState<CourseList>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Course | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async (currentTab: CourseTab) => {
    setLoading(true)
    try {
      const response = currentTab === 'list' ? await courseApi.list() : await courseApi.mine()
      if (response.success) setCourses(response.data)
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
      navigate(`/courses/${course.id}/learn/${encodeURIComponent(course.name)}`)
      return
    }
    setSelected(course)
  }

  return (
    <div className="page-container section">
      <header className="section-heading">
        <Typography.Text type="secondary">VOCABULARY COURSES</Typography.Text>
        <Typography.Title level={2}>精选课程</Typography.Title>
        <Typography.Paragraph type="secondary">一次购买，长期有效，覆盖主流考试词汇</Typography.Paragraph>
      </header>
      <Tabs
        className="course-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as CourseTab)}
        items={[
          { key: 'list', label: '精选课程' },
          ...(user ? [{ key: 'mine', label: '我的课程' }] : []),
        ]}
      />
      {loading ? (
        <Row gutter={[20, 20]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <article className="course-card course-card-skeleton">
                <div className="course-cover">
                  <div className="cover-skeleton" />
                </div>
                <div className="course-body">
                  <Skeleton active title={{ width: '55%' }} paragraph={{ rows: 2 }} />
                  <Skeleton.Button active block size="large" />
                </div>
              </article>
            </Col>
          ))}
        </Row>
      ) : courses.length ? (
        <Row gutter={[20, 20]}>
          {courses.map((course) => (
            <Col xs={24} sm={12} lg={8} key={course.id}>
              <article className="course-card">
                <div className="course-cover">
                  <Image preview={false} src={`${uploadUrl}${course.url}`} alt={course.name} />
                  <Tag icon={<ReadOutlined />}>词汇</Tag>
                </div>
                <div className="course-body">
                  <Typography.Title level={4} ellipsis>{course.name}</Typography.Title>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {course.description || '--'}
                  </Typography.Paragraph>
                  <div className="course-meta">
                    <Typography.Text type="secondary">讲师 {course.teacher || '--'}</Typography.Text>
                    <Typography.Text className="course-price">¥{course.price}</Typography.Text>
                  </div>
                  <Button
                    block
                    type={tab === 'mine' ? 'primary' : 'default'}
                    icon={tab === 'mine' ? <ReadOutlined /> : <ShoppingCartOutlined />}
                    onClick={() => openCourse(course)}
                  >
                    {tab === 'mine' ? '学习课程' : '购买课程'}
                  </Button>
                </div>
              </article>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty className="page-empty" description={tab === 'mine' ? '暂无已购课程' : '暂无课程'} />
      )}
      <PayModal
        course={selected}
        onClose={() => setSelected(null)}
        onSuccess={() => {
          setSelected(null)
          setTab('mine')
          load('mine')
        }}
      />
    </div>
  )
}

function PayModal({
  course,
  onClose,
  onSuccess,
}: {
  course: Course | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [paying, setPaying] = useState(false)
  const [expireAt, setExpireAt] = useState(0)
  const [, forceTick] = useState(0)

  useEffect(() => {
    setPaying(false)
    setExpireAt(0)
  }, [course?.id])

  useEffect(() => {
    if (!course) return
    const socket = getSocket()
    const success = () => {
      message.success('支付成功')
      onSuccess()
    }
    socket?.on('paymentSuccess', success)
    return () => {
      socket?.off('paymentSuccess', success)
    }
  }, [course, onSuccess])

  useEffect(() => {
    if (!expireAt) return
    const timer = window.setInterval(() => {
      forceTick((value) => value + 1)
      if (Date.now() >= expireAt) {
        setExpireAt(0)
        setPaying(false)
        message.error('支付超时，请重新支付')
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [expireAt])

  const remaining = Math.max(0, Math.ceil((expireAt - Date.now()) / 1000))
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  const confirm = async () => {
    if (!course) return
    const response = await payApi.create({
      subject: course.name,
      body: course.description || '',
      total_amount: course.price,
      courseId: course.id,
    })
    if (!response.success) {
      message.error(response.message)
      return
    }
    setPaying(true)
    setExpireAt(response.data.timeExpire)
    window.open(response.data.payUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Modal
      open={Boolean(course)}
      title="确认支付"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="confirm" type="primary" loading={paying} onClick={confirm}>
          {paying ? '等待支付' : '确认支付'}
        </Button>,
      ]}
    >
      {course && (
        <Space direction="vertical" size="large" className="pay-content">
          <div className="pay-course">
            <Image width={88} height={88} preview={false} src={`${uploadUrl}${course.url}`} />
            <div>
              <Typography.Title level={4}>{course.name}</Typography.Title>
              <Typography.Text type="secondary">讲师 {course.teacher}</Typography.Text>
            </div>
          </div>
          <Statistic title="支付金额" value={course.price} prefix="¥" />
          {expireAt > 0 && (
            <Tag icon={<ClockCircleOutlined />} color="warning">
              支付剩余时间 {minutes}:{seconds}
            </Tag>
          )}
        </Space>
      )}
    </Modal>
  )
}
