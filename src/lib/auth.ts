/**
 * Personal-use auth shim.
 *
 * This used to wrap Clerk for the SaaS version. For our personal summer-rebuild
 * we don't need auth at all — there's exactly one "user" (the parent), and the
 * children rows are seeded. We keep the same function shape so the ~20 API
 * routes that call requireUser()/getCurrentUser() don't need to change.
 *
 * The User row is upserted on first call so the app self-heals against an
 * empty DB.
 */
import { prisma } from './db';

const LOCAL_USER = {
  id: 'local-felipe',
  email: 'felipe@local',
  name: 'Felipe',
};

export async function getCurrentUser() {
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

export async function requireUser() {
  return getCurrentUser();
}
