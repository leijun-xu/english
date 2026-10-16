import { AudioOutlined, MessageOutlined, PictureOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Col, Row, Statistic, Typography } from 'antd'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModelCanvas } from '@/components/ModelCanvas'
import { requireLogin } from '@/store/app'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { title: '累计学员', target: 1_000_000, suffix: '+' },
  { title: '精品课程', target: 500, suffix: '+' },
  { title: '学员满意度', target: 98, suffix: '%' },
  { title: '学习时长', target: 5_000_000, suffix: '小时' },
]

const advantages = [
  {
    icon: <PictureOutlined />,
    title: 'AI 情境学习',
    description: '沉浸式场景模拟，在真实语境中自然习得英语。',
  },
  {
    icon: <MessageOutlined />,
    title: '智能对话练习',
    description: 'AI 实时反馈，多种对话模式，随时练习表达。',
  },
  {
    icon: <AudioOutlined />,
    title: '词汇拼写训练',
    description: '结合发音、释义和逐字母校验，稳步积累词汇。',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const [statValues, setStatValues] = useState(() => stats.map(() => 0))

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStatValues(stats.map((item) => item.target))
      return
    }

    const context = gsap.context(() => {
      const counter = { progress: 0 }
      gsap.to(counter, {
        progress: 1,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          setStatValues(stats.map((item) => Math.round(item.target * counter.progress)))
        },
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      const headingItems = gsap.utils.toArray<HTMLElement>('.section-heading > *')
      gsap.fromTo(
        headingItems,
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: '.section-heading',
            start: 'top 80%',
            once: true,
          },
        },
      )

      const cards = gsap.utils.toArray<HTMLElement>('.feature-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: '.feature-grid',
            start: 'top 78%',
            once: true,
          },
        },
      )
    }, pageRef)

    return () => context.revert()
  }, [])

  return (
    <div ref={pageRef}>
      <section className="home-hero">
        <div className="page-container hero-inner">
          <div className="hero-copy">
            <Typography.Text className="hero-badge">坚持学习，让进步可见</Typography.Text>
            <Typography.Title level={1}>通过 AI 对话与词汇训练，提高你的英语能力</Typography.Title>
            <Typography.Paragraph>
              从查词、选课到拼写练习和 AI 陪练，在一个学习空间完成每天的英语训练。
            </Typography.Paragraph>
            <div className="hero-actions">
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  if (requireLogin()) navigate('/chat')
                }}
              >
                立即学习
              </Button>
              <Button size="large" icon={<RightOutlined />} onClick={() => navigate('/courses')}>
                查看课程
              </Button>
            </div>
          </div>
          <div className="hero-model">
            <ModelCanvas model="hologram" className="hero-canvas" />
          </div>
        </div>
      </section>

      <section className="stats-band" ref={statsRef}>
        <div className="page-container">
          <Row gutter={[24, 24]}>
            {stats.map((item, index) => (
              <Col xs={12} lg={6} key={item.title}>
                <Statistic
                  title={item.title}
                  value={statValues[index]}
                  precision={0}
                  suffix={item.suffix}
                />
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="section page-container">
        <header className="section-heading">
          <Typography.Text type="secondary">核心能力</Typography.Text>
          <Typography.Title level={2}>重新组织英语学习方式</Typography.Title>
        </header>
        <Row className="feature-grid" gutter={[20, 20]}>
          {advantages.map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <article className="feature-card">
                <div className="feature-icon">{item.icon}</div>
                <Typography.Title level={4}>{item.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{item.description}</Typography.Paragraph>
              </article>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  )
}
