"use client";
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  if (pathname === '/login' || pathname?.includes('/print')) return null;

  const isActive = (path: string) => 
    pathname === path 
      ? "bg-black text-white shadow-md" 
      : "text-gray-600 hover:bg-white/40 hover:text-black";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center z-50 pt-6 px-4 pointer-events-none">
      
      <nav className="pointer-events-auto rounded-full pl-3 pr-2 py-2 flex items-center gap-1 md:gap-4 animate-slide-down max-w-3xl w-full justify-between 
        bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5 
        ring-1 ring-white/50 relative">
        
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

        {/* NAVIGATION PILLS */}
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

        {/* 🟢 MORPHING MENU CONTAINER */}
        <div className="relative" ref={menuRef}>
          
          {/* Invisible Placeholder */}
          <div className="invisible px-4 py-2 flex items-center gap-2">
             <div className="w-5 h-5"></div>
             <span className="text-xs font-bold hidden md:block">Profile</span>
          </div>

          {/* 🟢 EXPANDING OBSIDIAN GLASS MENU */}
          <div 
            className={`absolute top-0 right-0 z-50 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.3,1.5,0.4,1)] origin-top-right border
              ${isMenuOpen 
                // 🟢 UPDATED: Darker Black (80%) + Same XL Blur as Navbar + White Border
                ? 'w-72 h-auto bg-black/80 backdrop-blur-xl rounded-[2rem] border-white/10 ring-1 ring-white/5 shadow-2xl' 
                : 'w-full h-full bg-transparent hover:bg-black/5 rounded-full border-transparent ring-0'
              }`}
          >
            {/* Header / Trigger Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`w-full flex items-center gap-2 px-4 py-2 transition-colors duration-300
                ${isMenuOpen ? 'bg-white/5 text-white pt-3 pb-3' : 'text-gray-600'}`}
            >
               <div className={`p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-white/10' : ''}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
               </div>
               <span className="text-xs font-bold text-left flex-1 tracking-wide">
                 {isMenuOpen ? 'My Account' : 'Profile'}
               </span>
               {isMenuOpen && (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-gray-500 animate-fade-in"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
               )}
            </button>

            {/* Expanded List Items */}
            <div className={`p-2 space-y-1 transition-opacity duration-200 delay-75 ${isMenuOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
               
               <button 
                 onClick={() => { router.push('/settings'); setIsMenuOpen(false); }}
                 className="flex items-center gap-4 w-full px-4 py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-2xl transition group"
               >
                 <div className="bg-white/5 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 p-2.5 rounded-xl transition-colors shadow-inner">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5M12 6.75h1.5m-3 3h1.5m1.5 0h1.5m-3 3h1.5m1.5 0h1.5m-3 3h1.5m1.5 0h1.5M9 15.75h1.5m1.5 0h1.5M9 18.75h1.5m1.5 0h1.5" /></svg>
                 </div>
                 <div className="flex flex-col text-left">
                    <span>Business Settings</span>
                    <span className="text-[9px] font-normal text-gray-500">Edit invoice details</span>
                 </div>
               </button>

               <button 
                 onClick={() => { router.push('/settings'); setIsMenuOpen(false); }}
                 className="flex items-center gap-4 w-full px-4 py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-2xl transition group"
               >
                 <div className="bg-white/5 text-green-400 group-hover:bg-green-500/20 group-hover:text-green-300 p-2.5 rounded-xl transition-colors shadow-inner">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                 </div>
                 <div className="flex flex-col text-left">
                    <span>Bank Accounts</span>
                    <span className="text-[9px] font-normal text-gray-500">Manage payment methods</span>
                 </div>
               </button>

               <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

               <button 
                 onClick={handleSignOut}
                 className="flex items-center gap-4 w-full px-4 py-3 text-xs font-bold text-red-400 hover:text-red-200 hover:bg-red-500/20 rounded-2xl transition group"
               >
                 <div className="bg-white/5 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 p-2.5 rounded-xl transition-colors shadow-inner">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                 </div>
                 <span>Sign Out</span>
               </button>
            </div>
          </div>
        </div>

      </nav>
    </div>
  );
}