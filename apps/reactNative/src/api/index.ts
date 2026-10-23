import type { ChatDto, ChatMessage, ChatMessageList, ChatModeList, ChatRoleType } from '@en/common/chat'
import type { CourseList } from '@en/common/course'
import type { ResultLearn } from '@en/common/learn'
import type { CreatePayDto, ResultPay } from '@en/common/pay'
import type { TrackerAnalytics, TrackerAnalyticsQuery } from '@en/common/tracker'
import type {
  AvatarResult,
  Token,
  UserLogin,
  UserRegister,
  UserUpdate,
  WebResultUser,
} from '@en/common/user'
import type { Word, WordList, WordQuery } from '@en/common/word'
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import { useAppStore } from '../store/app'
import type { ApiResponse } from '../types'

const simulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
export const serverOrigin =
  process.env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, '') ?? `http://${simulatorHost}:3000`
export const aiOrigin =
  process.env.EXPO_PUBLIC_AI_URL?.replace(/\/$/, '') ?? `http://${simulatorHost}:3001`
export const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ?? `http://${simulatorHost}:3002`
export const uploadUrl =
  process.env.EXPO_PUBLIC_UPLOAD_URL?.replace(/\/$/, '') ?? `http://${simulatorHost}:9000/avatar`

export const resolveUploadUrl = (path?: string | null) => {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${uploadUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const serverApi = axios.create({ baseURL: `${serverOrigin}/api/v1`, timeout: 50_000 })
const aiApi = axios.create({ baseURL: `${aiOrigin}/ai/v1`, timeout: 50_000 })
const refreshApi = axios.create({ baseURL: `${serverOrigin}/api/v1`, timeout: 50_000 })

serverApi.interceptors.request.use((config) => {
  const token = useAppStore.getState().user?.token.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

serverApi.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    if (error.response?.status !== 401) return Promise.reject(error)
    const request = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const store = useAppStore.getState()
    const refreshToken = store.user?.token.refreshToken
    if (!refreshToken || request._retried) {
      store.logout()
      store.showAuth()
      return Promise.reject(error)
    }
    request._retried = true
    try {
      const response = await refreshApi.post<ApiResponse<Token>>('/user/refresh-token', {
        refreshToken,
      })
      if (!response.data.success) throw error
      store.updateToken(response.data.data)
      request.headers.Authorization = `Bearer ${response.data.data.accessToken}`
      return serverApi(request)
    } catch (refreshError) {
      store.logout()
      store.showAuth()
      return Promise.reject(refreshError)
    }
  },
)

aiApi.interceptors.response.use((response) => response.data)

export const userApi = {
  login: (data: UserLogin) =>
    serverApi.post('/user/login', data) as Promise<ApiResponse<WebResultUser>>,
  register: (data: UserRegister) =>
    serverApi.post('/user/register', data) as Promise<ApiResponse<WebResultUser>>,
  uploadAvatar: (data: FormData) =>
    serverApi.post('/user/upload-avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<AvatarResult>>,
  update: (data: UserUpdate) =>
    serverApi.post('/user/update-user', data) as Promise<ApiResponse<UserUpdate>>,
}

export const wordApi = {
  list: (params: WordQuery) =>
    serverApi.get('/word-book', { params }) as Promise<ApiResponse<WordList>>,
}

export const courseApi = {
  list: () => serverApi.get('/course/list') as Promise<ApiResponse<CourseList>>,
  mine: () => serverApi.get('/course/my') as Promise<ApiResponse<CourseList>>,
  words: (courseId: string) =>
    serverApi.get(`/learn/word/${courseId}`) as Promise<ApiResponse<Word[]>>,
  saveWords: (wordIds: string[]) =>
    serverApi.post('/learn/word/master', { wordIds }) as Promise<ApiResponse<ResultLearn>>,
}

export const payApi = {
  create: (data: CreatePayDto) =>
    serverApi.post('/pay/create', data) as Promise<ApiResponse<ResultPay>>,
}

export const trackerApi = {
  analytics: (params: TrackerAnalyticsQuery) =>
    serverApi.get('/tracker/analytics', { params }) as Promise<ApiResponse<TrackerAnalytics>>,
}

export const chatApi = {
  modes: () => aiApi.get('/prompt/list') as Promise<ApiResponse<ChatModeList>>,
  history: (userId: string, role: ChatRoleType) =>
    aiApi.get('/chat/history', { params: { userId, role } }) as Promise<ApiResponse<ChatMessageList>>,
  stream: (
    body: ChatDto,
    onMessage: (data: ChatMessage) => void,
    onError?: (error: Error) => void,
    onClose?: () => void,
  ) => {
    const request = new XMLHttpRequest()
    let cursor = 0
    let pending = ''

    const consume = (final = false) => {
      const next = request.responseText.slice(cursor)
      cursor = request.responseText.length
      pending += next
      const events = pending.split(/\r?\n\r?\n/)
      pending = final ? '' : (events.pop() ?? '')
      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n')
        if (data) onMessage(JSON.parse(data) as ChatMessage)
      }
    }

    request.open('POST', `${aiOrigin}/ai/v1/chat`)
    request.setRequestHeader('Content-Type', 'application/json')
    request.onprogress = () => consume()
    request.onload = () => {
      try {
        consume(true)
        if (request.status >= 400) throw new Error(`AI 服务响应异常: ${request.status}`)
        onClose?.()
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('流式响应解析失败'))
      }
    }
    request.onerror = () => onError?.(new Error('AI 服务连接失败'))
    request.onabort = () => onClose?.()
    request.send(JSON.stringify(body))
    return { abort: () => request.abort() }
  },
}
