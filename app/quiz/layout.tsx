import { getCurrentUser } from "@/lib/auth";
import { StudentNav } from "@/components/eleve/StudentNav";

export default async function QuizLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      {user && <StudentNav user={user} />}
      {children}
    </>
  );
}
