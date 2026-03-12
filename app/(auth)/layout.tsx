// app/(auth)/layout.tsx
// Layout para páginas de autenticação

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-white rounded-lg shadow p-8">{children}</div>
    </div>
  );
}
