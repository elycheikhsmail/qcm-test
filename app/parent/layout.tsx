import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["eleve", "parent"].includes(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-4">
        <span className="font-bold text-amber-800 text-sm">Vue Parent — Lecture seule</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm font-medium text-amber-900">
            {user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user.email}
          </span>
          <Link href="/dashboard" className="text-sm text-amber-700 hover:text-amber-900 font-medium">
            → Mode élève
          </Link>
        </div>
      </nav>
      <main className="p-6 max-w-2xl">{children}</main>
    </div>
  );
}
