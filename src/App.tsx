import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Users from './pages/Users'
import ContactSheets from './pages/ContactSheets';
import AddCitizens from './pages/AddCitizens';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/add-citizens" replace /> },
  { path: '/add-citizens', element: <AddCitizens /> },
  { path: '/contact-sheets', element: <ContactSheets /> },
  { path: '/users', element: <Users /> },
])

export default function App() {
  return <RouterProvider router={router} />
}