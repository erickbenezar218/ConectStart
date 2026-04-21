import { Metadata } from 'next'
import LeadDetails from '@/components/admin/LeadDetails'

export const metadata: Metadata = {
  title: 'Detalhes do Lead | ConectFlow',
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return <LeadDetails leadId={params.id} />
}
