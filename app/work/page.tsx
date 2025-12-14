"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PlaceWork() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [task, setTask] = useState('');
  const [cost, setCost] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load clients for the dropdown
    const getClients = async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      if (data) setClients(data);
    };
    getClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Quick validation
    if (!selectedClient || !task || !cost) { alert("Please fill all fields"); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('work_logs').insert([{
        user_id: user.id,
        client_id: selectedClient,
        description: task,
        cost: parseFloat(cost),
        date: new Date().toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'UNBILLED'
      }]);
      
      router.push('/'); // Go back home after saving
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Job</h1>
          <button onClick={() => router.back()} className="text-gray-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client</label>
            <select 
              className="w-full p-3 bg-gray-50 rounded-lg border focus:border-yellow-400 outline-none"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Select a Client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-xs text-blue-500 mt-2 text-right" onClick={() => router.push('/')}>+ Need new client?</p>
          </div>

          {/* Job Details */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Name</label>
            <input 
              type="text" placeholder="e.g. Logo Design"
              className="w-full p-3 bg-gray-50 rounded-lg border focus:border-yellow-400 outline-none"
              value={task} onChange={e => setTask(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (LKR)</label>
              <input 
                type="number" placeholder="5000"
                className="w-full p-3 bg-gray-50 rounded-lg border focus:border-yellow-400 outline-none"
                value={cost} onChange={e => setCost(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
              <input 
                type="date"
                className="w-full p-3 bg-gray-50 rounded-lg border focus:border-yellow-400 outline-none"
                value={dueDate} onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-yellow-400 font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition flex justify-center items-center gap-2"
          >
            {loading && <div className="loader"></div>}
            {loading ? 'Saving...' : 'Confirm Job'}
          </button>
        </form>
      </div>
    </div>
  );
}