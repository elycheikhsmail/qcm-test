"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  first_name: string | null;
  last_name: string | null;
  email: string;
};

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord", match: "/dashboard" },
  { href: "/quiz/select", label: "Quiz", match: "/quiz" },
  { href: "/profil", label: "Mon profil", match: "/profil" },
];

export function StudentNav({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between h-14">
        <Link href="/dashboard" className="font-bold text-blue-600 text-base shrink-0">
          QCM
        </Link>

        <div className="flex items-center gap-0.5">
          {LINKS.map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(match)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-32">
            {user.first_name
              ? `${user.first_name} ${user.last_name ?? ""}`.trim()
              : user.email}
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
