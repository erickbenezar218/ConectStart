import { Metadata } from 'next'
import Image from 'next/image'
import MultiStepForm from '@/components/forms/MultiStepForm'

export const metadata: Metadata = {
  title: 'Pré-Cadastro | ConectFlow',
  description: 'Faça seu pré-cadastro e garanta sua instalação de internet fibra.',
}

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header — safe area top para iOS notch */}
      <header
        className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="container flex h-14 items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            height={36}
            width={160}
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="text-muted-foreground text-sm hidden sm:block">
            | Pré-Cadastro
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-6 md:py-10">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Garanta sua{' '}
            <span className="text-primary">Internet Fibra</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto">
            Preencha o formulário e nossa equipe entrará em contato para agendar sua instalação.
          </p>
        </div>

        <MultiStepForm />
      </section>

      {/* Footer — safe area bottom para home indicator */}
      <footer
        className="border-t py-5 text-center text-sm text-muted-foreground"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <p>© {new Date().getFullYear()} ConectFlow — Todos os direitos reservados</p>
      </footer>
    </main>
  )
}
