import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { isSaas } from '@/lib/mode';

export default function SignInPage() {
  if (!isSaas) redirect('/');
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignIn />
    </div>
  );
}
