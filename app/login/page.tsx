"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
      });

      if (signUpError) {
        setMessage("Error: " + signUpError.message);
      } else {
        setMessage("Account created! Logging you in...");
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border text-black">
        <h1 className="text-2xl font-bold mb-6 text-center">PixBee Login</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter email"
            className="p-3 border rounded w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter password"
            className="p-3 border rounded w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white p-3 rounded hover:bg-gray-800 disabled:opacity-50 font-bold"
          >
            {loading ? 'Processing...' : 'Login / Sign Up'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}