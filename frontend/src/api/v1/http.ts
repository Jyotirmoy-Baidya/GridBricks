import { api } from '../axiosInstance'

export const get = async <T>(
  url: string,
  params: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<T> => (await api.get<T>(url, { params, signal })).data
