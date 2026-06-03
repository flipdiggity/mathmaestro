'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/**
 * A nav link that also works when you're already on the target route. A plain
 * Next.js <Link> to the current route is a no-op, so pages that hold client
 * state (e.g. the Generate page showing a finished worksheet) wouldn't reset.
 * When clicked while already on `href`, this pushes a one-time `?fresh=<nonce>`
 * signal that those pages listen for to reset themselves.
 */
export function SmartLink({
  href,
  className,
  onNavigate,
  children,
}: {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        onNavigate?.();
        if (pathname === href) {
          e.preventDefault();
          router.push(`${href}?fresh=${Date.now()}`);
        }
      }}
    >
      {children}
    </Link>
  );
}
