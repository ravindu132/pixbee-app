"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [clientStats, setClientStats] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // 1. Get all PAID work
      const { data } = await supabase
        .from('work_logs')
        .select(`cost, clients(name)`)
        .eq('status', 'PAID');

      if (data) {
        // Calculate Total
        const total = data.reduce((sum, item) => sum + item.cost, 0);
        setTotalIncome(total);

        // Calculate Income per Client
        const stats: any = {};
        data.forEach((item: any) => {
          const name = item.clients?.name || 'Unknown';
          stats[name] = (stats[name] || 0) + item.cost;
        });

        // Convert to array for charts
        const sortedStats = Object.keys(stats)
          .map(name => ({ name, value: stats[name] }))
          .sort((a, b) => b.value - a.value); // Highest first

        setClientStats(sortedStats);
      }
      setLoading(false);
    };
    getData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="p-3 bg-white border rounded-full hover:shadow-md transition">←</button>
          <h1 className="text-4xl font-black">Revenue Analytics</h1>
        </div>

        {/* Big Stat Card */}
        <div className="bg-black text-yellow-400 p-10 rounded-3xl shadow-xl mb-10 flex flex-col items-center justify-center">
            <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Total Lifetime Earnings</p>
            <h2 className="text-6xl font-black">LKR {totalIncome.toLocaleString()}</h2>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Chart 1: Top Clients Bar Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <h3 className="font-bold text-xl mb-6">🏆 Top Clients</h3>
            <div className="space-y-4">
              {clientStats.map((stat, index) => (
                <div key={stat.name} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-bold truncate text-gray-600">{stat.name}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-yellow-400 rounded-full" 
                      style={{ width: `${(stat.value / totalIncome) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-24 text-right font-bold text-sm">LKR {stat.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* List View: Recent Income Breakdown */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <h3 className="font-bold text-xl mb-6">📋 Income Breakdown</h3>
            <div className="overflow-y-auto max-h-[300px] space-y-2 pr-2">
               {clientStats.map((stat) => (
                 <div key={stat.name} className="flex justify-between p-4 border-b hover:bg-gray-50 transition">
                   <span className="font-medium">{stat.name}</span>
                   <span className="font-bold text-green-600">+ {stat.value.toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}