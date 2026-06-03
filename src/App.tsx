import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Users from './pages/Users'
import ContactSheets from './pages/ContactSheets';
import AddCitizens from './pages/AddCitizens';
import Login from './pages/Login'
import Setup from './pages/Setup'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/setup', element: <Setup /> },
  { path: '/', element: <ProtectedRoute><Navigate to="/add-citizens" replace /></ProtectedRoute> },
  { path: '/add-citizens', element: <ProtectedRoute><AddCitizens /></ProtectedRoute> },
  { path: '/contact-sheets', element: <ProtectedRoute><ContactSheets /></ProtectedRoute> },
  { path: '/users', element: <ProtectedRoute><Users /></ProtectedRoute> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
