"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shirt, Layers, LogOut, Settings, LayoutDashboard } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
    } else {
      fetchUserStatus(token);
    }
  }, [router]);

  const fetchUserStatus = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.is_staff || data.is_superuser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:flex flex-col">
      {/* Top Navigation for Desktop */}
      <nav className="hidden md:flex items-center justify-between p-4 glass sticky top-0 z-50">
        <div className="flex items-center">
          <svg width="130" height="40" viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            <path d="M20 10 C20 4, 28 4, 28 10 C28 15, 20 18, 20 24 L20 26" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="20" cy="29" r="2" fill="#a855f7" />
            <path d="M20 15 L6 30 C3 33, 6 36, 10 36 L30 36 C34 36, 37 33, 34 30 L20 15 Z" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(168, 85, 247, 0.1)"/>
            <text x="44" y="29" fill="white" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="24" letterSpacing="2">LOOM</text>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="flex space-x-6">
          <Link 
            href="/dashboard" 
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${pathname === "/dashboard" ? "bg-white/10 text-purple-300" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <LayoutDashboard size={20} />
            <span>Início</span>
          </Link>
          <Link 
            href="/closet" 
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${pathname === "/closet" ? "bg-white/10 text-purple-300" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Shirt size={20} />
            <span>O Closet</span>
          </Link>
          <Link 
            href="/outfits" 
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${pathname === "/outfits" ? "bg-white/10 text-purple-300" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Layers size={20} />
            <span>Combinações</span>
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${pathname === "/admin" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-purple-300 hover:bg-white/5"}`}
            >
              <Settings size={20} />
              <span>Painel Admin</span>
            </Link>
          )}
        </div>

        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-2 transition-colors rounded-full hover:bg-red-400/10">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass flex justify-around p-4 z-50 pb-safe">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center space-y-1 transition-all ${pathname === "/dashboard" ? "text-purple-400 scale-110" : "text-gray-400"}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs font-medium">Início</span>
        </Link>
        <Link 
          href="/closet" 
          className={`flex flex-col items-center space-y-1 transition-all ${pathname === "/closet" ? "text-purple-400 scale-110" : "text-gray-400"}`}
        >
          <Shirt size={24} />
          <span className="text-xs font-medium">Closet</span>
        </Link>
        <Link 
          href="/outfits" 
          className={`flex flex-col items-center space-y-1 transition-all ${pathname === "/outfits" ? "text-purple-400 scale-110" : "text-gray-400"}`}
        >
          <Layers size={24} />
          <span className="text-xs font-medium">Combinações</span>
        </Link>
        {isAdmin && (
          <Link 
            href="/admin" 
            className={`flex flex-col items-center space-y-1 transition-all ${pathname === "/admin" ? "text-purple-400 scale-110" : "text-gray-400"}`}
          >
            <Settings size={24} />
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}
        <button 
          onClick={handleLogout} 
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-xs font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}
