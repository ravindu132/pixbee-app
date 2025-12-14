"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Lists
  const [urgentDeliveries, setUrgentDeliveries] = useState<any[]>([]);
  const [fillGapDeliveries, setFillGapDeliveries] = useState<any[]>([]);

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
    
    if (work) {
      const now = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(now.getDate() + 2); 

      // 1. URGENT: Due in <= 2 Days
      const urgent = work.filter(item => new Date(item.due_date) <= twoDaysFromNow);
      
      // 2. OTHERS: Due > 2 Days
      const others = work.filter(item => new Date(item.due_date) > twoDaysFromNow);

      // 3. FILL THE GAP Logic (Max 6 items total view)
      const slotsLeft = Math.max(0, 6 - urgent.length);
      const gapFillers = others.slice(0, slotsLeft);

      setUrgentDeliveries(urgent);
      setFillGapDeliveries(gapFillers);
    }
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans flex flex-col">
      
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="PixBee" className="h-6 w-auto" />
          <span className="font-black text-lg tracking-tight hidden md:block">PixBee</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/invoice')} className="text-xs font-bold text-gray-500 hover:text-black transition">Invoices</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-red-500 hover:text-red-700 transition">Sign Out</button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col">
        
        {/* SECTION 1: URGENT JOBS (Top Priority) */}
        {urgentDeliveries.length > 0 && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-pulse"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /></svg>
              <h2 className="text-sm font-black uppercase tracking-wider">Urgent Attention</h2>
            </div>
            
            <div className="space-y-2">
              {urgentDeliveries.map((item) => (
                <div key={item.id} className="bg-red-50 border border-red-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                  <div className="flex gap-3 items-center overflow-hidden">
                    <div className="h-8 w-8 min-w-[32px] bg-white rounded-full flex items-center justify-center text-red-500 border border-red-100">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-red-900 truncate">{item.description}</h4>
                      <p className="text-[10px] font-bold text-red-400 uppercase">{item.clients?.name}</p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap pl-2">
                     <p className="font-bold text-red-600 text-xs">Due Soon</p>
                     <p className="text-[10px] font-bold text-red-400">{new Date(item.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: MAIN BUTTONS (Middle) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* New Job */}
          <button onClick={() => router.push('/work')} className="bg-black text-white h-24 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition">
            <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wide">New Job</span>
          </button>

          {/* Revenue */}
          <button onClick={() => router.push('/revenue')} className="bg-black text-white h-24 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition">
            <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M6 16.5v-2.25A2.25 2.25 0 0 1 8.25 12h2.25M8.25 12v4.5m2.25-4.5v4.5m0-4.5h2.25m-2.25 4.5h2.25m0 0h2.25m0-2.25v2.25m0 0h2.25m0-2.25v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v11.25" /></svg>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wide">Revenue</span>
          </button>

          {/* Clients */}
          <button onClick={() => router.push('/clients')} className="bg-black text-white h-24 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition">
            <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wide">Clients</span>
          </button>
        </div>

        {/* SECTION 3: UPCOMING / OTHERS (Bottom) */}
        {fillGapDeliveries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-gray-500">
              <h2 className="text-xs font-bold uppercase tracking-wider">Upcoming Tasks</h2>
            </div>
            
            <div className="space-y-2">
              {fillGapDeliveries.map((item) => (
                <div key={item.id} className="bg-white border p-3 rounded-xl flex justify-between items-center shadow-sm">
                  <div className="flex gap-3 items-center overflow-hidden">
                    <div className="h-8 w-8 min-w-[32px] bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-gray-800 truncate">{item.description}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{item.clients?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border whitespace-nowrap">
                      <p className="font-bold text-[10px] text-gray-600">{new Date(item.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {urgentDeliveries.length === 0 && fillGapDeliveries.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 flex flex-col items-center gap-3 mt-4">
             <p className="text-sm">No work scheduled. Enjoy! 🐝</p>
          </div>
        )}

      </main>
    </div>
  );
}