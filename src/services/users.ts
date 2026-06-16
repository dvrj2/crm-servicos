import pb from '@/lib/pocketbase/client'
import type { User } from '@/types'

export const createUser = (data: Partial<User> & { password?: string; passwordConfirm?: string }) =>
  pb.collection<User>('users').create(data)
