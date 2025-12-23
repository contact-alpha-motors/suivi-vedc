
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the auth state is determined
    if (isUserLoading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    // If user is not logged in and not on an auth page, redirect to login
    if (!user && !isAuthPage) {
      router.push('/login');
    }

    // If user is logged in and on an auth page, redirect to home
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname]);

  // Render children immediately to avoid hydration mismatch.
  // The logic inside useEffect will handle redirection after the initial render.
  return <>{children}</>;
}
