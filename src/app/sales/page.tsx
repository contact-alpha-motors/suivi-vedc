import SalesClient from '@/components/sales/sales-client';
import { getItems, getSales, getEvents } from '@/lib/data';

export default async function SalesPage() {
  const [initialItems, initialSales, initialEvents] = await Promise.all([
    getItems(),
    getSales(),
    getEvents(),
  ]);

  return <SalesClient initialItems={initialItems} initialSales={initialSales} initialEvents={initialEvents} />;
}
