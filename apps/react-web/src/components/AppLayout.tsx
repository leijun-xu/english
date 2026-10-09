import {
  BookOutlined,
  DownOutlined,
  FireFilled,
  HomeFilled,
  MessageOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Popconfirm, Popover, Tooltip, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { avatarUrl } from '@/hooks/services'
import { requireLogin, useAppStore } from '@/store/app'

const navItems = [
  { path: '/', label: '主页', icon: <HomeFilled />, auth: false },
  { path: '/chat', label: '聊天', icon: <MessageOutlined />, auth: true },
  { path: '/word-book', label: '词库', icon: <BookOutlined />, auth: false },
  { path: '/courses', label: '课程', icon: <ReadOutlined />, auth: false },
  { path: '/settings', label: '设置', icon: <SettingOutlined />, auth: true },
]

export function AppLayout() {
  const user = useAppStore((state) => state.user)
  const logout = useAppStore((state) => state.logout)
  const showAuth = useAppStore((state) => state.showAuth)
  const setSearchOpen = useAppStore((state) => state.setSearchOpen)
  const navigate = useNavigate()
  const location = useLocation()

  const go = (path: string, auth: boolean) => {
    if (auth && !requireLogin()) return
    navigate(path)
  }

  const profile = (
    <div className="profile-popover">
      <div className="profile-summary">
        <Avatar size={44} src={avatarUrl(user?.avatar)} icon={<UserOutlined />} />
        <div className="profile-copy">
          <Typography.Text strong>{user?.name ?? '游客'}</Typography.Text>
          <Typography.Text type="secondary">{user?.bio || '保持学习，持续进步'}</Typography.Text>
        </div>
      </div>
      {user && (
        <div className="profile-stats">
          <div><span>已学单词</span><strong>{user.wordNumber ?? 0}</strong></div>
          <div><span>打卡天数</span><strong>{user.dayNumber ?? 0}</strong></div>
        </div>
      )}
      <div className={`profile-actions${user ? ' signed-in' : ''}`}>
        {user ? (
          <>
            <Button block onClick={() => navigate('/settings')}>个人资料</Button>
            <Popconfirm title="确定退出登录吗？" onConfirm={() => { logout(); navigate('/') }}>
              <Button danger block>退出登录</Button>
            </Popconfirm>
          </>
        ) : (
          <Button type="primary" block onClick={() => showAuth()}>登录 / 注册</Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand brand-button" onClick={() => navigate('/')} aria-label="返回首页">
            <span className="brand-mark">E</span>
            <strong>English App</strong>
          </button>
          <nav className="desktop-nav" aria-label="主导航">
            {navItems.map((item) => (
              <Button
                key={item.path}
                type={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'primary' : 'text'}
                icon={item.icon}
                onClick={() => go(item.path, item.auth)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="topbar-actions">
            <Button
              className="topbar-icon-button"
              type="text"
              shape="circle"
              icon={<SearchOutlined />}
              aria-label="搜索单词"
              onClick={() => setSearchOpen(true)}
            />
            <div className="desktop-only">
              <Tooltip title="已学单词">
                <span className="learning-metric words">
                  <BookOutlined />
                  <strong>{user?.wordNumber ?? 0}</strong>
                </span>
              </Tooltip>
              <Tooltip title="打卡天数">
                <span className="learning-metric streak">
                  <FireFilled />
                  <strong>{user?.dayNumber ?? 0}</strong>
                </span>
              </Tooltip>
            </div>
            <Popover
              content={profile}
              trigger="click"
              placement="bottomRight"
              classNames={{ root: 'profile-popover-overlay' }}
            >
              <button className="profile-trigger" aria-label="打开账户菜单">
                <Avatar src={avatarUrl(user?.avatar)} icon={<UserOutlined />} />
                <span>{user?.name ?? '游客'}</span>
                <DownOutlined className="profile-chevron" />
              </button>
            </Popover>
          </div>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              className={active ? 'active' : ''}
              onClick={() => go(item.path, item.auth)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
