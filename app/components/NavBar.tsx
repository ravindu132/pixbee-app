"use client";
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/login' || pathname?.includes('/print')) return null;

  const isActive = (path: string) => 
    pathname === path 
      ? "bg-black text-white shadow-md" 
      : "text-gray-600 hover:bg-white/40 hover:text-black";

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center z-50 pt-6 px-4 pointer-events-none">
      
      {/* 🟢 APPLE-STYLE LIQUID GLASS */}
      <nav className="pointer-events-auto rounded-full pl-3 pr-2 py-2 flex items-center gap-1 md:gap-4 animate-slide-down max-w-3xl w-full justify-between 
        bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5 
        transition-all duration-300 hover:bg-white/40 hover:shadow-xl hover:shadow-black/10 hover:border-white/60">
        
        {/* LOGO */}
        <div 
          className="flex items-center gap-2 pl-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <div className="group-hover:rotate-12 transition duration-500 ease-out">
             <img src="/logo.png" alt="PixBee" className="h-6 w-auto mix-blend-multiply opacity-80" />
          </div>
          <span className="font-black text-lg tracking-tight hidden sm:block text-gray-800/90 group-hover:tracking-wide transition-all">PixBee</span>
        </div>

        {/* NAVIGATION PILLS (Deeply inset) */}
        <div className="flex bg-white/20 p-1 rounded-full overflow-x-auto border border-white/10 shadow-inner">
          <button onClick={() => router.push('/')} className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${isActive('/')}`}>
            Home
          </button>
          <button onClick={() => router.push('/clients')} className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${isActive('/clients')}`}>
            Clients
          </button>
          <button onClick={() => router.push('/revenue')} className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${isActive('/revenue')}`}>
            Revenue
          </button>
          <button onClick={() => router.push('/invoice')} className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${isActive('/invoice')}`}>
            Bills
          </button>
        </div>

        {/* PROFILE BUTTON */}
        <button 
          onClick={() => router.push('/settings')} 
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-black hover:text-white text-gray-600 transition-all duration-300 group"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
           <span className="text-xs font-bold hidden md:block">Profile</span>
        </button>

      </nav>
    </div>
  );
}