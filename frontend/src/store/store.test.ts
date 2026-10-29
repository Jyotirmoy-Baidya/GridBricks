import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearResourceCache, createResourceStore } from './resource'
import { useFilterStore } from './useFilterStore'

const JAN = { min: '2025-12-30', max: '2026-01-31' }

describe('filter store', () => {
  beforeEach(() =>
    useFilterStore.setState({ start: '2026-01-01', end: '2026-01-31', horizon: 4, cutoff: '09:00', bounds: JAN, userSet: false }),
  )

  it('keeps the end after the start and clamps to the loaded data', () => {
    useFilterStore.getState().setRange('2026-01-20', '2026-01-10')
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-20', end: '2026-01-20', userSet: true })
    useFilterStore.getState().setRange('2025-12-01', '2026-03-01')
    expect(useFilterStore.getState()).toMatchObject({ start: '2025-12-30', end: '2026-01-31' })
  })

  it('opens on the latest month of whatever data is loaded', () => {
    useFilterStore.getState().setBounds({ min: '2025-12-30', max: '2026-10-28' })
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-09-28', end: '2026-10-28' })
  })

  it('keeps a range the user chose when the bounds change', () => {
    useFilterStore.getState().setRange('2026-01-05', '2026-01-10')
    useFilterStore.getState().setBounds({ min: '2025-12-30', max: '2026-10-28' })
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-05', end: '2026-01-10' })
  })

  it('caps a range at 45 days', () => {
    useFilterStore.getState().setBounds({ min: '2025-12-30', max: '2026-10-28' })
    useFilterStore.getState().setRange('2026-02-01', '2026-08-01')
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-02-01', end: '2026-03-17' })
  })

  it('hydrates from URL values and ignores junk', () => {
    useFilterStore.getState().hydrate({ start: '2026-01-05', end: 'nope', h: '24', cutoff: '11:00' })
    expect(useFilterStore.getState()).toMatchObject({ start: '2026-01-05', end: '2026-01-31', horizon: 24, cutoff: '11:00', userSet: true })
    useFilterStore.getState().hydrate({ h: '999', cutoff: '03:00' })
    expect(useFilterStore.getState()).toMatchObject({ horizon: 48, cutoff: '11:00' })
  })
})

describe('resource store', () => {
  beforeEach(() => clearResourceCache())

  it('loads, caches by params, and refetches when forced', async () => {
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
