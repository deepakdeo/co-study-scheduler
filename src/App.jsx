import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import Room from './pages/Room'
import Admin from './pages/Admin'

const NotFound = () => (
  <div className="py-20 text-center">
    <h1 className="text-4xl font-bold text-gray-900">404</h1>
    <p className="mt-2 text-gray-500">Page not found</p>
    <Link to="/" className="mt-4 inline-block text-cobalt-600 hover:underline">
      Go home
    </Link>
  </div>
)

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/r/:slug" element={<Room />} />
          <Route path="/r/:slug/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
