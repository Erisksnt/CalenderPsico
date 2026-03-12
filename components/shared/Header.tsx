import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-2xl text-blue-600">CalenderPsico</Link>
        <div className="flex gap-4">
          <Link href="/agendar" className="text-gray-700 hover:text-blue-600">Agendar</Link>
          <Link href="/admin" className="text-gray-700 hover:text-blue-600">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
