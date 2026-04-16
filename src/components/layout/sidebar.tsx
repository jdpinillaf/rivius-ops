"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  MessageCircle,
  MessagesSquare,
  MessageSquare,
  Send,
  Star,
  Target,
  LifeBuoy,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/merchants", label: "Merchants", icon: Store },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/requests", label: "Requests", icon: Send },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/attribution", label: "Attribution", icon: Target },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/messages", label: "Mensajes", icon: MessageSquare },
];

function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-slate-950 md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            R
          </div>
          <span className="text-sm font-semibold text-white">Rivius Ops</span>
        </div>
        <div className="mt-4 flex-1">
          <NavLinks />
        </div>
        <div className="space-y-2 border-t border-white/10 px-3 py-3">
          <LogoutButton />
          <p className="px-3 text-xs text-slate-500">Internal Dashboard</p>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-slate-950 px-4 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="text-white" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-56 bg-slate-950 p-0 text-white">
            <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                R
              </div>
              <span className="text-sm font-semibold text-white">Rivius Ops</span>
            </div>
            <div className="mt-4">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-white">Rivius Ops</span>
      </div>
    </>
  );
}
