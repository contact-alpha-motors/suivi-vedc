'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { EventWithISOString } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addEvent, updateEvent, deleteEvent as deleteEventAction } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function EventsClient() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const eventsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'events') : null),
    [firestore, user]
  );
  const { data: events, isLoading: eventsLoading } = useCollection<EventWithISOString>(eventsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithISOString | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenDialog = (event: EventWithISOString | null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEventAction(id);
      toast({ title: 'Succès', description: "L'événement a été supprimé." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer l'événement." });
    }
  };

  const handleSave = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    
    const eventData = {
        name: data.name,
        location: data.location,
        date: new Date(data.date),
        administrator: data.administrator,
    };

    try {
      if (editingEvent) {
        await updateEvent({ ...eventData, id: editingEvent.id });
        toast({ title: 'Succès', description: 'Événement mis à jour.' });
      } else {
        await addEvent(eventData);
        toast({ title: 'Succès', description: 'Événement ajouté.' });
      }
      setIsDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de sauvegarder l'événement." });
    }
  };
  
  const editingDateValue = editingEvent ? format(parseISO(editingEvent.date), "yyyy-MM-dd'T'HH:mm") : '';

  const handleRowClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };
  
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [events]);

  const isLoading = isUserLoading || eventsLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestion des Événements</CardTitle>
              <CardDescription>
                Cliquez sur un événement pour voir les détails et enregistrer les ventes.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un événement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Administrateur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  onClick={() => handleRowClick(event.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{isClient ? format(parseISO(event.date), 'dd MMMM yyyy', { locale: fr }) : ''}</TableCell>
                  <TableCell>{event.administrator}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()} // Prevent row click
                        >
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleOpenDialog(event)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Modifier l\'événement' : 'Ajouter un nouvel événement'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les détails de l'événement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" name="name" defaultValue={editingEvent?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Lieu</Label>
                <Input id="location" name="location" defaultValue={editingEvent?.location} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="datetime-local" defaultValue={editingDateValue} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="administrator" className="text-right">Admin</Label>
                <Input id="administrator" name="administrator" defaultValue={editingEvent?.administrator} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => setEditingEvent(null)}>Annuler</Button>
              </DialogClose>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
