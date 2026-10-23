export type AuthMode = 'login' | 'register'
export type CourseTab = 'list' | 'mine'
export type RangeKey = 'today' | '7d' | '30d'

export interface ApiResponse<T = unknown> {
  timestamp: string
  path: string
  message: string
  code: number
  success: boolean
  data: T
}
