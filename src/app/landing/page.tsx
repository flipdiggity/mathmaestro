import { LandingPage } from '@/components/landing/landing-page';

// Preview route: renders the saas marketing page in ANY mode, so the landing
// experience can be reviewed/iterated without flipping NEXT_PUBLIC_APP_MODE.
// In saas mode the real landing lives at `/` for signed-out visitors.
export const metadata = {
  title: 'MathMaestro — Eanes ISD math practice that adapts',
};

export default function LandingPreviewPage() {
  return <LandingPage />;
}
