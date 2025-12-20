"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('PROJECT'); // PROJECT or PACKAGE
  const [packagePrice, setPackagePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Client name is required");
    
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const newClient = {
        user_id: user.id,
        name,
        phone,
        type,
        package_price: type === 'PACKAGE' ? parseFloat(packagePrice) : null
      };

      await supabase.from('clients').insert([newClient]);
      
      // Cleanup
      setSubmitting(false);
      setShowModal(false);
      setName(''); setPhone(''); setType('PROJECT'); setPackagePrice('');
      fetchData(); // Refresh list
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto animate-fade-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Clients</h1>
            <p className="text-gray-500 font-medium mt-1">Manage your customer relationships.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 hover:scale-105 transition flex items-center gap-2"
          >
            <span>+ New Client</span>
          </button>
        </div>

        {/* CLIENTS GRID */}
        {clients.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center text-gray-400">
            <p>No clients yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => router.push(`/client?id=${client.id}`)}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${client.type === 'PACKAGE' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  {client.type === 'PACKAGE' && (
                    <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase">Retainer</span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">{client.name}</h3>
                <p className="text-sm text-gray-400 mb-4 truncate">{client.phone || 'No Contact Info'}</p>
                
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300 group-hover:text-gray-500 transition border-t pt-4">
                  <span>View Projects</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 🟢 ADD CLIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black">Add New Client</h2>
               <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-5">
              
              {/* Name */}
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Client Name</label>
                 <input type="text" placeholder="e.g. Acme Corp" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" 
                   value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* Phone */}
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Phone / Contact</label>
                 <input type="text" placeholder="+94 77 ..." className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" 
                   value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              {/* Type Select */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Type</label>
                    <select 
                       className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5 appearance-none"
                       value={type} onChange={e => setType(e.target.value)}
                    >
                      <option value="PROJECT">One-off Project</option>
                      <option value="PACKAGE">Monthly Retainer</option>
                    </select>
                 </div>
                 
                 {/* Conditional Price Input */}
                 <div className={type === 'PACKAGE' ? 'block' : 'hidden'}>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Monthly Price</label>
                    <input type="number" placeholder="0.00" className="w-full bg-yellow-50 text-yellow-800 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-yellow-400" 
                      value={packagePrice} onChange={e => setPackagePrice(e.target.value)} />
                 </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg mt-4">
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}