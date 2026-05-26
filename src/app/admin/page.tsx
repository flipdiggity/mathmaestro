import { redirect } from 'next/navigation';

// Personal-use rebuild: no admin panel. Redirect to home.
export default function AdminPage() {
  redirect('/');
}
