// components/shared/Footer.tsx
// Footer do site

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <h3 className="font-bold text-lg mb-4">CalenderPsico</h3>
            <p className="text-gray-400">
              Sistema de agendamento online para psicólogos. Fácil, seguro e confiável.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="/" className="hover:text-white transition">
                  Início
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-white transition">
                  Registrar
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Documentação
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contato</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@calenderpisco.com</li>
              <li>Telefone: (11) 99999-9999</li>
              <li>Endereço: São Paulo, Brasil</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex justify-between items-center">
          <p className="text-gray-400">
            © {currentYear} CalenderPsico. Todos os direitos reservados.
          </p>
          <div className="space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition">
              Privacidade
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
