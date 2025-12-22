'use client';

import { useState, useMemo, use } from 'react';
import type { Item, Sale, Event, EventStock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addSale, allocateStockToEvent } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Calendar, User, MapPin, PlusCircle, PackagePlus, MinusCircle } from 'lucide-react';
import Link from 'next/link';

type EventDetailsClientProps = {
  event: Event;
  itemsPromise: Promise<Item[]>;
  salesPromise: Promise<Sale[]>;
  eventStocksPromise: Promise<EventStock[]>;
};

type SalesInput = { [itemId: string]: number };
type StockAllocationInput = { [itemId: string]: number };

function EventDetailsClientContent({ 
  event, 
  initialItems, 
  initialSales,
  initialEventStocks
}: { 
  event: Event, 
  initialItems: Item[], 
  initialSales: Sale[],
  initialEventStocks: EventStock[]
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [eventStocks, setEventStocks] = useState<EventStock[]>(initialEventStocks);

  const [salesInput, setSalesInput] = useState<SalesInput>({});
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [stockAllocationInput, setStockAllocationInput] = useState<StockAllocationInput>({});

  const { toast } = useToast();

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const qty = parseInt(quantity, 10);
    setSalesInput(prev => ({ ...prev, [itemId]: isNaN(qty) ? 0 : qty }));
  };
  
  const handleStockAllocationChange = (itemId: string, quantity: string) => {
    const qty = parseInt(quantity, 10);
    setStockAllocationInput(prev => ({ ...prev, [itemId]: isNaN(qty) ? 0 : qty }));
  };

  const handleBulkRecordSales = async () => {
    const salesToRecord = Object.entries(salesInput)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity, saleDate, eventId: event.id }));

    if (salesToRecord.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Aucune quantité à enregistrer.' });
      return;
    }
    
    try {
      const promises = salesToRecord.map(sale => addSale(sale));
      const results = await Promise.all(promises);

      setSales(prev => [...results, ...prev].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
      setSalesInput({});
      toast({ title: 'Succès', description: `${results.length} vente(s) enregistrée(s) pour le ${format(new Date(saleDate), 'dd/MM/yyyy')}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible d\'enregistrer les ventes.' });
    }
  };
  
  const handleAllocateStock = async (itemId: string) => {
    const quantity = stockAllocationInput[itemId];
    if (!quantity || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer une quantité valide.'});
      return;
    }

    try {
      const updatedEventStock = await allocateStockToEvent(event.id, itemId, quantity);

      // Update central stock item
      const centralItem = items.find(i => i.id === itemId)!;
      const updatedCentralItem = {...centralItem, currentQuantity: centralItem.currentQuantity - quantity };
      setItems(prev => prev.map(i => i.id === itemId ? updatedCentralItem : i));
      
      // Update event stock list
      const existingEventStock = eventStocks.find(es => es.itemId === itemId);
      if (existingEventStock) {
        setEventStocks(prev => prev.map(es => es.itemId === itemId ? updatedEventStock : es));
      } else {
        setEventStocks(prev => [...prev, updatedEventStock]);
      }
      
      setStockAllocationInput(prev => ({...prev, [itemId]: 0}));
      toast({ title: 'Succès', description: `${quantity} unité(s) de "${centralItem.name}" allouée(s) à l'événement.`});

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || "Impossible d'allouer le stock."});
    }
  };


  const salesByDay = useMemo(() => {
    const grouped: { [key: string]: Sale[] } = {};
    sales.forEach(sale => {
      const day = format(parseISO(sale.timestamp), 'yyyy-MM-dd');
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(sale);
    });
    return Object.entries(grouped).sort(([dayA], [dayB]) => dayB.localeCompare(dayA));
  }, [sales]);

  const eventItemsWithStock = useMemo(() => {
    return items.map(item => {
      const eventStock = eventStocks.find(es => es.itemId === item.id);
      const allocatedQuantity = eventStock ? eventStock.allocatedQuantity : 0;
      const soldQuantity = sales.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
      const remainingQuantity = allocatedQuantity - soldQuantity;
      return { ...item, allocatedQuantity, soldQuantity, remainingQuantity };
    });
  }, [items, sales, eventStocks]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/events"><ArrowLeft /></Link>
            </Button>
            <div>
                <CardTitle className="text-3xl">{event.name}</CardTitle>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{event.location}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{format(parseISO(event.date), 'dd MMMM yyyy', { locale: fr })}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{event.administrator}</span></div>
                </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="record">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record">Enregistrer Ventes</TabsTrigger>
            <TabsTrigger value="stock">Stock Événement</TabsTrigger>
            <TabsTrigger value="history">Historique Ventes</TabsTrigger>
        </TabsList>
        <TabsContent value="record" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Enregistrement groupé des ventes</CardTitle>
                    <CardDescription>Saisissez les quantités vendues pour chaque article à la date sélectionnée. Les quantités sont déduites du stock de l'événement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="saleDate" className="text-right">Date de vente</Label>
                        <Input id="saleDate" name="saleDate" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="col-span-2" required />
                    </div>
                    <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead>Stock Événement</TableHead>
                            <TableHead className="w-48">Quantité Vendue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {eventItemsWithStock.filter(i => i.allocatedQuantity > 0).map(item => (
                            <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.remainingQuantity}</TableCell>
                            <TableCell>
                                <Input type="number" min="0" max={item.remainingQuantity} placeholder="0" value={salesInput[item.id] || ''} onChange={(e) => handleQuantityChange(item.id, e.target.value)} disabled={item.remainingQuantity === 0} />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <Button onClick={handleBulkRecordSales} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer les ventes du jour
                    </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion du Stock de l'Événement</CardTitle>
              <CardDescription>Allouez des articles du stock central à cet événement. Le stock de l'événement est utilisé pour les ventes.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Stock Central</TableHead>
                      <TableHead>Alloué à l'Événement</TableHead>
                      <TableHead className="w-48">Quantité à Ajouter</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.currentQuantity}</TableCell>
                        <TableCell>{eventStocks.find(es => es.itemId === item.id)?.allocatedQuantity || 0}</TableCell>
                        <TableCell>
                          <Input type="number" min="0" max={item.currentQuantity} placeholder="0" value={stockAllocationInput[item.id] || ''} onChange={(e) => handleStockAllocationChange(item.id, e.target.value)} disabled={item.currentQuantity === 0} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleAllocateStock(item.id)} disabled={(stockAllocationInput[item.id] || 0) <= 0}><PackagePlus className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Ventes de l'événement</CardTitle>
                    <CardDescription>Historique complet des ventes pour "{event.name}".</CardDescription>
                </CardHeader>
                <CardContent>
                    {salesByDay.length > 0 ? (
                        <div className="space-y-6">
                        {salesByDay.map(([day, daySales]) => (
                            <div key={day}>
                                <h3 className="font-semibold mb-2 text-lg">{format(parseISO(day), "eeee dd MMMM yyyy", { locale: fr })}</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Heure</TableHead>
                                            <TableHead>Article</TableHead>
                                            <TableHead className="text-right">Quantité</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {daySales.map(sale => {
                                            const item = items.find(i => i.id === sale.itemId);
                                            return (
                                                <TableRow key={sale.id}>
                                                    <TableCell>{format(parseISO(sale.timestamp), 'HH:mm', { locale: fr })}</TableCell>
                                                    <TableCell className="font-medium">{item?.name || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">{sale.quantity}</TableCell>
                                                    <TableCell className="text-right">{sale.salePrice.toLocaleString('fr-CM', { style: 'currency', currency: 'XAF' })}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Aucune vente enregistrée pour cet événement.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EventDetailsClient(props: EventDetailsClientProps) {
    const initialItems = use(props.itemsPromise);
    const initialSales = use(props.salesPromise);
    const initialEventStocks = use(props.eventStocksPromise);

    return <EventDetailsClientContent {...props} initialItems={initialItems} initialSales={initialSales} initialEventStocks={initialEventStocks} />
}
