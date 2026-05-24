import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setUser, setTokens } = useAuthStore()
  return { user, isAuthenticated, isLoading, login, logout, setUser, setTokens }
}
