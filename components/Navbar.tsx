"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Building2, UserCheck, Compass, Bot } from "lucide-react";
import { useState, useEffect } from "react";

interface UserSession {
  name: string;
  email: string;
  role: "entrepreneur" | "officer";
  sector: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

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
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-gov-navy text-white shadow-md border-b border-gov-gold/30">
      {/* Top Gov Tricolor Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20">
              <ShieldCheck className="w-6 h-6 text-gov-gold" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-wider flex items-center gap-2">
                ANUMATI <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">GOV PORTAL</span>
              </div>
              <p className="text-[10px] text-slate-300 tracking-tight">Single-Window Industrial Approvals & Licensing Platform</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white flex items-center justify-end gap-1.5">
                    {user.role === "officer" ? (
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-300 capitalize">
                    {user.role} &bull; <span className="text-amber-300 font-medium">{user.sector}</span> Sector
                  </p>
                </div>

                <Link
                  href={user.role === "officer" ? "/dashboard/officer" : "/dashboard/entrepreneur"}
                  className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition"
                >
                  Dashboard
                </Link>

                <Link
                  href="/chat"
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition flex items-center gap-1"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-400" /> Statutory AI
                </Link>

                <Link
                  href="/roadmap"
                  className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-slate-100 rounded-md transition flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5 text-gov-gold" /> Roadmap
                </Link>

                {user.role === "entrepreneur" && (
                  <Link
                    href="/profile"
                    className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" /> Profile
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-200 hover:text-white transition px-3 py-1.5"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-md shadow transition"
                >
                  Register Portal
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
