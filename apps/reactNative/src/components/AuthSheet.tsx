import type { UserLogin, UserRegister } from '@en/common/user'
import md5 from 'md5'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { userApi } from '../api'
import { notify } from '../services/native'
import { useAppStore } from '../store/app'
import { colors } from '../theme'
import { Button, Field, Segments, Sheet } from './ui'

export function AuthSheet() {
  const open = useAppStore((state) => state.authOpen)
  const mode = useAppStore((state) => state.authMode)
  const hide = useAppStore((state) => state.hideAuth)
  const setMode = useAppStore((state) => state.setAuthMode)
  const setUser = useAppStore((state) => state.setUser)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (mode === 'register' && (name.trim().length < 2 || name.trim().length > 10)) {
      notify('用户名长度为 2-10 位')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      notify('请输入正确的手机号')
      return
    }
    if (mode === 'register' && (password.length < 6 || password.length > 16)) {
      notify('密码长度为 6-16 位')
      return
    }
    if (!password) {
      notify('请输入密码')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('请输入正确的邮箱')
      return
    }
    setLoading(true)
    try {
      const base = { phone, password: md5(password) }
      const response = mode === 'login'
        ? await userApi.login(base as UserLogin)
        : await userApi.register({ ...base, name: name.trim(), email: email.trim() || null } as UserRegister)
      if (!response.success) {
        notify(response.message)
        return
      }
      setUser(response.data)
      setName('')
      setPhone('')
      setEmail('')
      setPassword('')
      notify(mode === 'login' ? '登录成功' : '注册成功')
    } catch {
      notify('网络连接失败，请检查服务地址')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} title={mode === 'login' ? '欢迎回来' : '创建账户'} onClose={hide}>
      <Segments
        value={mode}
        options={[
          { value: 'login', label: '登录' },
          { value: 'register', label: '注册' },
        ]}
        onChange={setMode}
      />
      <Text style={styles.description}>
        {mode === 'login' ? '登录后继续你的学习进度' : '填写信息，开始学习英语'}
      </Text>
      <View style={styles.form}>
        {mode === 'register' && <Field value={name} onChangeText={setName} placeholder="用户名" />}
        <Field
          value={phone}
          onChangeText={setPhone}
          placeholder="手机号"
          keyboardType="phone-pad"
          maxLength={11}
        />
        {mode === 'register' && (
          <Field value={email} onChangeText={setEmail} placeholder="邮箱（可选）" keyboardType="email-address" />
        )}
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          secureTextEntry
        />
        <Button title={mode === 'login' ? '登录' : '注册'} loading={loading} onPress={submit} />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  description: { marginTop: 18, color: colors.muted, lineHeight: 21 },
  form: { marginTop: 20, gap: 14 },
})
