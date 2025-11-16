import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Gets or creates a user in the database based on Clerk authentication
 * This ensures that even if the webhook hasn't fired yet, the user exists in the DB
 */
export async function getOrCreateUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // If user doesn't exist, create them (webhook might not have fired yet)
  if (!user) {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    try {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0].emailAddress,
          username: clerkUser.username || null,
        },
      })
    } catch (error: any) {
      // Handle race condition where webhook created user between our check and create
      if (error.code === 11000 || error.code === 'P2002') {
        user = await prisma.user.findUnique({
          where: { clerkId: userId },
        })
      } else {
        throw error
      }
    }
  }

  return user
}

/**
 * Gets the current authenticated user from the database
 * Throws an error if user is not authenticated or not found
 */
export async function requireUser() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
