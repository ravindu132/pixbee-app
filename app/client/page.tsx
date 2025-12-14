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
    // 1. Get Client Details
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (clientData) setClient(clientData);

    // 2. Get Work History
    const { data: logData } = await supabase
      .from('work_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
    
    if (logData) setLogs(logData);
    setLoading(false);
  };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !cost) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user && id) {
      await supabase.from('work_logs').insert([{
        user_id: user.id,
        client_id: id,
        description: task,
        cost: parseFloat(cost),
        date: new Date().toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'UNBILLED'
      }]);
      
      // Reset and Refresh
      setTask(''); setCost(''); setDueDate('');
      fetchData(id);
    }
  };

  const markPaid = async (logId: string) => {
    await supabase.from('work_logs').update({ status: 'PAID' }).eq('id', logId);
    if (id) fetchData(id);
  };

  const deleteClient = async () => {
    if (confirm("Are you sure? This will delete ALL history for this client.")) {
      await supabase.from('clients').delete().eq('id', id);
      router.push('/clients');
    }
  };

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
              <p className="text-gray-500 font-bold text-sm">
                {client.phone || 'No Phone Number'} • <span className="text-blue-600">{client.type} CUSTOMER</span>
              </p>
            </div>
          </div>
          <button onClick={deleteClient} className="text-red-500 text-xs font-bold border border-red-200 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100">Delete Client</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Add Work Form */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border h-fit">
            <h2 className="font-bold text-xl mb-4">⚡ Add New Job</h2>
            <form onSubmit={addLog} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Task Name</label>
                <input type="text" placeholder="e.g. Social Media Post" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={task} onChange={e => setTask(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Cost (LKR)</label>
                  <input type="number" placeholder="5000" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={cost} onChange={e => setCost(e.target.value)} />
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold text-gray-400 uppercase">Due Date</label>
                   <input type="date" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-xl mt-2 hover:bg-gray-800 transition">Add to History</button>
            </form>
          </div>

          {/* RIGHT: History List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-xl mb-2">📜 Job History</h2>
            {logs.length === 0 ? (
               <div className="text-center p-10 text-gray-400 bg-white rounded-3xl border border-dashed">No jobs recorded yet.</div>
            ) : (
               logs.map((log) => (
                 <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center group">
                   <div>
                     <h3 className="font-bold text-lg">{log.description}</h3>
                     <p className="text-xs text-gray-400">
                        {new Date(log.date).toLocaleDateString()} • {log.due_date ? `Due: ${new Date(log.due_date).toLocaleDateString()}` : 'No Deadline'}
                     </p>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="font-bold text-lg">LKR {log.cost.toLocaleString()}</span>
                     {log.status === 'UNBILLED' ? (
                       <button onClick={() => markPaid(log.id)} className="bg-yellow-400 text-black text-xs font-bold px-3 py-2 rounded-lg hover:scale-105 transition">Mark Paid</button>
                     ) : (
                       <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg">✓ PAID</span>
                     )}
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