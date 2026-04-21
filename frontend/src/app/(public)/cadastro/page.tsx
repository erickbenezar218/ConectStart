import { Metadata } from 'next'
import MultiStepForm from '@/components/forms/MultiStepForm'

export const metadata: Metadata = {
  title: 'Pré-Cadastro | ConectFlow',
  description: 'Faça seu pré-cadastro e garanta sua instalação de internet fibra.',
}

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="font-bold text-lg text-primary">ConectFlow</span>
          </div>
          <span className="text-muted-foreground text-sm hidden sm:block">
            | Sistema de Pré-Cadastro
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-8 md:py-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Garanta sua{' '}
            <span className="text-primary">Internet Fibra</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Preencha o formulário abaixo e nossa equipe entrará em contato para agendar
            sua instalação.
          </p>
        </div>

        <MultiStepForm />
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ConectFlow — Todos os direitos reservados</p>
      </footer>
    </main>
  )
}
