import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StudentNav } from "@/components/eleve/StudentNav";

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <StudentNav user={user} />
      {children}
    </>
  );
}
