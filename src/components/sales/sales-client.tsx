'use client';

import { useState, useMemo } from 'react';
import type { Item, Sale, Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addSale } from '@/lib/data';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';


export default function SalesClient() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const itemsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'inventoryItems') : null),
    [firestore, user]
  );
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  const salesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'sales') : null),
    [firestore, user]
  );
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

  const eventsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'events') : null),
    [firestore, user]
  );
  const { data: events, isLoading: eventsLoading } = useCollection<Event>(eventsQuery);

  const { toast } = useToast();

  const handleRecordSale = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const itemId = formData.get('itemId') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const eventId = formData.get('eventId') as string === 'none' ? undefined : formData.get('eventId') as string;

    if (!itemId || !quantity || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un article et une quantité valide.' });
      return;
    }

    try {
      await addSale({ itemId, quantity, eventId });
      
      toast({ title: 'Succès', description: 'Vente enregistrée.' });
      (event.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible d\'enregistrer la vente.' });
    }
  };

  const sortedSales = useMemo(() => {
    if (!sales) return [];
    return [...sales].sort((a, b) => (b.timestamp as Timestamp).toMillis() - (a.timestamp as Timestamp).toMillis());
  }, [sales]);

  const isLoading = isUserLoading || itemsLoading || salesLoading || eventsLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Tabs defaultValue="record">
      <div className='flex justify-between items-center mb-4'>
        <TabsList>
          <TabsTrigger value="record">Enregistrer une Vente</TabsTrigger>
          <TabsTrigger value="history">Historique des Ventes</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="record">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Vente</CardTitle>
            <CardDescription>Sélectionnez un article, la quantité vendue et éventuellement l'événement associé.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordSale} className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="eventId">Événement (Optionnel)</Label>
                <Select name="eventId">
                  <SelectTrigger>
                    <SelectValue placeholder="Vente hors-événement" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Aucun (Vente directe)</SelectItem>
                    {events?.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="itemId">Article</Label>
                <Select name="itemId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un article" />
                  </SelectTrigger>
                  <SelectContent>
                    {items?.map(item => (
                      <SelectItem key={item.id} value={item.id} disabled={item.currentQuantity === 0}>
                        {item.name} (Stock Central: {item.currentQuantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="quantity">Quantité</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required />
              </div>
              <Button type="submit">Enregistrer la Vente</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Historique des Ventes</CardTitle>
            <CardDescription>Liste de toutes les transactions enregistrées.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.map(sale => {
                  const item = items?.find(i => i.id === sale.itemId);
                  const event = events?.find(e => e.id === sale.eventId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>{format(sale.timestamp.toDate(), 'Pp', { locale: fr })}</TableCell>
                      <TableCell className="font-medium">{item?.name || 'N/A'}</TableCell>
                      <TableCell>{event?.name || <span className="text-muted-foreground">Aucun</span>}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right">{sale.salePrice.toLocaleString('fr-CM', { style: 'currency', currency: 'XAF' })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
