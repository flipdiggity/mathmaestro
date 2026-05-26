import { redirect } from 'next/navigation';

// Personal-use rebuild: no billing. Redirect to home.
export default function BillingPage() {
  redirect('/');
}
