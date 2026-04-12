
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Item, Sale, Event, EventStock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, MapPin, Calendar, PlusCircle, PackagePlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDataService } from '@/services/data-service-context';

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const dataService = useDataService();
  const [items, setItems] = useState<Item[]>([]);
  const [details, setDetails] = useState<{ event: Event | null; stocks: EventStock[]; sales: Sale[] }>({ event: null, stocks: [], sales: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [salesInput, setSalesInput] = useState<{ [key: string]: number }>({});
  const [stockInput, setStockInput] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  useEffect(() => {
    const unsubItems = dataService.subscribeToItems(setItems);
    const unsubDetails = dataService.subscribeToEventDetails(eventId, data => {
      setDetails(data);
      setIsLoading(false);
    });
    return () => { unsubItems(); unsubDetails(); };
  }, [dataService, eventId]);

  const handleAllocate = async (itemId: string) => {
    const qty = stockInput[itemId];
    if (!qty || qty <= 0) return;
    try {
      await dataService.allocateStock(eventId, itemId, qty);
      setStockInput(prev => ({ ...prev, [itemId]: 0 }));
      toast({ title: 'Succès', description: 'Stock alloué.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };

  const handleRecordSales = async () => {
    const toRecord = Object.entries(salesInput).filter(([, q]) => q > 0);
    try {
      for (const [itemId, quantity] of toRecord) {
        await dataService.recordSale({ itemId, quantity, eventId });
      }
      setSalesInput({});
      toast({ title: 'Succès', description: 'Ventes enregistrées.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };

  const eventItems = useMemo(() => {
    return items.map(item => {
      const stock = details.stocks.find(s => s.itemId === item.id)?.allocatedQuantity || 0;
      const sold = details.sales.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
      return { ...item, allocated: stock, remaining: stock - sold };
    });
  }, [items, details]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!details.event) return <div>Événement non trouvé.</div>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild><Link href="/events"><ArrowLeft /></Link></Button>
            <div>
              <CardTitle>{details.event.name}</CardTitle>
              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{details.event.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(details.event.date, 'dd MMM yyyy')}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Saisir les ventes</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Article</TableHead><TableHead>Dispo</TableHead><TableHead className="w-32">Vendu</TableHead></TableRow></TableHeader>
                <TableBody>
                  {eventItems.filter(i => i.allocated > 0).map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.remaining}</TableCell>
                      <TableCell><Input type="number" min="0" max={item.remaining} value={salesInput[item.id] || ''} onChange={e => setSalesInput(p => ({ ...p, [item.id]: parseInt(e.target.value) }))} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleRecordSales} className="w-full mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Allocation Stock</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Article</TableHead><TableHead>Central</TableHead><TableHead>Alloué</TableHead><TableHead className="w-32">Ajouter</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.currentQuantity}</TableCell>
                      <TableCell>{details.stocks.find(s => s.itemId === item.id)?.allocatedQuantity || 0}</TableCell>
                      <TableCell><Input type="number" min="0" value={stockInput[item.id] || ''} onChange={e => setStockInput(p => ({ ...p, [item.id]: parseInt(e.target.value) }))} /></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => handleAllocate(item.id)}><PackagePlus className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
