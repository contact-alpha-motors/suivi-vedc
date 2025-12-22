import SalesClient from '@/components/sales/sales-client';
import { getItems, getSales } from '@/lib/data';

export default async function SalesPage() {
  const [initialItems, initialSales] = await Promise.all([
    getItems(),
    getSales(),
  ]);

  return <SalesClient initialItems={initialItems} initialSales={initialSales} />;
}
