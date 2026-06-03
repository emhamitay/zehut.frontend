import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  clearToken,
  fetchMe,
  fetchSetupRequired,
  login as apiLogin,
  setupFirstUser as apiSetup,
  setToken,
  type AuthUser,
} from '../lib/api'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  setupRequired: boolean
  login: (username: string, password: string) => Promise<void>
  setupFirstUser: (username: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const required = await fetchSetupRequired()
      setSetupRequired(required)
      if (required) {
        setUser(null)
      } else {
        const me = await fetchMe()
        setUser(me)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await apiLogin(username, password)
    setToken(token)
    setUser(u)
    setSetupRequired(false)
  }, [])

  const setupFirstUser = useCallback(
    async (username: string, password: string) => {
      const { token, user: u } = await apiSetup(username, password)
      setToken(token)
      setUser(u)
      setSetupRequired(false)
    },
    [],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setupRequired,
        login,
        setupFirstUser,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
