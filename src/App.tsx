import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import AddPeople from './pages/AddPeople'
import GetPeople from './pages/GetPeople'
import Users from './pages/Users'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/add-people" replace /> },
  { path: '/add-people', element: <AddPeople /> },
  { path: '/get-people', element: <GetPeople /> },
  { path: '/users', element: <Users /> },
])

export default function App() {
  return <RouterProvider router={router} />
}