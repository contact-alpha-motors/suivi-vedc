'use client';

import type { Item, Sale, Event } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TriangleAlert,
  Calendar,
} from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

type DashboardClientProps = {
  items: Item[];
  sales: Sale[];
  events: Event[];
};

const chartConfig = {
  revenue: {
    label: 'Revenu',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function DashboardClient({ items, sales, events }: DashboardClientProps) {
  const { totalRevenue, totalSales, lowStockItems } = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.salePrice, 0);
    const totalSales = sales.reduce((acc, sale) => acc + sale.quantity, 0);
    const lowStockItems = items.filter(
      (item) => item.currentQuantity < item.lowStockThreshold
    );
    return { totalRevenue, totalSales, lowStockItems };
  }, [items, sales]);

  const salesByDay = useMemo(() => {
    const data: { [key: string]: number } = {};
    sales.forEach((sale) => {
      const day = format(parseISO(sale.timestamp), 'eee', { locale: fr });
      if (!data[day]) {
        data[day] = 0;
      }
      data[day] += sale.salePrice;
    });

    return Object.entries(data)
      .map(([day, revenue]) => ({ day, revenue }))
      .reverse();
  }, [sales]);

  const recentSales = sales.slice(0, 5);

  const upcomingEvent = useMemo(() => {
    return events
    .map(e => ({...e, date: parseISO(e.date)}))
    .filter(e => e.date > new Date())
    .sort((a,b) => a.date.getTime() - b.date.getTime())[0];
  }, [events]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString('fr-CM', {
                style: 'currency',
                currency: 'XAF',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Basé sur toutes les ventes enregistrées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Vendus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total d'articles vendus
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types d'articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Nombre d'articles uniques en stock
            </p>
          </CardContent>
        </Card>
        <Card className={upcomingEvent ? 'bg-accent/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain Événement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingEvent ? (
                <>
                <div className="text-lg font-bold">{upcomingEvent.name}</div>
                <p className="text-xs text-muted-foreground">
                    {format(upcomingEvent.date, 'dd MMMM yyyy', { locale: fr })} à {upcomingEvent.location}
                </p>
                </>
            ) : (
                <>
                <div className="text-lg font-bold">Aucun</div>
                <p className="text-xs text-muted-foreground">
                    Aucun événement à venir
                </p>
                </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Aperçu des Ventes</CardTitle>
            <CardDescription>Revenu des 7 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={salesByDay}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={(value) =>
                    `${Number(value).toLocaleString('fr-CM')} FCFA`
                  }
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventes Récentes</CardTitle>
            <CardDescription>
              Les 5 dernières transactions enregistrées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => {
                  const item = items.find((i) => i.id === sale.itemId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{item?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(sale.timestamp), 'Pp', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.salePrice.toLocaleString('fr-CM', {
                          style: 'currency',
                          currency: 'XAF',
                        })}
                      </TableCell>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert /> Alertes de Stock Faible
            </CardTitle>
            <CardDescription>
              Ces articles sont bientôt en rupture de stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Quantité Restante</TableHead>
                  <TableHead>Seuil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.currentQuantity}</Badge>
                    </TableCell>
                    <TableCell>{item.lowStockThreshold}</TableCell>
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
