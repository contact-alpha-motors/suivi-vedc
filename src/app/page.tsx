import { getItems, getSales, getEvents } from '@/lib/data';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const [items, sales, events] = await Promise.all([
    getItems(),
    getSales(),
    getEvents(),
  ]);

  return <DashboardClient items={items} sales={sales} events={events} />;
}
