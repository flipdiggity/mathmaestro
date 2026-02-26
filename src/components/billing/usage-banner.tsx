'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageData {
  generates: number;
  grades: number;
  freeGeneratesRemaining: number;
  freeGradesRemaining: number;
  hasPaymentMethod: boolean;
  isAdmin?: boolean;
}

export function UsageBanner() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch('/api/billing/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const totalFreeRemaining = usage.freeGeneratesRemaining + usage.freeGradesRemaining;

  // Don't show for admin users
  if (usage.isAdmin) return null;

  // Don't show if they have a payment method or have used nothing
  if (usage.hasPaymentMethod || (usage.generates === 0 && usage.grades === 0)) return null;

  // Show warning if running low
  if (totalFreeRemaining <= 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
      <span>
        {usage.freeGeneratesRemaining} free generation{usage.freeGeneratesRemaining !== 1 ? 's' : ''} and{' '}
        {usage.freeGradesRemaining} free grading{usage.freeGradesRemaining !== 1 ? 's' : ''} remaining.{' '}
      </span>
      <Link href="/billing" className="underline font-medium hover:text-amber-900">
        View billing
      </Link>
    </div>
  );
}
