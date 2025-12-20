"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data: logs } = await supabase.from('work_logs').select('*').order('date', { ascending: false });

    if (logs) {
      const total = logs.filter(l => l.status === 'PAID').reduce((sum, item) => sum + item.cost, 0);
      const pending = logs.filter(l => l.status === 'UNBILLED').reduce((sum, item) => sum + item.cost, 0);
      
      const currentMonth = new Date().getMonth();
      const thisMonth = logs
        .filter(l => l.status === 'PAID' && new Date(l.date).getMonth() === currentMonth)
        .reduce((sum, item) => sum + item.cost, 0);

      setStats({ total, thisMonth, pending });
      setHistory(logs.filter(l => l.status === 'PAID').slice(0, 10)); // Last 10 paid items
    }
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto animate-fade-in">

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Revenue</h1>
          <p className="text-gray-500 font-medium mt-1">Financial performance overview.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Total Earnings</p>
            <h2 className="text-3xl font-black">LKR {stats.total.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">This Month</p>
            <h2 className="text-3xl font-black text-green-600">+ {stats.thisMonth.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Pending Collection</p>
            <h2 className="text-3xl font-black text-yellow-500">LKR {stats.pending.toLocaleString()}</h2>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 pl-2">Recent Transactions</h3>
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No payment history available.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                  <th className="p-5 text-[10px] font-bold text-gray-400 uppercase">Description</th>
                  <th className="p-5 text-[10px] font-bold text-gray-400 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="p-5 text-xs font-bold text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-5 text-sm font-bold text-gray-900">{item.description}</td>
                    <td className="p-5 text-sm font-bold text-green-600 text-right">LKR {item.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}