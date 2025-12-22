'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const pageTitles: { [key: string]: string } = {
  '/': 'Tableau de Bord',
  '/inventory': 'Gestion du Stock Initial',
  '/sales': 'Suivi des Ventes',
  '/events': 'Gestion des Événements',
};

export default function Header() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  const getTitle = () => {
    if (pathname.startsWith('/events/') && pathname.endsWith('/record-sales')) {
      return "Saisie des Ventes par Événement";
    }
    return pageTitles[pathname] || 'Suivi d\'Inventaire VEDC';
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <h1 className="text-lg font-semibold md:text-xl">
        {getTitle()}
      </h1>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                {userAvatar && <AvatarImage asChild src={userAvatar.imageUrl}><Image src={userAvatar.imageUrl} width={40} height={40} alt="User Avatar" data-ai-hint={userAvatar.imageHint}/></AvatarImage>}
                <AvatarFallback>AV</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
