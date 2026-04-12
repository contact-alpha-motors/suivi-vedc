
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDataService } from '@/services/data-service-context';

export default function EventsClient() {
  const dataService = useDataService();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    return dataService.subscribeToEvents(data => {
      setEvents(data);
      setIsLoading(false);
    });
  }, [dataService]);

  const handleOpenDialog = (event: Event | null) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dataService.removeEvent(id);
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
      await dataService.saveEvent(editingEvent ? { ...eventData, id: editingEvent.id } : eventData);
      toast({ title: 'Succès', description: editingEvent ? 'Événement mis à jour.' : 'Événement ajouté.' });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de sauvegarder l'événement." });
    }
  };
  
  const editingDateValue = editingEvent?.date ? format(editingEvent.date, "yyyy-MM-dd") : '';

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [events]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestion des Événements</CardTitle>
              <CardDescription>Cliquez sur un événement pour gérer les stocks et ventes.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.id} onClick={() => router.push(`/events/${event.id}`)} className="cursor-pointer">
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{format(event.date, 'dd MMMM yyyy', { locale: fr })}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleOpenDialog(event)}>Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(event.id)}>Supprimer</DropdownMenuItem>
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
            <DialogHeader><DialogTitle>{editingEvent ? 'Modifier' : 'Ajouter'} événement</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" name="name" defaultValue={editingEvent?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editingDateValue} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter><Button type="submit">Sauvegarder</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
