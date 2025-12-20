"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [paidHistory, setPaidHistory] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    // 1. Get Pending
    const { data: unbilled } = await supabase.from('work_logs').select(`*, clients(name, id)`).eq('status', 'UNBILLED').order('date', { ascending: false });

    // Group by Client
    const groupedInvoices: any = {};
    if (unbilled) {
      unbilled.forEach(item => {
        if (!item.clients) return; 
        const clientId = item.client_id;
        if (!groupedInvoices[clientId]) {
          groupedInvoices[clientId] = { client: item.clients, items: [], total: 0, count: 0 };
        }
        groupedInvoices[clientId].items.push(item);
        groupedInvoices[clientId].total += item.cost;
        groupedInvoices[clientId].count += 1;
      });
    }
    setPendingInvoices(Object.values(groupedInvoices));

    // 2. Get Paid History
    const { data: paid } = await supabase.from('work_logs').select(`*, clients(name)`).eq('status', 'PAID').order('date', { ascending: false }).limit(20);
    if (paid) setPaidHistory(paid);
    setLoading(false);
  };

  const openInvoice = (items: any[]) => {
    const ids = items.map(i => i.id).join(',');
    router.push(`/invoice/print?ids=${ids}`);
  };

  const openReceipt = (id: string) => {
    router.push(`/invoice/print?ids=${id}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto animate-fade-in">
        
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Bills & Invoices</h1>
          <p className="text-gray-500 font-medium mt-1">Manage pending payments and history.</p>
        </div>

        {/* PENDING SECTION */}
        <div className="mb-12">
           <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 pl-2">Pending Invoices</h2>
           {pendingInvoices.length === 0 ? (
             <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center text-gray-400">
               <p className="text-sm">All caught up! No unpaid invoices.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {pendingInvoices.map((inv: any) => (
                 <div key={inv.client.id} className="bg-white border border-yellow-400 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.01] transition">
                   <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wide">
                     Action Needed
                   </div>
                   
                   <div className="mb-6">
                     <h3 className="font-bold text-xl">{inv.client.name}</h3>
                     <p className="text-xs text-gray-500 font-bold">{inv.count} items unbilled</p>
                   </div>

                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Total Due</p>
                       <p className="font-black text-2xl">LKR {inv.total.toLocaleString()}</p>
                     </div>
                     <button 
                       onClick={() => openInvoice(inv.items)}
                       className="bg-black text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-800 transition"
                     >
                       <span>View Bill</span>
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* PAID HISTORY SECTION */}
        <div>
           <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 pl-2">Paid History</h2>
           <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
              {paidHistory.length === 0 ? (
                 <div className="p-10 text-center text-gray-400 text-sm">No payment history yet.</div>
              ) : (
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b">
                     <tr>
                       <th className="p-5 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                       <th className="p-5 text-[10px] font-bold text-gray-400 uppercase">Client</th>
                       <th className="p-5 text-[10px] font-bold text-gray-400 uppercase">Description</th>
                       <th className="p-5 text-[10px] font-bold text-gray-400 uppercase text-right">Amount</th>
                       <th className="p-5 text-[10px] font-bold text-gray-400 uppercase text-center">Receipt</th>
                     </tr>
                   </thead>
                   <tbody>
                     {paidHistory.map((item) => (
                       <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                         <td className="p-5 text-xs font-bold text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                         <td className="p-5 text-sm font-bold whitespace-nowrap">{item.clients?.name}</td>
                         <td className="p-5 text-xs text-gray-600 truncate max-w-[150px]">{item.description}</td>
                         <td className="p-5 text-sm font-bold text-green-600 text-right whitespace-nowrap">LKR {item.cost.toLocaleString()}</td>
                         <td className="p-5 text-center">
                           <button 
                             onClick={() => openReceipt(item.id)}
                             className="text-[10px] font-bold bg-gray-100 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition whitespace-nowrap"
                           >
                             View
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}