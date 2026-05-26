import { redirect } from 'next/navigation';

// Personal-use rebuild: no auth, no sign-up. Redirect to home.
export default function SignUpPage() {
  redirect('/');
}
