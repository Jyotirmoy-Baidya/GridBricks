import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-extrabold">Page not found</h1>
      <Link to="/dashboard" className="mt-4 inline-block text-teal-700 underline">
        Back to the dashboard
      </Link>
    </div>
  )
}
