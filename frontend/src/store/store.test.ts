import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearResourceCache, createResourceStore } from './resource'
import { useFilterStore } from './useFilterStore'

describe('filter store', () => {
  beforeEach(() => useFilterStore.setState({ start: '2026-01-01', end: '2026-01-31', horizon: 4, cutoff: '09:00' }))

  it('keeps the end after the start and clamps to the data window', () => {
    useFilterStore.getState().setRange('2026-01-20', '2026-01-10')
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-20', end: '2026-01-20' })
    useFilterStore.getState().setRange('2025-12-01', '2026-03-01')
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-01', end: '2026-01-31' })
  })

  it('hydrates from URL values and ignores junk', () => {
    useFilterStore.getState().hydrate({ start: '2026-01-05', end: 'nope', h: '24', cutoff: '11:00' })
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-05', end: '2026-01-31', horizon: 24, cutoff: '11:00' })
    useFilterStore.getState().hydrate({ h: '999', cutoff: '03:00' })
    expect(useFilterStore.getState()).toMatchObject({ horizon: 48, cutoff: '11:00' })
  })
})

describe('resource store', () => {
  beforeEach(() => clearResourceCache())

  it('loads, caches by params, and aborts the previous request', async () => {
    const fetcher = vi.fn(async (p: number) => p * 2)
    const useStore = createResourceStore('t-cache', fetcher)
    await useStore.getState().load(2)
    expect(useStore.getState()).toMatchObject({ data: 4, status: 'success' })
    await useStore.getState().load(2)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await useStore.getState().load(2, true)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('reports errors and keeps earlier data', async () => {
    const useStore = createResourceStore('t-err', async (p: number) => {
      if (p === 0) throw { status: 500, message: 'boom' }
      return p
    })
    await useStore.getState().load(1)
    await useStore.getState().load(0)
    expect(useStore.getState()).toMatchObject({ status: 'error', data: 1, error: { message: 'boom' } })
  })
})
