'use client';

import { useState, useEffect, useMemo, use } from 'react';
import type { Item, Sale, Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addSale } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Calendar, User, MapPin, PlusCircle } from 'lucide-react';
import Link from 'next/link';

type EventDetailsClientProps = {
  event: Event;
  itemsPromise: Promise<Item[]>;
  salesPromise: Promise<Sale[]>;
};

type SalesInput = {
  [itemId: string]: number;
};

function EventDetailsClientContent({ event, initialItems, initialSales }: { event: Event, initialItems: Item[], initialSales: Sale[]}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [salesInput, setSalesInput] = useState<SalesInput>({});
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { toast } = useToast();

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const qty = parseInt(quantity, 10);
    setSalesInput(prev => ({
      ...prev,
      [itemId]: isNaN(qty) ? 0 : qty,
    }));
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

      let updatedItems = [...items];
      results.forEach(newSale => {
        const itemSold = updatedItems.find(i => i.id === newSale.itemId);
        if(itemSold) {
            const updated = {...itemSold, currentQuantity: itemSold.currentQuantity - newSale.quantity};
            updatedItems = updatedItems.map(i => i.id === newSale.itemId ? updated : i);
        }
      });
      setItems(updatedItems);
      setSalesInput({});

      toast({ title: 'Succès', description: `${results.length} vente(s) enregistrée(s) pour le ${format(new Date(saleDate), 'dd/MM/yyyy')}.` });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible d\'enregistrer les ventes.' });
    }
  };

  const salesByDay = useMemo(() => {
    const grouped: { [key: string]: Sale[] } = {};
    sales.forEach(sale => {
      const day = format(parseISO(sale.timestamp), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(sale);
    });
    return Object.entries(grouped).sort(([dayA], [dayB]) => dayB.localeCompare(dayA));
  }, [sales]);

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
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(event.date), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{event.administrator}</span>
                    </div>
                </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="record">
        <div className='flex justify-between items-center mb-4'>
            <TabsList>
                <TabsTrigger value="record">Enregistrer les Ventes</TabsTrigger>
                <TabsTrigger value="history">Historique de l'Événement</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="record">
            <Card>
                <CardHeader>
                    <CardTitle>Enregistrement groupé des ventes</CardTitle>
                    <CardDescription>
                    Saisissez les quantités vendues pour chaque article à la date sélectionnée.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="saleDate" className="text-right">Date de vente</Label>
                        <Input 
                        id="saleDate" 
                        name="saleDate" 
                        type="date" 
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="col-span-2" 
                        required 
                        />
                    </div>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead>Stock Actuel</TableHead>
                            <TableHead className="w-48">Quantité Vendue</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.currentQuantity}</TableCell>
                            <TableCell>
                                <Input 
                                type="number"
                                min="0"
                                max={item.currentQuantity}
                                placeholder="0"
                                value={salesInput[item.id] || ''}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                disabled={item.currentQuantity === 0}
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <Button onClick={handleBulkRecordSales} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Enregistrer les ventes du jour
                    </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history">
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
                                <h3 className="font-semibold mb-2 text-lg">
                                    {format(parseISO(day), "eeee dd MMMM yyyy", { locale: fr })}
                                </h3>
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

    return <EventDetailsClientContent {...props} initialItems={initialItems} initialSales={initialSales}/>
}
