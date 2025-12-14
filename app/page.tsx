"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data: work } = await supabase
      .from('work_logs')
      .select(`*, clients(name)`)
      .eq('status', 'UNBILLED')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });
    
    if (work) setDeliveries(work);
    setLoading(false);
  };

  const quickAddClient = async () => {
    if (!newClientName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('clients').insert([{ name: newClientName, user_id: user.id }]);
      setNewClientName(''); setShowAddClient(false);
      alert("Client Added!");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans flex flex-col">
      
      {/* 1. Navbar */}
      <nav className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PixBee" className="h-8 w-auto" />
          <span className="font-black text-xl tracking-tight hidden md:block">PixBee</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/invoice')} className="text-sm font-bold text-gray-500 hover:text-black transition">Invoices</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-sm font-bold text-red-500 hover:text-red-700 transition">Sign Out</button>
        </div>
      </nav>

      {/* 2. Main Content (Full Width / Minimal) */}
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Manage your<br/>Creative Empire.</h1>
          <p className="text-gray-400 text-lg">Welcome back. Here is what's happening today.</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* New Work Button */}
          <button 
            onClick={() => router.push('/work')}
            className="group bg-black text-white h-48 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-3 hover:scale-[1.02] transition"
          >
            <div className="bg-yellow-400 text-black w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold group-hover:rotate-90 transition">+</div>
            <span className="font-bold text-lg">Place New Job</span>
          </button>

          {/* Revenue Button (Replaces Income Text) */}
          <button 
            onClick={() => router.push('/revenue')}
            className="bg-white border h-48 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-yellow-400 transition"
          >
            <span className="text-4xl">📊</span>
            <span className="font-bold text-lg">Revenue Analytics</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">View Charts</span>
          </button>

          {/* Clients Button */}
          <button 
            onClick={() => router.push('/clients')}
            className="bg-white border h-48 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-black transition"
          >
            <span className="text-4xl">👥</span>
            <span className="font-bold text-lg">Client List</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Manage Profiles</span>
          </button>
        </div>

        {/* Upcoming Section */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">📅 Upcoming Deadlines</h2>
          <button onClick={() => setShowAddClient(true)} className="text-sm font-bold text-blue-600 hover:underline">+ Quick Add Client</button>
        </div>

        {deliveries.length === 0 ? (
          <div className="bg-white border border-dashed rounded-3xl p-12 text-center text-gray-400">
            <p>No upcoming deadlines. Enjoy your free time! 🐝</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border hover:border-black transition flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-blue-600 transition">{item.description}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{item.clients?.name}</span>
                    <span className="text-xs text-gray-400">LKR {item.cost.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg text-sm">{new Date(item.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>© 2025 PixBee Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
            <a href="#" className="hover:text-black">Support</a>
          </div>
        </div>
      </footer>

      {/* Quick Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-2xl mb-6">Add New Client</h3>
            <input 
              autoFocus
              type="text" placeholder="Client Name (e.g. Wing Digital)" 
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-xl mb-6 outline-none focus:border-yellow-400 text-lg"
              value={newClientName} onChange={e => setNewClientName(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddClient(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={quickAddClient} className="flex-1 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition">Save Client</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}