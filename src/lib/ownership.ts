import { prisma } from './db';

export async function verifyChildOwnership(childId: string, userId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.userId !== userId) return null;
  return child;
}

export async function verifyWorksheetOwnership(worksheetId: string, userId: string) {
  const worksheet = await prisma.worksheet.findUnique({
    where: { id: worksheetId },
    include: { child: true },
  });
  if (!worksheet || worksheet.child.userId !== userId) return null;
  return worksheet;
}
