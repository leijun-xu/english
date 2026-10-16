import { LogoutOutlined, SaveOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons'
import type { UserUpdate } from '@en/common/user'
import { Avatar, Button, Col, Form, Input, Popconfirm, Row, Switch, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '@/api'
import { avatarUrl } from '@/hooks/services'
import { useAppStore } from '@/store/app'

export function SettingsPage() {
  const user = useAppStore((state) => state.user)
  const updateUser = useAppStore((state) => state.updateUser)
  const logout = useAppStore((state) => state.logout)
  const [preview, setPreview] = useState(avatarUrl(user?.avatar))
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm<UserUpdate>()
  const navigate = useNavigate()

  const reset = () => {
    if (!user) return
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      address: user.address,
      avatar: user.avatar,
      bio: user.bio,
      isTimingTask: user.isTimingTask,
      timingTaskTime: user.timingTaskTime,
    })
    setPreview(avatarUrl(user.avatar))
  }

  useEffect(reset, [user?.id])

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return Upload.LIST_IGNORE
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过 2MB')
      return Upload.LIST_IGNORE
    }
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', file)
      const response = await userApi.uploadAvatar(data)
      if (response.success) {
        form.setFieldValue('avatar', response.data.databaseUrl)
        setPreview(response.data.previewUrl)
        message.success('头像上传成功，保存后生效')
      } else {
        message.error(response.message)
      }
    } finally {
      setUploading(false)
    }
    return false
  }

  const save = async (values: UserUpdate) => {
    const response = await userApi.update(values)
    if (!response.success) {
      message.error(response.message)
      return
    }
    updateUser(response.data)
    message.success('个人信息已更新')
  }

  return (
    <div className="page-container section settings-page">
      <div className="settings-heading">
        <div>
          <h1>设置</h1>
          <p>修改个人资料、头像和每日学习提醒</p>
        </div>
        <div>
          <Button onClick={reset}>重置</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>保存</Button>
        </div>
      </div>
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <section className="settings-panel">
            <h2>头像</h2>
            <div className="avatar-editor">
              <Avatar size={88} src={preview} icon={<UserOutlined />} />
              <div>
                <Upload showUploadList={false} accept="image/png,image/jpeg,image/webp" beforeUpload={beforeUpload}>
                  <Button loading={uploading} icon={<UploadOutlined />}>选择头像</Button>
                </Upload>
                <p>支持 PNG、JPG、WebP，最大 2MB</p>
              </div>
            </div>
          </section>
          <section className="settings-panel danger-panel">
            <h2>账号操作</h2>
            <Popconfirm
              title="确定退出登录吗？"
              onConfirm={() => {
                logout()
                navigate('/')
              }}
            >
              <Button danger icon={<LogoutOutlined />}>退出登录</Button>
            </Popconfirm>
          </section>
        </Col>
        <Col xs={24} lg={16}>
          <section className="settings-panel">
            <h2>个人信息</h2>
            <Form form={form} layout="vertical" onFinish={save}>
              <Form.Item name="avatar" hidden><Input /></Form.Item>
              <Form.Item name="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱' }]}>
                <Input placeholder="用于接收每日学习报告" />
              </Form.Item>
              <Form.Item name="address" label="地址"><Input placeholder="请输入地址" /></Form.Item>
              <Form.Item name="bio" label="签名">
                <Input.TextArea maxLength={120} showCount rows={4} placeholder="介绍一下自己" />
              </Form.Item>
              <Form.Item name="isTimingTask" label="每日学习提醒" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item noStyle dependencies={['isTimingTask']}>
                {({ getFieldValue }) => (
                  <Form.Item
                    name="timingTaskTime"
                    label="提醒时间"
                    rules={[
                      {
                        required: Boolean(getFieldValue('isTimingTask')),
                        message: '开启提醒后请选择提醒时间',
                      },
                    ]}
                  >
                    <Input type="time" step="1" disabled={!getFieldValue('isTimingTask')} />
                  </Form.Item>
                )}
              </Form.Item>
            </Form>
          </section>
        </Col>
      </Row>
    </div>
  )
}
