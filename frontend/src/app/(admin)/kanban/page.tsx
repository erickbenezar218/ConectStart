import KanbanBoard from '@/components/admin/KanbanBoard'

export default function KanbanPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      <header className="h-16 border-b bg-white flex items-center px-6 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Visão Kanban dos leads por status</p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
