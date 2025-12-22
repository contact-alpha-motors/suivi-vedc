
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading) {
      // If user is not logged in and not on the login page, redirect to login
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
      // If user is logged in and on the login page, redirect to home
      if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router, pathname]);

  // While checking auth state, show a loader
  if (isUserLoading || (!user && pathname !== '/login') || (user && pathname === '/login')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is authenticated and not on login page, or not auth and on login page
  return <>{children}</>;
}
