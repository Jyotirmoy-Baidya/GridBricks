import axios from 'axios'
import { create } from 'zustand'
import type { ApiError } from '@/api/axiosInstance'

export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface Resource<T> {
  data: T | null
  status: Status
  error: ApiError | null
}

export interface ResourceStore<P, T> extends Resource<T> {
  load: (params: P, force?: boolean) => Promise<void>
}

const controllers = new Map<string, AbortController>()
const cache = new Map<string, unknown>()

export async function loadInto<T>(
  slot: string,
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  set: (patch: Partial<Resource<T>>) => void,
  force = false,
): Promise<void> {
  controllers.get(slot)?.abort()
  const cacheKey = `${slot}|${key}`
  if (!force && cache.has(cacheKey)) {
    set({ data: cache.get(cacheKey) as T, status: 'success', error: null })
    return
  }
  const controller = new AbortController()
  controllers.set(slot, controller)
  set({ status: 'loading', error: null })
  try {
    const data = await fetcher(controller.signal)
    cache.set(cacheKey, data)
    set({ data, status: 'success' })
  } catch (err) {
    if (axios.isCancel(err)) return
    set({ status: 'error', error: err as ApiError })
  }
}

/** One store per endpoint: previous data stays visible while a new request is in flight. */
export function createResourceStore<P, T>(
  slot: string,
  fetcher: (params: P, signal: AbortSignal) => Promise<T>,
) {
  return create<ResourceStore<P, T>>()((set) => ({
    data: null,
    status: 'idle',
    error: null,
    load: (params, force = false) =>
      loadInto(slot, JSON.stringify(params), (signal) => fetcher(params, signal), set, force),
  }))
}

export function clearResourceCache() {
  cache.clear()
}
