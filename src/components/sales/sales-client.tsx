
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Item, Sale, Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDataService } from '@/services/data-service-context';
import { Loader2 } from 'lucide-react';

export default function SalesClient() {
  const dataService = useDataService();
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubItems = dataService.subscribeToItems(setItems);
    const unsubSales = dataService.subscribeToSales(setSales);
    const unsubEvents = dataService.subscribeToEvents(data => {
      setEvents(data);
      setIsLoading(false);
    });
    return () => { unsubItems(); unsubSales(); unsubEvents(); };
  }, [dataService]);

  const handleRecordSale = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const itemId = formData.get('itemId') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const eventId = formData.get('eventId') as string === 'none' ? undefined : formData.get('eventId') as string;

    try {
      await dataService.recordSale({ itemId, quantity, eventId });
      toast({ title: 'Succès', description: 'Vente enregistrée.' });
      (event.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <Tabs defaultValue="record">
      <TabsList className="mb-4">
        <TabsTrigger value="record">Nouvelle Vente</TabsTrigger>
        <TabsTrigger value="history">Historique</TabsTrigger>
      </TabsList>
      <TabsContent value="record">
        <Card>
          <CardHeader><CardTitle>Enregistrer une vente</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleRecordSale} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Article</Label>
                <Select name="itemId" required>
                  <SelectTrigger><SelectValue placeholder="Choisir un article" /></SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name} ({item.currentQuantity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Événement (Optionnel)</Label>
                <Select name="eventId">
                  <SelectTrigger><SelectValue placeholder="Direct" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Quantité</Label>
                <Input name="quantity" type="number" min="1" required />
              </div>
              <Button type="submit">Valider la vente</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader><CardTitle>Dernières transactions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Article</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {sales.slice().reverse().map(sale => {
                  const item = items.find(i => i.id === sale.itemId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="text-xs">{format(sale.timestamp, 'dd/MM HH:mm')}</TableCell>
                      <TableCell className="font-medium">{item?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-bold">{sale.salePrice.toLocaleString()} F</TableCell>
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
