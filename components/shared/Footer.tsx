export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16 bg-transparent">
      <div className="container mx-auto px-6 py-8 text-xs text-[#4d4d4d] tracking-wide">
        <p className="text-[13px]">Sistema de agendamento confidencial e minimalista para psicólogos</p>
        <p className="mt-2 text-[11px]">© {new Date().getFullYear()} CalenderPsico. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
