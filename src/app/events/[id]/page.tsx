import EventDetailsClient from '@/components/events/event-details-client';
import { notFound } from 'next/navigation';

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  
  return <EventDetailsClient eventId={params.id} />;
}
