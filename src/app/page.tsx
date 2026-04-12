import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SVACD
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Sistema de Verificación y Análisis de Contenido Digital
        </p>
        <p className="text-gray-500 mb-10">
          Analiza noticias, textos, URLs e imágenes con inteligencia artificial
          y obtén un índice de veracidad en segundos.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  )
}