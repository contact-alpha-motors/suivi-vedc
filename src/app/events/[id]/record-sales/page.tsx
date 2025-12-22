import RecordSalesClient from '@/components/sales/record-sales-client';
import { getEvent, getItems } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function RecordSalesPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);
  const items = await getItems();

  if (!event) {
    notFound();
  }

  return <RecordSalesClient event={event} items={items} />;
}
