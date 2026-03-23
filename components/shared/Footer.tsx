import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16 bg-transparent">
      <div className="container mx-auto px-6 py-8 text-xs text-[#4d4d4d] tracking-wide">
        <p className="text-[13px]">Sistema de agendamento confidencial e minimalista para psicólogos</p>
        
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px]">
            © {new Date().getFullYear()} CalenderPsico. Todos os direitos reservados.
          </p>
          <Link 
            href="/privacidade" 
            className="text-[11px] hover:text-[#C2183A] transition"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}