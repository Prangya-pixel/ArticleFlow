import { useNavigate } from 'react-router-dom'

export default function SignOutButton() {
  const navigate = useNavigate()

  function handleSignOut() {
    localStorage.clear()
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <button className="sign-out-button" type="button" onClick={handleSignOut}>
      Sign Out
    </button>
  )
}
