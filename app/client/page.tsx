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
  const [task, setTask] = useState('');
  const [cost, setCost] = useState('');
  const [stats, setStats] = useState({ unbilled: 0, pending: 0, paid: 0 });

  useEffect(() => {
    if (!id) return;
    getData();
  }, [id]);

  const getData = async () => {
    // 1. Get Client
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single();
    if (clientData) setClient(clientData);

    // 2. Get All Logs
    const { data: logData } = await supabase
      .from('work_logs')
      .select('*')
      .eq('client_id', id)
      .order('date', { ascending: false });

    if (logData) {
      setLogs(logData);
      calculateStats(logData);
    }
  };

  const calculateStats = (data: any[]) => {
    const newStats = { unbilled: 0, pending: 0, paid: 0 };
    data.forEach(item => {
      if (item.status === 'UNBILLED') newStats.unbilled += item.cost;
      if (item.status === 'BILLED') newStats.pending += item.cost;
      if (item.status === 'PAID') newStats.paid += item.cost;
    });
    setStats(newStats);
  };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !cost || !id) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase.from('work_logs').insert([
        { 
          user_id: user.id, client_id: id, description: task, 
          cost: parseFloat(cost), date: new Date().toISOString(), status: 'UNBILLED' 
        }
      ]).select();

      if (data) {
        const newLogs = [data[0], ...logs];
        setLogs(newLogs);
        calculateStats(newLogs);
        setTask(''); setCost('');
      }
    }
  };

  const markItemPaid = async (itemId: string) => {
    const { error } = await supabase.from('work_logs').update({ status: 'PAID' }).eq('id', itemId);
    if (!error) {
      // Update local state immediately
      const updatedLogs = logs.map(log => log.id === itemId ? { ...log, status: 'PAID' } : log);
      setLogs(updatedLogs);
      calculateStats(updatedLogs);
    }
  };

  if (!client) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <button onClick={() => router.push('/')} className="text-gray-500 mb-4">← Back to Dashboard</button>
      
      {/* Header & Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">{client.name}</h1>
        <div className="flex gap-4 text-sm mt-4">
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-gray-500">Unbilled Work</p>
            <p className="font-bold text-xl">${stats.unbilled}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded border border-orange-100">
            <p className="text-orange-600">Pending Invoice</p>
            <p className="font-bold text-xl text-orange-700">${stats.pending}</p>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-100">
            <p className="text-green-600">Total Paid</p>
            <p className="font-bold text-xl text-green-700">${stats.paid}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {stats.unbilled > 0 && (
          <button 
            onClick={() => router.push(`/invoice?id=${id}`)}
            className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800 flex-1"
          >
            📄 Generate Invoice (${stats.unbilled})
          </button>
        )}
      </div>

      {/* Add Work */}
      <div className="bg-gray-50 p-4 rounded-lg border mb-8">
        <h3 className="font-bold mb-2">Log Work</h3>
        <form onSubmit={addLog} className="flex gap-2">
          <input type="text" placeholder="Task..." className="flex-1 p-2 border rounded text-black" value={task} onChange={(e) => setTask(e.target.value)} />
          <input type="number" placeholder="$" className="w-20 p-2 border rounded text-black" value={cost} onChange={(e) => setCost(e.target.value)} />
          <button type="submit" className="bg-blue-600 text-white px-4 rounded">Add</button>
        </form>
      </div>

      {/* History List */}
      <h3 className="font-bold text-xl mb-4">History</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
            <div>
              <p className="font-medium">{log.description}</p>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                {/* Status Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase
                  ${log.status === 'UNBILLED' ? 'bg-gray-200 text-gray-600' : ''}
                  ${log.status === 'BILLED' ? 'bg-orange-100 text-orange-600' : ''}
                  ${log.status === 'PAID' ? 'bg-green-100 text-green-600' : ''}
                `}>
                  {log.status}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="font-bold">${log.cost}</span>
              {log.status === 'BILLED' && (
                <button 
                  onClick={() => markItemPaid(log.id)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientPage() {
  return <Suspense fallback={<div>Loading...</div>}><ClientContent /></Suspense>;
}