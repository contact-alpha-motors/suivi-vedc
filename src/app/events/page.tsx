import EventsClient from '@/components/events/events-client';
import { getEvents } from '@/lib/data';

export default async function EventsPage() {
  const initialEvents = await getEvents();
  return <EventsClient initialEvents={initialEvents} />;
}
