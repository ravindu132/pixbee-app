"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function ClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [client, setClient] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Work Form
  const [task, setTask] = useState('');
  const [cost, setCost] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (clientId: string) => {
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (clientData) setClient(clientData);

    const { data: logData } = await supabase.from('work_logs').select('*').eq('client_id', clientId).order('date', { ascending: false });
    if (logData) setLogs(logData);
    setLoading(false);
  };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !cost) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user && id) {
      await supabase.from('work_logs').insert([{
        user_id: user.id, client_id: id, description: task, cost: parseFloat(cost),
        date: new Date().toISOString(), due_date: dueDate ? new Date(dueDate).toISOString() : null, status: 'UNBILLED'
      }]);
      setTask(''); setCost(''); setDueDate(''); fetchData(id);
    }
  };

  const addMonthlyFee = async () => {
    if (!client.package_price) return alert("Error: No package price set.");
    const { data: { user } } = await supabase.auth.getUser();
    const monthName = new Date().toLocaleString('default', { month: 'long' });
    if (user && id) {
      await supabase.from('work_logs').insert([{
        user_id: user.id, client_id: id, description: `Monthly Retainer - ${monthName}`,
        cost: client.package_price, date: new Date().toISOString(), due_date: new Date().toISOString(), status: 'UNBILLED'
      }]);
      fetchData(id);
    }
  };

  const markPaid = async (logId: string) => {
    await supabase.from('work_logs').update({ status: 'PAID' }).eq('id', logId);
    if (id) fetchData(id);
  };

  const deleteLog = async (logId: string) => {
    if (confirm("Delete this job from history?")) {
      await supabase.from('work_logs').delete().eq('id', logId);
      if (id) fetchData(id);
    }
  };

  const deleteClient = async () => {
    if (confirm("Delete this client?")) {
      await supabase.from('clients').delete().eq('id', id);
      router.push('/clients');
    }
  };

  const unbilledTotal = logs.filter(l => l.status === 'UNBILLED').reduce((sum, item) => sum + item.cost, 0);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!client) return <div className="p-10">Client not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border rounded-full hover:shadow-md transition">←</button>
            <div>
              <h1 className="text-3xl font-black">{client.name}</h1>
              <p className="text-gray-500 font-bold text-sm">{client.phone || 'No Phone'} • <span className="text-blue-600">{client.type}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
             {unbilledTotal > 0 && (
               <button 
                 onClick={() => router.push(`/invoice/print?id=${client.id}`)}
                 className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition flex items-center gap-2"
               >
                 <span className="text-lg">📄</span> View Invoice
               </button>
             )}
             <button onClick={deleteClient} className="text-red-500 text-xs font-bold border border-red-200 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100">Delete Client</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actions Column */}
          <div className="space-y-6">
            {client.type === 'PACKAGE' && (
              <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-3xl shadow-sm">
                <h2 className="font-bold text-lg mb-1">Monthly Package</h2>
                <div className="flex justify-between items-center mb-4"><span className="font-black text-2xl">LKR {client.package_price?.toLocaleString() || 0}</span></div>
                <button onClick={addMonthlyFee} className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition shadow-md">+ Add Fee</button>
              </div>
            )}
            <div className="bg-white p-6 rounded-3xl shadow-sm border h-fit">
              <h2 className="font-bold text-xl mb-4">Add Custom Job</h2>
              <form onSubmit={addLog} className="space-y-4">
                <input type="text" placeholder="Task Name" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={task} onChange={e => setTask(e.target.value)} />
                <div className="flex gap-4">
                  <input type="number" placeholder="Cost" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={cost} onChange={e => setCost(e.target.value)} />
                  <input type="date" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-gray-100 text-black font-bold py-3 rounded-xl mt-2 hover:bg-gray-200 transition">Add Job</button>
              </form>
            </div>
          </div>

          {/* History Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-xl mb-2">📜 Unpaid Work & History</h2>
            {logs.length === 0 ? <div className="text-center p-10 text-gray-400 bg-white rounded-3xl border border-dashed">No jobs recorded yet.</div> : (
               logs.map((log) => (
                 <div key={log.id} className={`p-5 rounded-2xl shadow-sm border flex justify-between items-center ${log.status === 'UNBILLED' ? 'bg-white border-l-4 border-l-black' : 'bg-gray-50 opacity-70'}`}>
                   <div><h3 className="font-bold text-lg">{log.description}</h3><p className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString()}</p></div>
                   <div className="flex items-center gap-4">
                     <span className="font-bold text-lg">LKR {log.cost.toLocaleString()}</span>
                     {log.status === 'UNBILLED' ? (
                       <button onClick={() => markPaid(log.id)} className="bg-green-100 text-green-800 text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition">Mark Paid</button>
                     ) : <span className="bg-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-lg">PAID</span>}
                     
                     {/* DELETE JOB ICON */}
                     <button onClick={() => deleteLog(log.id)} className="text-gray-300 hover:text-red-500 transition px-2">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                     </button>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="loader"></div></div>}>
      <ClientContent />
    </Suspense>
  );
}