"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch Clients and calculate totals
      const { data } = await supabase
        .from('clients')
        .select(`*, work_logs (cost, status)`)
        .order('created_at', { ascending: false });

      if (data) {
        const clientsWithMoney = data.map((client: any) => {
          const totalOwed = client.work_logs
            .filter((log: any) => log.status === 'UNBILLED')
            .reduce((sum: number, log: any) => sum + log.cost, 0);
          return { ...client, totalOwed };
        });
        setClients(clientsWithMoney);
      }
      setLoading(false);
    };

    getData();
  }, [router]);

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('clients').insert([{ name: newClientName, user_id: user.id }]).select();
      if (data) {
        setClients([{ ...data[0], totalOwed: 0 }, ...clients]);
        setNewClientName('');
      }
    }
  };

  if (loading) return <div className="p-10 text-black">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Simple Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">PixBee Dashboard</h1>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-sm text-red-500 hover:underline"
          >
            Sign Out
          </button>
        </div>

        {/* Add Client Form */}
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Client</h2>
          <form onSubmit={addClient} className="flex gap-4">
            <input
              type="text"
              placeholder="Client Name"
              className="flex-1 p-3 border rounded"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            <button type="submit" className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 font-bold">
              Add
            </button>
          </form>
        </div>

        {/* Client List */}
        <h2 className="text-xl font-bold mb-4">Your Clients</h2>
        <div className="grid gap-4">
            {clients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => router.push(`/client?id=${client.id}`)}
                className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <p className="text-xs text-gray-400">ID: {client.id.slice(0,4)}...</p>
                </div>
                <div className="text-right">
                   <span className={`text-xl font-bold ${client.totalOwed > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                     ${client.totalOwed.toFixed(2)}
                   </span>
                   <p className="text-xs text-gray-500">Unbilled</p>
                </div>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}