export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  emailVerified: boolean
  photoURL?: string
}
