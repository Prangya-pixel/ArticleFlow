import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('articleflow_user'))
    } catch {
      return null
    }
  })

  function signIn({ token, user: authenticatedUser }) {
    localStorage.setItem('articleflow_token', token)
    localStorage.setItem('articleflow_user', JSON.stringify(authenticatedUser))
    setUser(authenticatedUser)
  }

  function signOut() {
    localStorage.removeItem('articleflow_token')
    localStorage.removeItem('articleflow_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, role: user?.role ?? null, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
