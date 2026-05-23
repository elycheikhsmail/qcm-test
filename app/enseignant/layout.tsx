import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function EnseignantLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !["enseignant", "admin_tech"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-gray-900 text-sm">Espace Enseignant</span>
        <Link href="/enseignant/classes" className="text-sm text-gray-600 hover:text-gray-900">Mes classes</Link>
        <Link href="/enseignant/tests" className="text-sm text-gray-600 hover:text-gray-900">Tests</Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user.email}
          </span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </nav>
      <div>{children}</div>
    </div>
  );
}
