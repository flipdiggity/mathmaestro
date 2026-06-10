import { redirect } from 'next/navigation';
import { isSaas } from '@/lib/mode';
import { BillingView } from '@/components/billing/billing-view';

export default function BillingPage() {
  if (!isSaas) redirect('/');
  return <BillingView />;
}
