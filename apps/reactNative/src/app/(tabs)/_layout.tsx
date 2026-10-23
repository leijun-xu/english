import { Tabs } from 'expo-router'
import { BarChart3, BookOpen, GraduationCap, Home, MessageCircle, Search, Settings } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useAppStore } from '../../store/app'
import { colors } from '../../theme'

const icons = { index: Home, analytics: BarChart3, chat: MessageCircle, 'word-book': BookOpen, courses: GraduationCap, settings: Settings }
const titles = { index: '主页', analytics: '看板', chat: '聊天', 'word-book': '词库', courses: '课程', settings: '设置' }

export default function TabsLayout() {
  const setSearchOpen = useAppStore((state) => state.setSearchOpen)
  return (
    <Tabs screenOptions={({ route }) => {
      const name = route.name as keyof typeof icons
      const Icon = icons[name]
      return {
        title: titles[name],
        headerTitle: name === 'index' ? 'English App' : titles[name],
        headerShadowVisible: false,
        headerRight: () => <Pressable onPress={() => setSearchOpen(true)} hitSlop={12} style={{ marginRight: 16 }}><Search size={21} color={colors.text} /></Pressable>,
        tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: { height: 66, paddingTop: 5, paddingBottom: 7 },
      }
    }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="word-book" />
      <Tabs.Screen name="courses" />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}
