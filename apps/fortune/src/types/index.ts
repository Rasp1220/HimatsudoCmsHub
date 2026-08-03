export interface Admin {
  id: number
  name: string
  email: string
}

export interface Column {
  id: number
  slug: string
  title: string
  category: string
  excerpt: string
  body: string
  published_at: string
  is_published: number
  created_at: string
  updated_at: string
}

export interface ColumnFormData {
  slug: string
  title: string
  category: string
  excerpt: string
  body: string
  published_at: string
  is_published: boolean
}

export interface Announcement {
  id: number
  published_on: string
  tag: string
  title: string
  body: string
  is_published: number
  created_at: string
  updated_at: string
}

export interface AnnouncementFormData {
  published_on: string
  tag: string
  title: string
  body: string
  is_published: boolean
}

export interface AdminFormData {
  name: string
  email: string
  password?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  admin: Admin
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
}

export interface ApiError {
  error: {
    message: string
    status: number
  }
}
