import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthenticationModule from '../../modules/auth/AuthenticationModule'

export default function Login() {
  const navigate = useNavigate()
  const { user, signIn } = useAuth()

  if (user) return <Navigate to={`/${user.role}/home`} replace />

  function handleAuthenticated(session) {
    signIn(session)
    navigate(`/${session.user.role}/home`, { replace: true })
  }

  return <AuthenticationModule onAuthenticated={handleAuthenticated} />
}
