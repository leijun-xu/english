import { Tracker } from '@en/tracker'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { useSocketLifecycle } from '@/hooks/services'
import { useAppStore } from '@/store/app'

const AuthModal = lazy(() => import('@/components/AuthModal').then((module) => ({ default: module.AuthModal })))
const SearchModal = lazy(() => import('@/components/SearchModal').then((module) => ({ default: module.SearchModal })))
const ChatPage = lazy(() => import('@/pages/Chat').then((module) => ({ default: module.ChatPage })))
const CoursesPage = lazy(() => import('@/pages/Courses').then((module) => ({ default: module.CoursesPage })))
const HomePage = lazy(() => import('@/pages/Home').then((module) => ({ default: module.HomePage })))
const LearnPage = lazy(() => import('@/pages/Learn').then((module) => ({ default: module.LearnPage })))
const SettingsPage = lazy(() => import('@/pages/Settings').then((module) => ({ default: module.SettingsPage })))
const WordBookPage = lazy(() => import('@/pages/WordBook').then((module) => ({ default: module.WordBookPage })))

const tracker = new Tracker({
  baseUrl: '/api/v1',
  uv: { api: '/tracker/uv', updateApi: '/tracker/update-uv' },
  pv: { api: '/tracker/pv' },
  event: { api: '/tracker/event' },
  error: { api: '/tracker/error' },
  performance: { api: '/tracker/performance' },
})

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppStore((state) => state.user)
  const showAuth = useAppStore((state) => state.showAuth)
  useEffect(() => {
    if (!user) showAuth()
  }, [showAuth, user])
  return user ? children : <Navigate to="/" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'word-book', element: <WordBookPage /> },
      { path: 'courses', element: <CoursesPage /> },
      {
        path: 'courses/:courseId/learn/:title',
        element: <RequireAuth><LearnPage /></RequireAuth>,
      },
      {
        path: 'chat',
        element: <RequireAuth><ChatPage /></RequireAuth>,
      },
      {
        path: 'settings',
        element: <RequireAuth><SettingsPage /></RequireAuth>,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

function RuntimeServices() {
  const userId = useAppStore((state) => state.user?.id)
  useSocketLifecycle()
  useEffect(() => {
    if (userId) void tracker.setUserId(userId).catch(() => undefined)
  }, [userId])
  return null
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3157d5',
          borderRadius: 6,
          fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <RuntimeServices />
      <Suspense fallback={<div className="route-loading">页面加载中...</div>}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <SearchModal />
        <AuthModal />
      </Suspense>
    </ConfigProvider>
  )
}
