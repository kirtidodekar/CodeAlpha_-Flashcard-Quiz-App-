import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
            <Loader2 className="relative h-10 w-10 animate-spin text-indigo-500" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading FlashMaster…</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Premium Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 md:px-8 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="rounded-lg hover:bg-muted/80 transition-colors" />
              <div className="hidden h-5 w-px bg-border sm:block" />
              <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-muted/80">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-background" />
              </Button>
              <div className="h-5 w-px bg-border" />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
