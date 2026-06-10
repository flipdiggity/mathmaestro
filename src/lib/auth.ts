/**
 * Mode-aware auth.
 *
 * personal — no auth: one seeded local user (the parent) owns everything.
 * saas — Clerk: getCurrentUser maps the Clerk session to a User row,
 *   auto-creating it on first API call after signup. Admin-email users
 *   additionally claim any children still owned by the personal-mode local
 *   user, so flipping the flag doesn't strand existing data.
 */
import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import { isSaas } from './mode';
import { isAdminEmail } from './admin';

const LOCAL_USER = {
  id: 'local-felipe',
  email: 'felipe@local',
  name: 'Felipe',
};

async function getPersonalUser() {
  return prisma.user.upsert({
    where: { id: LOCAL_USER.id },
    update: {},
    create: {
      id: LOCAL_USER.id,
      clerkId: LOCAL_USER.id,
      email: LOCAL_USER.email,
      name: LOCAL_USER.name,
    },
  });
}

async function getSaasUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    // Auto-create user on first API call after Clerk signup.
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

  // One-time heal when switching personal → saas: the admin (the parent who
  // ran personal mode) adopts the children seeded under the local user.
  if (isAdminEmail(user.email)) {
    await prisma.child.updateMany({
      where: { userId: LOCAL_USER.id },
      data: { userId: user.id },
    });
  }

  return user;
}

export async function getCurrentUser() {
  return isSaas ? getSaasUser() : getPersonalUser();
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
