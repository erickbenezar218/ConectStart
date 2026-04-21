import { Metadata } from 'next'
import KanbanBoard from '@/components/admin/KanbanBoard'

export const metadata: Metadata = {
  title: 'Dashboard | ConectFlow Admin',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b bg-white flex items-center px-6 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Gestão de leads e instalações</p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
