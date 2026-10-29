import { api } from '../axiosInstance'

export interface Health {
  status: string
  redis: boolean
}

export const getHealth = async (signal?: AbortSignal): Promise<Health> =>
  (await api.get<Health>('/health', { signal })).data
