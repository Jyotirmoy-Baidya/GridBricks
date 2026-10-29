import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { RouteHandle } from '@/components/layout/Topbar'
import AccuracyLayout from '@/layouts/AccuracyLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import RootLayout from '@/layouts/RootLayout'
import NotFoundPage from '@/pages/NotFoundPage'
import LazyRoute, { type PageLoader } from './LazyRoute'

const page = (loader: PageLoader) => <LazyRoute loader={loader} />

const h = (title: string, crumbs: string[], filters: RouteHandle['filters']): RouteHandle => ({ title, crumbs, filters })

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: page(() => import('@/pages/overview/OverviewPage')), handle: h('Wind forecast overview', ['Overview'], ['range', 'horizon']) },
          { path: 'forecasts', element: page(() => import('@/pages/forecasts/ForecastsPage')), handle: h('Actual vs forecast', ['Forecasts'], ['range', 'horizon']) },
          {
            path: 'accuracy',
            element: <AccuracyLayout />,
            handle: h('Forecast accuracy', ['Accuracy'], ['range', 'horizon']),
            children: [
              { index: true, element: page(() => import('@/pages/accuracy/SummaryPage')) },
              { path: 'horizon', element: page(() => import('@/pages/accuracy/HorizonPage')), handle: h('Forecast accuracy', ['Accuracy', 'By horizon'], ['range']) },
              { path: 'time-of-day', element: page(() => import('@/pages/accuracy/TimeOfDayPage')), handle: h('Forecast accuracy', ['Accuracy', 'Time of day'], ['range', 'horizon']) },
              { path: 'distribution', element: page(() => import('@/pages/accuracy/DistributionPage')), handle: h('Forecast accuracy', ['Accuracy', 'Distribution'], ['range', 'horizon']) },
              { path: 'reliability', element: page(() => import('@/pages/accuracy/ReliabilityPage')), handle: h('Forecast accuracy', ['Accuracy', 'Reliability'], ['range', 'horizon']) },
            ],
          },
          { path: 'day-ahead/:date?', element: page(() => import('@/pages/day-ahead/DayAheadPage')), handle: h('Day-ahead planner', ['Day-ahead'], ['cutoff']) },
          { path: 'live', element: page(() => import('@/pages/live/LivePage')), handle: h('Live forecast', ['Live'], []) },
          { path: 'methodology', element: page(() => import('@/pages/methodology/MethodologyPage')), handle: h('Methodology', ['Methodology'], []) },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
