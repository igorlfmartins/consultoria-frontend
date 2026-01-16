import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { userId } = useAuth()
  if (!userId) {
    return <Navigate to="/" replace />
  }
  return children
}

export function App() {
  const { userId } = useAuth()

  return (
    <Routes>
      <Route path="/" element={userId ? <Navigate to="/chat" replace /> : <Login />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

