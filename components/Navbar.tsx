"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck,
  LogOut,
  Building2,
  UserCheck,
  Compass,
  Bot,
  Layers,
  LayoutDashboard,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

interface UserSession {
  name: string;
  email: string;
  role: "entrepreneur" | "officer";
  sector: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  const dashboardHref =
    user?.role === "officer" ? "/dashboard/officer" : "/dashboard/entrepreneur";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-gov-navy text-white shadow-md border-b border-gov-gold/30">
      {/* Official Government Tricolor Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Portal Identity */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="p-2 bg-white/10 group-hover:bg-white/15 rounded-lg border border-white/20 transition">
              <ShieldCheck className="w-6 h-6 text-gov-gold" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg tracking-wide flex items-center gap-2">
                ANUMATI
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold tracking-wider">
                  GOV PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-300 hidden sm:block tracking-tight">
                Single-Window Industrial Clearances &amp; Compliance Gateway
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {user && (
              <Link
                href={dashboardHref}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive(dashboardHref)
                    ? "bg-white/20 text-white shadow-sm border border-white/30"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-300" />
                Dashboard
              </Link>
            )}

            <Link
              href="/roadmap"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive("/roadmap")
                  ? "bg-white/20 text-white shadow-sm border border-white/30"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-gov-gold" />
              Roadmap
            </Link>

            <Link
              href="/pre-scrutiny"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive("/pre-scrutiny")
                  ? "bg-white/20 text-white shadow-sm border border-white/30"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              CAD Pre-Scrutiny
            </Link>

            <Link
              href="/chat"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive("/chat")
                  ? "bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm"
                  : "text-amber-300 hover:text-amber-100 hover:bg-amber-500/10"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              Statutory AI
            </Link>

            {user?.role === "entrepreneur" && (
              <Link
                href="/profile"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive("/profile")
                    ? "bg-white/20 text-white shadow-sm border border-white/30"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Profile
              </Link>
            )}
          </nav>

          {/* Desktop Right Side (Auth / User Info) */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    {user.role === "officer" ? (
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span className="truncate max-w-[130px]">{user.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 capitalize flex items-center justify-end gap-1">
                    <span className="font-semibold text-amber-300">{user.sector}</span>
                    <span>&bull;</span>
                    <span>{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition border border-transparent hover:border-white/10"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-200 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  Register Unit
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {user.sector}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* User Profile Card (if logged in) */}
          {user ? (
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gov-navy border border-gov-gold/30 flex items-center justify-center text-gov-gold">
                  {user.role === "officer" ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user.role} &bull; <span className="text-amber-400">{user.sector}</span> Sector
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-xs font-semibold rounded-md flex items-center gap-1 transition"
              >
                <LogOut className="w-3 h-3" /> Exit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
              <Link
                href="/login"
                className="py-2 text-center text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="py-2 text-center text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition"
              >
                Register Unit
              </Link>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="space-y-1">
            {user && (
              <Link
                href={dashboardHref}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive(dashboardHref)
                    ? "bg-gov-navy text-white border border-gov-gold/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-sky-400" />
                <span>Dashboard Overview</span>
              </Link>
            )}

            <Link
              href="/roadmap"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                isActive("/roadmap")
                  ? "bg-gov-navy text-white border border-gov-gold/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4 text-gov-gold" />
              <span>Statutory Clearance Roadmap</span>
            </Link>

            <Link
              href="/pre-scrutiny"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                isActive("/pre-scrutiny")
                  ? "bg-gov-navy text-white border border-gov-gold/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>CAD Setback Pre-Scrutiny</span>
            </Link>

            <Link
              href="/chat"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                isActive("/chat")
                  ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                  : "text-amber-300 hover:bg-amber-500/10"
              }`}
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Statutory AI Regulatory Assistant</span>
            </Link>

            {user?.role === "entrepreneur" && (
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive("/profile")
                    ? "bg-gov-navy text-white border border-gov-gold/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Company / Industrial Profile</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
