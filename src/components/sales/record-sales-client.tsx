'use client';

import { useState } from 'react';
import type { Item, Sale, Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addSale } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type RecordSalesClientProps = {
  event: Event;
  items: Item[];
};

type SalesInput = {
  [itemId: string]: number;
};

export default function RecordSalesClient({ event, items: initialItems }: RecordSalesClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
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
      .map(([itemId, quantity]) => ({ itemId, quantity, saleDate }));

    if (salesToRecord.length === 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Aucune quantité à enregistrer.' });
      return;
    }
    
    try {
      const promises = salesToRecord.map(sale => addSale(sale));
      const results = await Promise.all(promises);

      // Update local item state
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/events"><ArrowLeft /></Link>
            </Button>
            <div>
                <CardTitle>Enregistrer les Ventes pour: {event.name}</CardTitle>
                <CardDescription>
                Saisissez les quantités vendues pour chaque article à la date sélectionnée.
                </CardDescription>
            </div>
        </div>
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
            Enregistrer les ventes de la journée
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
