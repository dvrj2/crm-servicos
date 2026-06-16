import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const createUser = async (
  data: Partial<User> & { password?: string; passwordConfirm?: string },
) => {
  return await pb.collection<User>('users').create(data)
}
