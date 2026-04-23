import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function DirecteurLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !["directeur", "admin_tech"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-gray-900 text-sm">Espace Directeur</span>
        <Link href="/directeur/classes" className="text-sm text-gray-600 hover:text-gray-900">Mes classes</Link>
        <div className="ml-auto text-xs text-gray-400">{user.first_name} {user.last_name}</div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
