import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TurnoMedico"
              width={240}
              height={240}
              className="h-16 w-auto"
            />
          </Link>
          <nav className="flex gap-4 items-center">
            <Link
              href="/buscar"
              className="text-sm text-gray-600 hover:text-teal transition-colors"
            >
              Buscar medico
            </Link>
            <Link
              href="/login"
              className="text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-dark transition-colors"
            >
              Soy medico
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>TurnoMedico -- Tu turno medico, sin esperas</p>
          <p className="mt-1">Republica Dominicana</p>
          <p className="mt-3 text-gray-600 text-xs">
            TurnoMedico no es un centro medico ni ofrece servicios de salud. Es una plataforma tecnologica de gestion de turnos.
          </p>
        </div>
      </footer>
    </div>
  );
}
