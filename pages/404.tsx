import Link from 'next/link';
import { ReactElement } from 'react';

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600 text-center">
        La página que buscas no existe o fue movida.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

/**
 * ⛔️ Sin layout
 * Evita PagesLayout o AppLayout
 */
Custom404.getLayout = function getLayout(page: ReactElement) {
  return page;
};
