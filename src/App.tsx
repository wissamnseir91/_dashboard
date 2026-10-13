import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import ForgotPassword from '@/pages/ForgotPassword'
import Login from '@/pages/Login'
import NewPosition from '@/pages/NewPosition'
import NewRequest from '@/pages/NewRequest'
import NewRole from '@/pages/NewRole'
import NewUser from '@/pages/NewUser'
import Positions from '@/pages/Positions'
import ResetPassword from '@/pages/ResetPassword'
import Roles from '@/pages/Roles'
import RequestDetail from '@/pages/RequestDetail'
import RequestsList from '@/pages/RequestsList'
import UserDetail from '@/pages/UserDetail'
import Users from '@/pages/Users'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/requests/new" element={<NewRequest />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/new" element={<NewPosition />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<NewUser />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/roles/new" element={<NewRole />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
