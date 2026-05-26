import { redirect } from 'next/navigation';

// Personal-use rebuild: no auth, no sign-in. Redirect to home.
export default function SignInPage() {
  redirect('/');
}
