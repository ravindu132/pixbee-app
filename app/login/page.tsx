"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// 🟢 INTERNAL COMPONENT: Floating Shapes (High Velocity)
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
       {/* Shape 1: Yellow - Bottom Left */}
       <div className="absolute bottom-[-10%] left-[10%] w-72 h-72 bg-yellow-400/30 rounded-full blur-[80px] animate-blob"></div>
       
       {/* Shape 2: Blue - Top Right */}
       <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] animate-blob animation-delay-2000"></div>
       
       {/* Shape 3: Pink - Center Left */}
       <div className="absolute top-[40%] left-[20%] w-56 h-56 bg-pink-500/30 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
       
       {/* Shape 4: Purple - Bottom Right */}
       <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-purple-500/30 rounded-full blur-[80px] animate-blob animation-delay-1000"></div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-white font-sans p-4">
      
      {/* 🟢 LAYER 1: GRID (Static) */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* 🟢 LAYER 2: ANIMATED SHAPES */}
      <FloatingShapes />

      {/* 🟢 LAYER 3: LOGIN CARD */}
      <div className="relative z-20 w-full max-w-4xl bg-white/70 backdrop-blur-3xl border border-white/50 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row animate-fade-in ring-1 ring-white/60">
        
        {/* LEFT SIDE: IMAGE */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-900 overflow-hidden group">
           <img 
             src="/login-bg.jpg" 
             alt="Studio Visual" 
             className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[3s] ease-in-out group-hover:scale-110"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-10">
              <div className="text-white relative z-10">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl inline-block mb-4 border border-white/20 shadow-lg">
                   <img src="/logo.png" alt="PixBee" className="h-6 w-auto mix-blend-multiply brightness-0 invert" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter leading-none mb-2">PixBee<br/>Creative OS.</h2>
                <p className="text-white/70 text-xs font-bold tracking-widest uppercase mt-2">v2.0 Prism Edition</p>
              </div>
           </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white/50 relative">
          <div className="mb-8">
             <h1 className="text-2xl font-black tracking-tight text-gray-900">Welcome Back</h1>
             <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">Sign in to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 text-xs font-bold text-red-600 bg-red-50/80 backdrop-blur-md rounded-2xl text-center border border-red-100 animate-pulse">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-3">Email</label>
              <input 
                type="email" 
                placeholder="designer@pixbee.com" 
                className="w-full bg-white/80 p-4 rounded-2xl outline-none font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm border border-gray-100 focus:border-blue-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-3">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-white/80 p-4 rounded-2xl outline-none font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm border border-gray-100 focus:border-blue-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-xs uppercase tracking-widest">Syncing...</span>
              ) : (
                <>
                  <span>Enter Studio</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-gray-400">&copy; {new Date().getFullYear()} PixBee.</p>
          </div>
        </div>
      </div>

      {/* 🟢 FAST ANIMATION SETTINGS */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -60px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        /* 🚀 Fast 7s duration for visible movement */
        .animate-blob {
          animation: blob 7s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}