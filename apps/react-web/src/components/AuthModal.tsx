import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons'
import type { UserLogin, UserRegister } from '@en/common/user'
import { Button, Form, Input, Modal, Segmented, Typography, message } from 'antd'
import md5 from 'md5'
import { userApi } from '@/api'
import { useAppStore } from '@/store/app'
import { ModelCanvas } from './ModelCanvas'

export function AuthModal() {
  const authOpen = useAppStore((state) => state.authOpen)
  const authMode = useAppStore((state) => state.authMode)
  const hideAuth = useAppStore((state) => state.hideAuth)
  const setAuthMode = useAppStore((state) => state.setAuthMode)
  const setUser = useAppStore((state) => state.setUser)
  const [form] = Form.useForm()

  const submit = async (values: UserLogin | UserRegister) => {
    const payload = { ...values, password: md5(values.password) }
    const response =
      authMode === 'login'
        ? await userApi.login(payload as UserLogin)
        : await userApi.register(payload as UserRegister)
    if (!response.success) {
      message.error(response.message)
      return
    }
    setUser(response.data)
    form.resetFields()
    message.success(authMode === 'login' ? '登录成功' : '注册成功')
  }

  return (
    <Modal
      open={authOpen}
      onCancel={hideAuth}
      footer={null}
      width={980}
      centered
      destroyOnHidden
      className="auth-modal"
    >
      <div className="auth-shell">
        <section className="auth-visual">
          <div className="brand brand-inverse">
            <span className="brand-mark">E</span>
            <strong>English App</strong>
          </div>
          <ModelCanvas model={authMode} className="auth-canvas" />
        </section>
        <section className="auth-form-panel">
          <Segmented
            block
            value={authMode}
            options={[
              { label: '登录', value: 'login' },
              { label: '注册', value: 'register' },
            ]}
            onChange={(value) => {
              setAuthMode(value as 'login' | 'register')
              form.resetFields()
            }}
          />
          <div className="auth-heading">
            <Typography.Title level={2}>
              {authMode === 'login' ? '欢迎回来' : '创建账户'}
            </Typography.Title>
            <Typography.Text type="secondary">
              {authMode === 'login' ? '登录后继续你的学习进度' : '填写信息，开始学习英语'}
            </Typography.Text>
          </div>
          <Form form={form} layout="vertical" size="large" onFinish={submit}>
            {authMode === 'register' && (
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, max: 10, message: '用户名长度为 2-10 位' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
            )}
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input prefix={<MobileOutlined />} maxLength={11} placeholder="手机号" />
            </Form.Item>
            {authMode === 'register' && (
              <Form.Item name="email" rules={[{ type: 'email', message: '请输入正确的邮箱' }]}>
                <Input prefix={<UserOutlined />} placeholder="邮箱（可选）" />
              </Form.Item>
            )}
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                ...(authMode === 'register'
                  ? [{ min: 6, max: 16, message: '密码长度为 6-16 位' }]
                  : []),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              {authMode === 'login' ? '登录' : '注册'}
            </Button>
          </Form>
        </section>
      </div>
    </Modal>
  )
}
