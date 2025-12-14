"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) await supabase.auth.signUp({ email, password }); // Auto signup if fails
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Animated Logo Entry */}
        <div className="mb-10 animate-[bounce_2s_infinite]">
          <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
        </div>
        
        <h1 className="text-2xl font-black text-center mb-1">Welcome Back</h1>
        <p className="text-gray-400 text-sm mb-8">Login to manage your hive</p>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border focus-within:border-yellow-400 transition">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent outline-none font-semibold" required />
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border focus-within:border-yellow-400 transition">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent outline-none font-semibold" required />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 font-bold p-5 rounded-xl shadow-lg hover:scale-[1.02] transition flex justify-center mt-4">
            {loading ? <div className="loader"></div> : 'Enter Dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}