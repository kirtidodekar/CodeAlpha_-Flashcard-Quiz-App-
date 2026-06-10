import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Library, Brain, LineChart, User, LogOut, Sparkles, ChevronLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Dashboard",   url: "/dashboard"             as const, icon: LayoutDashboard, exact: true, color: "#6366F1" },
  { title: "Flashcards",  url: "/dashboard/flashcards"  as const, icon: Library,         color: "#8B5CF6" },
  { title: "Study Mode",  url: "/dashboard/study"       as const, icon: Brain,           color: "#06B6D4" },
  { title: "Quiz Mode",   url: "/dashboard/quiz"        as const, icon: Sparkles,        color: "#F59E0B" },
  { title: "Progress",    url: "/dashboard/progress"    as const, icon: LineChart,        color: "#22C55E" },
  { title: "Profile",     url: "/dashboard/profile"     as const, icon: User,            color: "#EC4899" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const displayName = profileQ.data?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={{
        background: "linear-gradient(180deg, #1e1b4b 0%, #0f0d1f 100%)",
      }}
    >
      {/* Logo */}
      <SidebarHeader className="border-b border-white/10 px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-3 px-1">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Brain className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-0 blur-sm transition-opacity group-hover:opacity-60" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">
              Flash<span className="text-indigo-400">Master</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-indigo-300/60 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
            {collapsed ? "—" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = item.exact ? path === item.url : path.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={[
                        "rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] border border-indigo-500/30"
                          : "text-indigo-200/70 hover:bg-white/5 hover:text-white border border-transparent",
                      ].join(" ")}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <div
                          className="grid h-7 w-7 place-items-center rounded-lg transition-all duration-200"
                          style={{
                            background: active
                              ? `linear-gradient(135deg, ${item.color}, ${item.color}99)`
                              : `${item.color}20`,
                            boxShadow: active ? `0 4px 12px ${item.color}40` : "none",
                          }}
                        >
                          <item.icon
                            className="h-3.5 w-3.5"
                            style={{ color: active ? "#fff" : item.color }}
                          />
                        </div>
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3 mb-2 border border-white/5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-indigo-300/60 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="rounded-xl text-indigo-200/70 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200 px-3 py-2.5"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
