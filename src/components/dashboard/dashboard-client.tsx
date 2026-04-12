'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Item, Sale, Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, Package, TriangleAlert, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useDataService } from '@/services/data-service-context';

const chartConfig = {
  revenue: { label: 'Revenu', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function DashboardClient() {
  const dataService = useDataService();
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dataService) return;
    const unsubItems = dataService.subscribeToItems(setItems);
    const unsubSales = dataService.subscribeToSales(setSales);
    const unsubEvents = dataService.subscribeToEvents(data => {
      setEvents(data);
      setIsLoading(false);
    });
    return () => { unsubItems(); unsubSales(); unsubEvents(); };
  }, [dataService]);

  const { totalRevenue, totalSales, lowStockItems } = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.salePrice, 0);
    const totalSales = sales.reduce((acc, sale) => acc + sale.quantity, 0);
    const lowStockItems = items.filter(item => item.currentQuantity < item.lowStockThreshold);
    return { totalRevenue, totalSales, lowStockItems };
  }, [items, sales]);

  const salesByDay = useMemo(() => {
    const data: { [key: string]: number } = {};
    sales.slice(-7).forEach((sale) => {
      const day = format(sale.timestamp, 'eee', { locale: fr });
      data[day] = (data[day] || 0) + sale.salePrice;
    });
    return Object.entries(data).map(([day, revenue]) => ({ day, revenue }));
  }, [sales]);

  const mostRecentEvent = useMemo(() => {
    if (events.length === 0) return null;
    return [...events].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }, [events]);

  if (!dataService || isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-CM', { style: 'currency', currency: 'XAF' })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Vendus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">+{totalSales}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types d'articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent>
        </Card>
        <Card className={mostRecentEvent ? 'bg-accent/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain Événement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {mostRecentEvent ? (
              <Link href={`/events/${mostRecentEvent.id}`}>
                <div className="text-lg font-bold truncate">{mostRecentEvent.name}</div>
                <p className="text-xs text-muted-foreground">{format(mostRecentEvent.date, 'dd MMMM', { locale: fr })}</p>
              </Link>
            ) : <p className="text-sm">Aucun</p>}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Aperçu des Ventes</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={salesByDay}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Ventes Récentes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Article</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
              <TableBody>
                {sales.slice(-5).reverse().map((sale) => {
                  const item = items.find(i => i.id === sale.itemId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{item?.name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{format(sale.timestamp, 'HH:mm')}</div>
                      </TableCell>
                      <TableCell className="text-right">{sale.salePrice.toLocaleString('fr-CM', { style: 'currency', currency: 'XAF' })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><TriangleAlert /> Stock Faible</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {lowStockItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right"><Badge variant="destructive">{item.currentQuantity}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
