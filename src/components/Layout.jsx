import { Link, Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Co-Study Scheduler
          </Link>
          <Link
            to="/create"
            className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt-700"
          >
            Create a Room
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        Co-Study Scheduler — Book co-study sessions with your group
      </footer>
    </div>
  )
}

export default Layout
