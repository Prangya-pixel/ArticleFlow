import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function SignOutButton() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  function handleSignOut() {
    signOut()
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <button className="sign-out-button" type="button" onClick={handleSignOut}>
      Sign Out
    </button>
  )
}
