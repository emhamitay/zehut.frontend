import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Users from './pages/Users'
import ContactSheets from './pages/ContactSheets';
import AddCitizens from './pages/AddCitizens';
import CitizensSearch from './pages/CitizensSearch'
import CitizenDetail from './pages/CitizenDetail'
import CitizensMerge from './pages/CitizensMerge'
import Login from './pages/Login'
import Setup from './pages/Setup'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Home from "./pages/Home"

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/setup', element: <Setup /> },
  { path: '/', element: <ProtectedRoute><Home /></ProtectedRoute> },
  { path: '/add-citizens', element: <ProtectedRoute><AddCitizens /></ProtectedRoute> },
  { path: '/citizens', element: <ProtectedRoute><CitizensSearch /></ProtectedRoute> },
  { path: '/citizens/merge', element: <ProtectedRoute><CitizensMerge /></ProtectedRoute> },
  { path: '/citizens/:id', element: <ProtectedRoute><CitizenDetail /></ProtectedRoute> },
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
