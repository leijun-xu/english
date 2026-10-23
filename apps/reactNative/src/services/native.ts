import * as Notifications from 'expo-notifications'
import * as Speech from 'expo-speech'
import { Alert, Platform, ToastAndroid } from 'react-native'
import { io, type Socket } from 'socket.io-client'
import { socketUrl } from '../api'

let socket: Socket | null = null

export const notify = (message: string, title?: string) => {
  if (Platform.OS === 'android' && !title) {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title ?? '提示', message)
}

export const confirmAction = (title: string, message: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel', onPress: () => resolve(false) },
      { text: '确定', style: 'destructive', onPress: () => resolve(true) },
    ])
  })

export const speakEnglish = (text: string) => {
  Speech.stop()
  Speech.speak(text, { language: 'en-US', rate: 0.7 })
}

export const connectSocket = (userId: string) => {
  if (socket) return socket
  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    query: { userId },
  })
  return socket
}

export const disconnectSocket = () => {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket

export const scheduleDailyReminder = async (enabled: boolean, value: string) => {
  await Notifications.cancelAllScheduledNotificationsAsync()
  if (!enabled) return
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('提醒时间格式无效')
  }
  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) throw new Error('请先允许通知权限')
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('learning-reminder', {
      name: '学习提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '今日英语学习',
      body: '完成今天的词汇与对话训练，让进步保持连续。',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'learning-reminder',
    },
  })
}
