import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppProviders } from "@/components/app-providers";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { TransferCenterLoader } from "@/components/transfer-center-loader";
import { SidebarProvider } from "@/components/sidebar-provider";
import { DashboardThemeProvider } from "@/components/dashboard-theme-provider";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rawName = session.user.name || session.user.email?.split("@")[0] || "User";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <AppProviders>
      <DashboardThemeProvider>
        <SidebarProvider>
          <DashboardShell>
            <Sidebar user={{ name: displayName, email: session.user.email ?? "" }} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header email={session.user.email ?? ""} name={displayName} />
              <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
          </DashboardShell>
          <TransferCenterLoader />
        </SidebarProvider>
      </DashboardThemeProvider>
    </AppProviders>
  );
}
