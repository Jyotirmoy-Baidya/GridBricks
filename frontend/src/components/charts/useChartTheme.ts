import { useUiStore } from '@/store/useUiStore'

export interface ChartTheme {
  grid: string
  axis: string
  tick: string
  ink: string // the count-on line
  refText: string
  tooltip: { borderRadius: number; border: string; fontSize: number; backgroundColor: string; color: string }
}

const LIGHT: ChartTheme = {
  grid: '#e3e9ec',
  axis: '#c4cfd4',
  tick: '#5a6b74',
  ink: '#12202a',
  refText: '#9a5b00',
  tooltip: { borderRadius: 6, border: '1px solid #d9e1e5', fontSize: 12.5, backgroundColor: '#ffffff', color: '#16232b' },
}

const DARK: ChartTheme = {
  grid: '#26363f',
  axis: '#3a4e5a',
  tick: '#93a6ae',
  ink: '#e3ecef',
  refText: '#f0b152',
  tooltip: { borderRadius: 6, border: '1px solid #2a3c47', fontSize: 12.5, backgroundColor: '#152129', color: '#e6eef1' },
}

/** Chart colours that cannot come from CSS variables (Recharts writes SVG attributes). */
export const useChartTheme = (): ChartTheme => (useUiStore((s) => s.theme) === 'dark' ? DARK : LIGHT)

export const tickStyle = (t: ChartTheme) => ({ fontSize: 11, fill: t.tick, fontFamily: 'JetBrains Mono, monospace' })
export const MARGIN = { top: 8, right: 16, bottom: 4, left: 4 } as const
