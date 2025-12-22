import EventDetailsClient from '@/components/events/event-details-client';
import { getEvent, getItems, getSalesForEvent, getEventStocks } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);
  
  if (!event) {
    notFound();
  }
  
  const itemsPromise = getItems();
  const salesPromise = getSalesForEvent(event.id);
  const eventStocksPromise = getEventStocks(event.id);

  return <EventDetailsClient 
    event={event} 
    itemsPromise={itemsPromise} 
    salesPromise={salesPromise}
    eventStocksPromise={eventStocksPromise} 
  />;
}
