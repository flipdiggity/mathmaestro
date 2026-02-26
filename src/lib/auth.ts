import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    // Auto-create user on first API call after Clerk signup
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    }).then((r) => r.json());

    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.email_addresses?.[0]?.email_address ?? `${clerkId}@unknown.com`,
        name: [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') || null,
      },
    });
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
