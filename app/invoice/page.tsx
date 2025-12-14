"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function InvoiceHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // Get all PAID work (History)
      const { data } = await supabase
        .from('work_logs')
        .select(`*, clients(name)`)
        .eq('status', 'PAID')
        .order('date', { ascending: false });

      if (data) setHistory(data);
      setLoading(false);
    };
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-black p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-3 bg-white border rounded-full hover:shadow-md transition">←</button>
          <h1 className="text-3xl font-bold">Invoice History</h1>
        </div>

        {loading ? <div className="loader"></div> : (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            {history.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No paid invoices yet.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Client</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Description</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 text-sm font-bold text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold">{item.clients?.name}</td>
                      <td className="p-4 text-sm text-gray-600">{item.description}</td>
                      <td className="p-4 font-bold text-green-600 text-right">LKR {item.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}