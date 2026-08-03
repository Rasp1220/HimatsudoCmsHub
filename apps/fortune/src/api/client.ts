import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from 'axios'
import type {
  Admin,
  AdminFormData,
  Announcement,
  AnnouncementFormData,
  Column,
  ColumnFormData,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/admin'

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE_URL })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken && error.config && !error.config.url?.includes('/auth/refresh')) {
          try {
            const { data } = await axios.post<{ data: RefreshResponse }>(`${BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            })
            localStorage.setItem('access_token', data.data.access_token)
            localStorage.setItem('refresh_token', data.data.refresh_token)
            error.config.headers.Authorization = `Bearer ${data.data.access_token}`
            return client.request(error.config)
          } catch {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
          }
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    },
  )

  return client
}

const http = createClient()

// レスポンスは常に { data: T } の形で返る（App\Controller\Controller::ok() 参照）
function unwrap<T>(promise: Promise<AxiosResponse<{ data: T }>>): Promise<T> {
  return promise.then((r) => r.data.data)
}

// Auth
export const authApi = {
  login: (payload: LoginPayload) => unwrap<LoginResponse>(http.post('/auth/login', payload)),

  logout: (refreshToken?: string) => http.post('/auth/logout', { refresh_token: refreshToken }),

  refresh: (refreshToken: string) =>
    unwrap<RefreshResponse>(http.post('/auth/refresh', { refresh_token: refreshToken })),

  me: () => unwrap<Admin>(http.get('/auth/me')),
}

// Columns
export const columnsApi = {
  list: () => unwrap<Column[]>(http.get('/columns')),

  get: (id: number) => unwrap<Column>(http.get(`/columns/${id}`)),

  create: (data: ColumnFormData) => unwrap<Column>(http.post('/columns', data)),

  update: (id: number, data: ColumnFormData) => unwrap<Column>(http.post(`/columns/${id}`, data)),

  delete: (id: number) => http.post(`/columns/${id}/delete`),
}

// Announcements
export const announcementsApi = {
  list: () => unwrap<Announcement[]>(http.get('/announcements')),

  get: (id: number) => unwrap<Announcement>(http.get(`/announcements/${id}`)),

  create: (data: AnnouncementFormData) => unwrap<Announcement>(http.post('/announcements', data)),

  update: (id: number, data: AnnouncementFormData) =>
    unwrap<Announcement>(http.post(`/announcements/${id}`, data)),

  delete: (id: number) => http.post(`/announcements/${id}/delete`),
}

// Admins
export const adminsApi = {
  list: () => unwrap<Admin[]>(http.get('/admins')),

  get: (id: number) => unwrap<Admin>(http.get(`/admins/${id}`)),

  create: (data: AdminFormData) => unwrap<Admin>(http.post('/admins', data)),

  update: (id: number, data: AdminFormData) => unwrap<Admin>(http.post(`/admins/${id}`, data)),

  delete: (id: number) => http.post(`/admins/${id}/delete`),
}
