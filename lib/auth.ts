import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Gets the current authenticated user from Clerk
 * Returns Clerk user object or null if not authenticated
 */
export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return await currentUser()
}

/**
 * Gets the current authenticated user from Clerk
 * Throws an error if user is not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await currentUser()
  
  if (!user) {
    throw new Error('User not found')
  }

  return user
}
