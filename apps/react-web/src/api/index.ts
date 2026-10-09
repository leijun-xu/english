import type { ChatDto, ChatMessage, ChatMessageList, ChatModeList, ChatRoleType } from '@en/common/chat'
import type { CourseList } from '@en/common/course'
import type { ResultLearn } from '@en/common/learn'
import type { CreatePayDto, ResultPay } from '@en/common/pay'
import type {
  AvatarResult,
  Token,
  UserLogin,
  UserRegister,
  UserUpdate,
  WebResultUser,
} from '@en/common/user'
import type { Word, WordList, WordQuery } from '@en/common/word'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAppStore } from '@/store/app'

export interface ApiResponse<T = unknown> {
  timestamp: string
  path: string
  message: string
  code: number
  success: boolean
  data: T
}

export const uploadUrl = import.meta.env.VITE_MINIO_ENDPOINT ?? ''
export const socketUrl = import.meta.env.VITE_SOCKET_URL ?? ''

export const serverApi = axios.create({ baseURL: '/api/v1', timeout: 50_000 })
export const aiApi = axios.create({ baseURL: '/ai/v1', timeout: 50_000 })
const refreshApi = axios.create({ baseURL: '/api/v1', timeout: 50_000 })

serverApi.interceptors.request.use((config) => {
  const token = useAppStore.getState().user?.token.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

serverApi.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    if (!error.response) {
      message.error('网络连接失败，请重试')
      return Promise.reject(error)
    }
    if (error.response.status !== 401) {
      message.error('服务器异常，请稍后再试')
      return Promise.reject(error)
    }

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
      const response = await refreshApi.post<unknown, { data: ApiResponse<Token> }>(
        '/user/refresh-token',
        { refreshToken },
      )
      const result = response.data
      if (!result.success) throw error
      useAppStore.getState().updateToken(result.data)
      request.headers.Authorization = `Bearer ${result.data.accessToken}`
      return serverApi(request)
    } catch (refreshError) {
      useAppStore.getState().logout()
      useAppStore.getState().showAuth()
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
    serverApi.post('/user/upload-avatar', data) as Promise<ApiResponse<AvatarResult>>,
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
    const controller = new AbortController()
    fetchEventSource('/ai/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      openWhenHidden: true,
      onmessage: (event) => onMessage(JSON.parse(event.data) as ChatMessage),
      onclose: () => onClose?.(),
      onerror: (error) => {
        onError?.(error)
        throw error
      },
    })
    return controller
  },
}
