"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PlaceWork() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  
  // Job Form Data
  const [task, setTask] = useState('');
  const [cost, setCost] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State (For creating client right here)
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', type: 'NORMAL' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
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

  const handleCreateClient = async () => {
    if (!newClient.name) return;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Insert and RETURN the new data
      const { data, error } = await supabase.from('clients').insert([{ 
        name: newClient.name, 
        phone: newClient.phone,
        type: newClient.type,
        user_id: user.id 
      }]).select();

      if (data) {
        // 2. Refresh list and AUTO-SELECT the new client
        const newlyCreatedClient = data[0];
        setClients([...clients, newlyCreatedClient]); // Add to list immediately
        setSelectedClient(newlyCreatedClient.id); // Select it
        
        // 3. Reset Modal
        setNewClient({ name: '', phone: '', type: 'NORMAL' });
        setShowClientModal(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Job</h1>
          <button onClick={() => router.back()} className="text-gray-400 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSaveJob} className="space-y-5">
          {/* Client Selector Row */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client</label>
            <div className="flex gap-2">
                <select 
                className="w-full p-3 bg-gray-50 rounded-lg border focus:border-yellow-400 outline-none"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                >
                <option value="">Select a Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                {/* NEW BUTTON: Create Client Here */}
                <button 
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="bg-black text-white px-4 rounded-lg font-bold text-xl hover:bg-gray-800"
                >
                  +
                </button>
            </div>
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
            className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-md hover:scale-[1.02] transition flex justify-center items-center gap-2 mt-4"
          >
            {loading ? 'Saving...' : 'Confirm Job'}
          </button>
        </form>
      </div>

      {/* MODAL: Create Client (Internal) */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="font-bold text-xl mb-4">Create New Client</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Client Name" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} autoFocus />
              
              <input type="text" placeholder="Phone (Optional)" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />

              <select className="w-full border-b-2 p-2 outline-none bg-white font-bold"
                  value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value})}>
                  <option value="NORMAL">Normal Customer</option>
                  <option value="PACKAGE">Package Customer</option>
              </select>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowClientModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
              <button onClick={handleCreateClient} className="flex-1 bg-black text-white rounded-lg font-bold">Save & Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}