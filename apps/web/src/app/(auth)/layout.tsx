import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-[#08090C] text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="lg" markOnly />
          <p className="mt-3 text-sm font-bold text-white tracking-tight">Creative Drive</p>
        </div>
        {children}
      </div>
    </main>
  );
}
