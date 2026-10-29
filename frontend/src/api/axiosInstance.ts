import axios, { AxiosError } from 'axios'

export interface ApiError {
  status: number | null
  message: string
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  config.headers.set('X-Request-Id', crypto.randomUUID())
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail?: string }>) => {
    if (axios.isCancel(err)) return Promise.reject(err)
    const apiError: ApiError = {
      status: err.response?.status ?? null,
      message: err.response?.data?.detail ?? err.message,
    }
    return Promise.reject(apiError)
  },
)
