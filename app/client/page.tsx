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
  
  // Split Payment
  const [isSplit, setIsSplit] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50); 
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

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
      const totalCost = parseFloat(cost);
      if (isSplit) {
        const advanceAmount = Math.round(totalCost * (splitPercent / 100));
        const balanceAmount = totalCost - advanceAmount;

        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: id, description: `${task} (Advance - ${splitPercent}%)`, 
          cost: advanceAmount, date: new Date().toISOString(), due_date: dueDate ? new Date(dueDate).toISOString() : null, status: 'UNBILLED'
        }]);

        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: id, description: `${task} (Final Balance)`, 
          cost: balanceAmount, date: new Date().toISOString(), due_date: null, status: 'UNBILLED'
        }]);

      } else {
        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: id, description: task, 
          cost: totalCost, date: new Date().toISOString(), due_date: dueDate ? new Date(dueDate).toISOString() : null, status: 'UNBILLED'
        }]);
      }
      setTask(''); setCost(''); setDueDate(''); setIsSplit(false); setSplitPercent(50);
      fetchData(id);
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

  const toggleSelection = (logId: string) => {
    if (selectedLogIds.includes(logId)) {
      setSelectedLogIds(selectedLogIds.filter(id => id !== logId));
    } else {
      setSelectedLogIds([...selectedLogIds, logId]);
    }
  };

  const generateInvoice = () => {
    if (selectedLogIds.length === 0) return alert("Please select items to bill.");
    const ids = selectedLogIds.join(',');
    router.push(`/invoice/print?ids=${ids}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>;
  if (!client) return <div className="p-10">Client not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-4 bg-white rounded-full hover:shadow-lg transition">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{client.name}</h1>
              <p className="text-gray-500 font-bold text-sm mt-1">{client.phone || 'No Phone'} • <span className="text-blue-600 uppercase tracking-wider">{client.type}</span></p>
            </div>
          </div>
          <button onClick={deleteClient} className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition">Delete Client</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: ACTIONS & FORM */}
          <div className="space-y-6">
            {client.type === 'PACKAGE' && (
              <div className="bg-yellow-400 text-black p-8 rounded-[2rem] shadow-lg relative overflow-hidden group">
                <div className="relative z-10">
                   <h2 className="font-bold text-lg mb-1 opacity-80">Monthly Package</h2>
                   <div className="flex justify-between items-center mb-6"><span className="font-black text-4xl">LKR {client.package_price?.toLocaleString() || 0}</span></div>
                   <button onClick={addMonthlyFee} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:scale-[1.02] transition shadow-md">+ Add Fee</button>
                </div>
                <div className="absolute -right-5 -bottom-5 text-yellow-300 opacity-50 rotate-12">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-32 h-32"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" /></svg>
                </div>
              </div>
            )}
            
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                 <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">+</span> Add Project
              </h2>
              <form onSubmit={addLog} className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase ml-2">Task Name</label>
                   <input type="text" placeholder="e.g. Web Design" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" value={task} onChange={e => setTask(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Cost</label>
                     <input type="number" placeholder="0.00" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" value={cost} onChange={e => setCost(e.target.value)} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Due Date</label>
                     <input type="date" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isSplit} onChange={e => setIsSplit(e.target.checked)} className="w-5 h-5 accent-black rounded-md" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Split Bill (Advance)?</span>
                  </label>
                  
                  {isSplit && (
                    <div className="mt-4 animate-fade-in">
                       <div className="flex justify-between text-xs font-bold mb-2 text-gray-400">
                         <span>Advance: {splitPercent}%</span>
                         <span>Balance: {100 - splitPercent}%</span>
                       </div>
                       <input type="range" min="10" max="90" step="10" value={splitPercent} onChange={e => setSplitPercent(parseInt(e.target.value))} className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                       {cost && (
                         <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-2 bg-white p-2 rounded-lg border">
                           <span>Adv: {(parseFloat(cost) * (splitPercent/100)).toLocaleString()}</span>
                           <span>Bal: {(parseFloat(cost) * ((100-splitPercent)/100)).toLocaleString()}</span>
                         </div>
                       )}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg">Add Job</button>
              </form>
            </div>
          </div>

          {/* RIGHT: HISTORY */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-bold text-xl text-gray-400 uppercase tracking-widest text-xs">Project History</h2>
              
              {selectedLogIds.length > 0 && (
                <button onClick={generateInvoice} className="bg-black text-white px-5 py-2 rounded-full font-bold hover:bg-gray-800 transition flex items-center gap-2 text-sm shadow-xl animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>
                  <span>Generate Bill ({selectedLogIds.length})</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
               <div className="text-center p-12 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p>No jobs recorded yet.</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {logs.map((log) => (
                   <div key={log.id} className={`p-5 rounded-3xl shadow-sm border transition-all hover:scale-[1.01] flex gap-4 items-center ${log.status === 'UNBILLED' ? 'bg-white border-transparent hover:border-gray-200' : 'bg-gray-50 border-transparent opacity-70'}`}>
                     
                     <input 
                       type="checkbox" 
                       checked={selectedLogIds.includes(log.id)}
                       onChange={() => toggleSelection(log.id)}
                       className="w-5 h-5 accent-black cursor-pointer"
                     />

                     <div className="flex-1">
                       <h3 className="font-bold text-base text-gray-900">{log.description}</h3>
                       <p className="text-xs text-gray-400 font-bold mt-1">{new Date(log.date).toLocaleDateString()}</p>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       <span className="font-black text-lg whitespace-nowrap">LKR {log.cost.toLocaleString()}</span>
                       
                       {log.status === 'UNBILLED' ? (
                         <button onClick={() => markPaid(log.id)} className="bg-green-50 text-green-700 text-[10px] font-black px-4 py-2 rounded-full hover:bg-green-100 transition tracking-wide uppercase">Mark Paid</button>
                       ) : (
                         <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wide">PAID</span>
                       )}
                       
                       <button onClick={() => deleteLog(log.id)} className="text-gray-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>}>
      <ClientContent />
    </Suspense>
  );
}