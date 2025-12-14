"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      if (data) setClients(data);
    };
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full">←</button>
        <h1 className="text-2xl font-bold">All Clients</h1>
      </div>

      <div className="space-y-3">
        {clients.map((client) => (
          <div 
            key={client.id} 
            onClick={() => router.push(`/client?id=${client.id}`)}
            className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50 cursor-pointer"
          >
            <div>
              <h3 className="font-bold">{client.name}</h3>
              <p className="text-xs text-gray-500">{client.type === 'PACKAGE' ? 'Monthly Package' : 'Standard'}</p>
            </div>
            <span className="text-gray-300">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}