import 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AuthSheet } from '../components/AuthSheet'
import { SearchSheet } from '../components/SearchSheet'
import { connectSocket, disconnectSocket } from '../services/native'
import { useAppStore } from '../store/app'
import { colors } from '../theme'

export default function RootLayout() {
  const userId = useAppStore((state) => state.user?.id)
  useEffect(() => {
    if (userId) connectSocket(userId)
    else disconnectSocket()
  }, [userId])

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="learn/[courseId]" options={{ title: '课程学习' }} />
      </Stack>
      <SearchSheet />
      <AuthSheet />
    </>
  )
}
