import { SignedIn, SignedOut } from '@clerk/nextjs';
import { LandingPage } from '@/components/landing/landing-page';
import { DashboardPage } from '@/components/dashboard/dashboard-page';

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <DashboardPage />
      </SignedIn>
    </>
  );
}
