import { AuthForm } from "@/components/ui/premium-auth";

export default function RegisterPage() {
  return (
    <div className="rounded-3xl border border-line bg-card shadow-[0_8px_32px_-4px_rgba(20,25,40,0.08)]">
      <AuthForm initialMode="signup" />
    </div>
  );
}
