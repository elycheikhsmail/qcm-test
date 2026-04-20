export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-bold">QCM Système</h1>
        <p className="text-gray-600">
          Plateforme de quiz pédagogique alignée sur le programme mauritanien.
        </p>
        <p className="text-sm text-gray-500">
          Sprint 1 — setup en cours. L'endpoint de santé est{" "}
          <a className="underline" href="/api/health">
            /api/health
          </a>
          .
        </p>
      </div>
    </main>
  );
}
