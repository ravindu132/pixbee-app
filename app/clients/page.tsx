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
    <div className="min-h-screen bg-gray-50 text-black p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-3 bg-white border rounded-full hover:shadow-md transition">←</button>
          <h1 className="text-3xl font-bold">All Clients</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div 
              key={client.id} 
              onClick={() => router.push(`/client?id=${client.id}`)}
              className="bg-white p-6 border rounded-2xl shadow-sm hover:shadow-lg transition cursor-pointer flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-xl mb-1 group-hover:text-yellow-600 transition">{client.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded ${client.type === 'PACKAGE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  {client.type === 'PACKAGE' ? 'Monthly Package' : 'Standard'}
                </span>
              </div>
              <span className="text-gray-300 text-2xl group-hover:translate-x-1 transition">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}