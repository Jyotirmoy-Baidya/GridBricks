import { createBrowserRouter, Navigate } from 'react-router-dom'
import LazyPage from '@/components/common/LazyPage'
import AccuracyLayout from '@/layouts/AccuracyLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import RootLayout from '@/layouts/RootLayout'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <LazyPage title="Overview" /> },
          { path: 'forecasts', element: <LazyPage title="Forecasts" /> },
          {
            path: 'accuracy',
            element: <AccuracyLayout />,
            children: [
              { index: true, element: <LazyPage title="Accuracy summary" /> },
              { path: 'horizon', element: <LazyPage title="Error by horizon" /> },
              { path: 'time-of-day', element: <LazyPage title="Error by time of day" /> },
              { path: 'distribution', element: <LazyPage title="Error distribution" /> },
            ],
          },
          { path: 'day-ahead/:date?', element: <LazyPage title="Day-ahead planner" /> },
          { path: 'methodology', element: <LazyPage title="Methodology" /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
