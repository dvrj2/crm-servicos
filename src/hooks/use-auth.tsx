import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ error: any; user?: any }>
  signIn: (email: string, password: string) => Promise<{ error: any; user?: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then((authData) => {
          if (authData.record.ativo === false) {
            pb.authStore.clear()
          }
        })
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb
        .collection('users')
        .create({ email, password, passwordConfirm: password, ativo: true })
      const authData = await pb.collection('users').authWithPassword(email, password)
      await pb
        .collection('users')
        .update(authData.record.id, { ultimo_login: new Date().toISOString() })
      return { error: null, user: authData.record }
    } catch (error) {
      return { error, user: null }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      if (authData.record.ativo === false) {
        pb.authStore.clear()
        return { error: { message: 'INACTIVE_ACCOUNT' }, user: null }
      }
      await pb
        .collection('users')
        .update(authData.record.id, { ultimo_login: new Date().toISOString() })
      return { error: null, user: authData.record }
    } catch (error) {
      return { error, user: null }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
