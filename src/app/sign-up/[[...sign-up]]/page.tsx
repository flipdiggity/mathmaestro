import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { isSaas } from '@/lib/mode';

export default function SignUpPage() {
  if (!isSaas) redirect('/');
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignUp />
    </div>
  );
}
