import * as ImagePicker from 'expo-image-picker'
import { LogOut, Save, Upload, UserRound } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { resolveUploadUrl, userApi } from '../api'
import { Button, Field } from '../components/ui'
import { confirmAction, notify, scheduleDailyReminder } from '../services/native'
import { useAppStore } from '../store/app'
import { colors, commonStyles } from '../theme'

export function SettingsScreen() {
  const user = useAppStore((state) => state.user)
  const updateUser = useAppStore((state) => state.updateUser)
  const logout = useAppStore((state) => state.logout)
  const [form, setForm] = useState({
    name: '', email: '', address: '', avatar: '', bio: '', isTimingTask: false, timingTaskTime: '20:00:00',
  })
  const [preview, setPreview] = useState<string>()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    if (!user) return
    setForm({
      name: user.name,
      email: user.email ?? '',
      address: user.address ?? '',
      avatar: user.avatar ?? '',
      bio: user.bio ?? '',
      isTimingTask: user.isTimingTask,
      timingTaskTime: user.timingTaskTime || '20:00:00',
    })
    setPreview(resolveUploadUrl(user.avatar))
  }
  useEffect(reset, [user?.id])

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 })
    if (result.canceled) return
    const asset = result.assets[0]
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) return notify('图片大小不能超过 2MB')
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? `avatar.${asset.mimeType?.split('/')[1] ?? 'jpg'}`,
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob)
      const response = await userApi.uploadAvatar(data)
      if (!response.success) return notify(response.message)
      setForm((current) => ({ ...current, avatar: response.data.databaseUrl }))
      setPreview(response.data.previewUrl)
      notify('头像上传成功，保存后生效')
    } catch {
      notify('头像上传失败')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.name.trim()) return notify('请输入用户名')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return notify('请输入正确的邮箱')
    if (form.isTimingTask && !/^\d{2}:\d{2}(:\d{2})?$/.test(form.timingTaskTime)) return notify('提醒时间格式应为 HH:mm')
    setSaving(true)
    try {
      const payload = { ...form, name: form.name.trim(), email: form.email.trim() || null, address: form.address.trim() || null, bio: form.bio.trim() || null }
      const response = await userApi.update(payload)
      if (!response.success) return notify(response.message)
      await scheduleDailyReminder(form.isTimingTask, form.timingTaskTime)
      updateUser(response.data)
      notify('个人信息已更新')
    } catch (error) {
      notify(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}><View><Text style={commonStyles.title}>设置</Text><Text style={commonStyles.subtitle}>修改个人资料、头像和每日学习提醒</Text></View></View>
      <View style={[commonStyles.card, styles.panel]}>
        <Text style={styles.panelTitle}>头像</Text>
        <View style={styles.avatarEditor}>
          <View style={styles.avatar}>
            {preview ? <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} /> : <UserRound color={colors.subtle} size={34} />}
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <Button compact title="选择头像" variant="secondary" icon={Upload} loading={uploading} onPress={pickAvatar} />
            <Text style={styles.hint}>支持 PNG、JPG、WebP，最大 2MB</Text>
          </View>
        </View>
      </View>
      <View style={[commonStyles.card, styles.panel]}>
        <Text style={styles.panelTitle}>个人信息</Text>
        <View style={styles.form}>
          <Field label="用户名" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
          <Field label="邮箱" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} keyboardType="email-address" />
          <Field label="地址" value={form.address} onChangeText={(address) => setForm((current) => ({ ...current, address }))} />
          <Field label="签名" value={form.bio} onChangeText={(bio) => setForm((current) => ({ ...current, bio }))} maxLength={120} multiline />
          <View style={styles.switchRow}><View><Text style={styles.fieldLabel}>每日学习提醒</Text><Text style={styles.hint}>在设备上按时发送通知</Text></View><Switch value={form.isTimingTask} onValueChange={(isTimingTask) => setForm((current) => ({ ...current, isTimingTask }))} trackColor={{ true: colors.primary }} /></View>
          <Field label="提醒时间" value={form.timingTaskTime} editable={form.isTimingTask} placeholder="20:00:00" onChangeText={(timingTaskTime) => setForm((current) => ({ ...current, timingTaskTime }))} />
          <View style={styles.actions}><View style={{ flex: 1 }}><Button title="重置" variant="secondary" onPress={reset} /></View><View style={{ flex: 1 }}><Button title="保存" icon={Save} loading={saving} onPress={save} /></View></View>
        </View>
      </View>
      <View style={[commonStyles.card, styles.danger]}>
        <Text style={styles.panelTitle}>账号操作</Text>
        <Button title="退出登录" variant="danger" icon={LogOut} onPress={async () => { if (await confirmAction('退出登录', '确定退出当前账户吗？')) logout() }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  heading: { marginBottom: 20 },
  panel: { marginBottom: 14, padding: 18 },
  danger: { padding: 18, borderColor: '#F4C7C3' },
  panelTitle: { marginBottom: 18, color: colors.ink, fontSize: 17, fontWeight: '700' },
  avatarEditor: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 82, height: 82, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 41, backgroundColor: '#EEF0F3' },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  form: { gap: 15 },
  switchRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 9 },
})
