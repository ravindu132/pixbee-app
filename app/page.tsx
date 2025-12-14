"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);

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

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans flex flex-col">
      
      {/* Navbar */}
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

      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Manage your<br/>Creative Empire.</h1>
          <p className="text-gray-400 text-lg">Welcome back. Here is what's happening today.</p>
        </div>

        {/* Action Grid - UNIFORM STYLE (All Black & Yellow) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* 1. New Job */}
          <button onClick={() => router.push('/work')} className="group bg-black text-white h-48 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 hover:scale-[1.02] hover:shadow-yellow-400/20 transition relative overflow-hidden">
            <div className="bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center group-hover:rotate-90 transition duration-300 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-wide">Place New Job</span>
          </button>

          {/* 2. Revenue */}
          <button onClick={() => router.push('/revenue')} className="group bg-black text-white h-48 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 hover:scale-[1.02] hover:shadow-yellow-400/20 transition relative overflow-hidden">
            <div className="bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M6 16.5v-2.25A2.25 2.25 0 0 1 8.25 12h2.25M8.25 12v4.5m2.25-4.5v4.5m0-4.5h2.25m-2.25 4.5h2.25m0 0h2.25m0-2.25v2.25m0 0h2.25m0-2.25v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v11.25" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-wide">Revenue</span>
          </button>

          {/* 3. Clients */}
          <button onClick={() => router.push('/clients')} className="group bg-black text-white h-48 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 hover:scale-[1.02] hover:shadow-yellow-400/20 transition relative overflow-hidden">
            <div className="bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center group-hover:translate-x-1 transition duration-300 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-wide">Client List</span>
          </button>

        </div>

        {/* Upcoming Section (New Styling) */}
        <div className="flex items-center gap-2 mb-6 text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <h2 className="text-2xl font-bold">Upcoming Deadlines</h2>
        </div>

        {deliveries.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 flex flex-col items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 opacity-50">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
             </svg>
             <p>No upcoming deadlines. Enjoy your free time!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition flex justify-between items-center group">
                <div className="flex gap-4 items-center">
                  {/* Clean Icon Badge */}
                  <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 border group-hover:border-yellow-400 group-hover:bg-yellow-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg group-hover:text-blue-600 transition">{item.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.clients?.name}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-bold text-gray-900">LKR {item.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Date Tag */}
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                   </svg>
                   <p className="font-bold text-xs">{new Date(item.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}