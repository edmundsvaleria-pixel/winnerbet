"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Dices, 
  Goal, 
  Home, 
  Receipt, 
  ShieldCheck, 
  Wallet, 
  LifeBuoy, 
  History, 
  Settings, 
  Trophy, 
  Users, 
  DollarSign, 
  Gamepad2, 
  Gift,
  FileText,
  Shield,
  Scale
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sports: NavItem[] = [
  { href: "/sports/football", label: "Football", icon: Goal },
  { href: "/virtuals", label: "Virtual Sports", icon: Gamepad2 },
];

const account: NavItem[] = [
  { href: "/jackpot", label: "Jackpot", icon: Trophy },
  { href: "/cashout", label: "Cash Out", icon: DollarSign },
  { href: "/promotions", label: "Promotions", icon: Gift },
  { href: "/my-bets", label: "My Bets", icon: Receipt },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/wallet/history", label: "History", icon: History },
  { href: "/profile/referrals", label: "Refer & Earn", icon: Users },
  { href: "/profile/kyc", label: "Verify ID", icon: ShieldCheck },
  { href: "/profile/settings", label: "Settings", icon: Settings },
];

const legal: NavItem[] = [
  { href: "/terms", label: "Terms & Conditions", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/responsible-gaming", label: "Responsible Gaming", icon: Scale },
];

const support: NavItem[] = [
  { href: "/support", label: "Help & Support", icon: LifeBuoy },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  function Item({ item }: { item: NavItem }) {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link 
        href={item.href} 
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active 
            ? "bg-wb-primary/15 text-wb-primary" 
            : "text-wb-muted hover:bg-wb-surface hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-60 flex-col border-r border-wb-border bg-wb-bg px-3 py-4 lg:flex">
      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Sports</p>
          <div className="space-y-1">
            {sports.map((s) => <Item key={s.href} item={s} />)}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Casino</p>
          <div className="space-y-1">
            <Item item={{ href: "/games", label: "Casino Games", icon: Dices }} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Account</p>
          <div className="space-y-1">
            {account.map((s) => <Item key={s.href} item={s} />)}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Support</p>
          <div className="space-y-1">
            {support.map((s) => <Item key={s.href} item={s} />)}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Legal</p>
          <div className="space-y-1">
            {legal.map((s) => <Item key={s.href} item={s} />)}
          </div>
        </div>

        {role === "admin" && (
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-wb-muted">Admin</p>
            <div className="space-y-1">
              <Item item={{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }} />
            </div>
          </div>
        )}
      </nav>

      <Link href="/" className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-wb-muted transition hover:text-white">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
    </aside>
  );
}