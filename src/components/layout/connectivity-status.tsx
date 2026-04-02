'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Badge
      variant={isOnline ? 'outline' : 'destructive'}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-all",
        isOnline ? "border-green-500 text-green-600 bg-green-50" : "animate-pulse"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>En ligne</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Hors ligne</span>
        </>
      )}
    </Badge>
  );
}