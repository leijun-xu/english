import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { socketUrl, uploadUrl } from '@/api'
import { useAppStore } from '@/store/app'

let socket: Socket | null = null

export const avatarUrl = (avatar?: string | null) =>
  avatar ? `${uploadUrl}${avatar}` : undefined

export const connectSocket = (userId: string): Socket => {
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

export const getSocket = (): Socket | null => socket

export const useSocketLifecycle = () => {
  const userId = useAppStore((state) => state.user?.id)
  useEffect(() => {
    if (userId) connectSocket(userId)
    else disconnectSocket()
    return undefined
  }, [userId])
}

export const speakEnglish = (text: string) => {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.7
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export const useVoiceInput = (onResult: (text: string) => void) => {
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const start = () => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) throw new Error('当前浏览器不支持语音识别')
    if (!recognitionRef.current) {
      const recognition = new Recognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = false
      recognition.onend = () => setRecording(false)
      recognition.onresult = (event) => {
        let text = ''
        for (let index = 0; index < event.results.length; index += 1) {
          text += event.results[index][0].transcript
        }
        onResult(text)
      }
      recognitionRef.current = recognition
    }
    recognitionRef.current.start()
    setRecording(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return { recording, start, stop }
}
