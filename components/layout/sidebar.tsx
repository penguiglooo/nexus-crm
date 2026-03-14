"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Reminders", href: "/reminders", icon: Bell },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

function ContactCountBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500/30 font-mono text-sm font-bold text-emerald-500">
        {count}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Contacts</p>
        <p className="text-xs text-muted-foreground/60">
          {count === 1 ? "1 person" : `${count} people`}
        </p>
      </div>
    </div>
  );
}

function NavContent({
  onNavigate,
  contactCount,
}: {
  onNavigate?: () => void;
  contactCount: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-6 py-8">
        <h1 className="text-xl font-bold tracking-widest text-emerald-500">
          NEXUS
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Relationship Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Contact Count Badge */}
      <div className="border-t border-border/50 py-6">
        <ContactCountBadge count={contactCount} />
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setContactCount(count || 0));
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-border/50 bg-background md:block">
        <NavContent contactCount={contactCount} />
      </aside>

      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[260px] border-r border-border/50 bg-background p-0"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <NavContent
              onNavigate={() => setMobileOpen(false)}
              contactCount={contactCount}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
