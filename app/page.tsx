"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data
  const [urgentDeliveries, setUrgentDeliveries] = useState<any[]>([]);
  const [fillGapDeliveries, setFillGapDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState({ unbilled: 0, count: 0 });
  const [clients, setClients] = useState<any[]>([]); // For the dropdown

  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  // New Job Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [task, setTask] = useState('');
  const [cost, setCost] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    // 1. Get Work Items
    const { data: work } = await supabase
      .from('work_logs')
      .select(`*, clients(name)`)
      .eq('status', 'UNBILLED')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });
    
    // 2. Get Clients (For the dropdown)
    const { data: clientList } = await supabase.from('clients').select('id, name').order('name');
    if (clientList) setClients(clientList);

    if (work) {
      const now = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(now.getDate() + 2); 

      const urgent = work.filter(item => new Date(item.due_date) <= twoDaysFromNow);
      const others = work.filter(item => new Date(item.due_date) > twoDaysFromNow);
      
      const totalUnbilled = work.reduce((sum, item) => sum + item.cost, 0);

      setUrgentDeliveries(urgent);
      setFillGapDeliveries(others.slice(0, 5));
      setStats({ unbilled: totalUnbilled, count: work.length });
    }
    setLoading(false);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !task || !cost) return alert("Please fill all fields");
    
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const totalCost = parseFloat(cost);
      
      if (isSplit) {
        const advanceAmount = Math.round(totalCost * (splitPercent / 100));
        const balanceAmount = totalCost - advanceAmount;

        // 1. Advance (Unbilled)
        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: selectedClientId, description: `${task} (Advance - ${splitPercent}%)`, 
          cost: advanceAmount, date: new Date().toISOString(), due_date: dueDate ? new Date(dueDate).toISOString() : null, status: 'UNBILLED'
        }]);

        // 2. Balance (Unbilled)
        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: selectedClientId, description: `${task} (Final Balance)`, 
          cost: balanceAmount, date: new Date().toISOString(), due_date: null, status: 'UNBILLED'
        }]);

      } else {
        // Normal Job
        await supabase.from('work_logs').insert([{
          user_id: user.id, client_id: selectedClientId, description: task, 
          cost: totalCost, date: new Date().toISOString(), due_date: dueDate ? new Date(dueDate).toISOString() : null, status: 'UNBILLED'
        }]);
      }

      // Cleanup
      setSubmitting(false);
      setShowModal(false);
      setTask(''); setCost(''); setDueDate(''); setIsSplit(false); setSelectedClientId('');
      fetchData(); // Refresh dashboard stats
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="loader"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto animate-fade-in">
        
        {/* HEADER SECTION */}
        <div className="mb-8 flex justify-between items-end">
          <div>
             <h1 className="text-4xl font-black tracking-tight text-gray-900">Dashboard</h1>
             <p className="text-gray-500 font-medium mt-1">Overview of your creative studio.</p>
          </div>
          <div className="text-right hidden md:block">
             <p className="text-xs font-bold text-gray-400 uppercase">Total Pending</p>
             <p className="text-2xl font-black text-gray-900">LKR {stats.unbilled.toLocaleString()}</p>
          </div>
        </div>

        {/* 1. BENTO GRID ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Main Card: NEW PROJECT (Opens Modal) */}
          <button 
            onClick={() => setShowModal(true)} 
            className="md:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:scale-[1.01] transition duration-300 flex items-center justify-between group overflow-hidden relative"
          >
             <div className="relative z-10 text-left">
               <h2 className="text-3xl font-black mb-2">New Project</h2>
               <p className="text-gray-400 text-sm font-medium">Add a new job or advance payment</p>
             </div>
             <div className="bg-white/10 p-4 rounded-full text-white group-hover:bg-yellow-400 group-hover:text-black group-hover:rotate-90 transition duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
             </div>
          </button>

          {/* Secondary Card: REVENUE */}
          <button 
            onClick={() => router.push('/revenue')}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition duration-300 text-left group"
          >
             <div className="bg-yellow-50 text-yellow-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M6 16.5v-2.25A2.25 2.25 0 0 1 8.25 12h2.25M8.25 12v4.5m2.25-4.5v4.5m0-4.5h2.25m-2.25 4.5h2.25m0 0h2.25m0-2.25v2.25m0 0h2.25m0-2.25v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25m0 0v11.25" /></svg>
             </div>
             <h3 className="font-bold text-xl text-gray-900">Revenue</h3>
             <p className="text-xs text-gray-400 mt-1 font-bold uppercase">View Analytics</p>
          </button>
        </div>

        {/* 2. TASKS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* URGENT COLUMN */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Urgent Attention</h3>
             </div>
             {urgentDeliveries.length > 0 ? (
                urgentDeliveries.map((item) => (
                  <div key={item.id} className="bg-white border-l-4 border-l-red-500 p-5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition">{item.description}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase mt-1">{item.clients?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md">DUE SOON</span>
                  </div>
                ))
             ) : (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                   <p className="text-sm text-gray-400">No urgent tasks. Clear skies! ☀️</p>
                </div>
             )}
          </div>

          {/* UPCOMING COLUMN */}
          <div className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 pl-1">Upcoming Work</h3>
             {fillGapDeliveries.length > 0 ? (
                fillGapDeliveries.map((item) => (
                  <div key={item.id} className="bg-white/60 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white transition flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                       <div className="font-bold text-gray-300 text-lg w-6 text-center">{new Date(item.due_date).getDate()}</div>
                       <div>
                          <h4 className="font-bold text-sm text-gray-800">{item.description}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{item.clients?.name}</p>
                       </div>
                    </div>
                  </div>
                ))
             ) : (
                <p className="text-gray-400 text-sm italic pl-1">No upcoming tasks.</p>
             )}
          </div>
        </div>

      </div>

      {/* 🟢 NEW JOB MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black">Add New Project</h2>
               <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-5">
              
              {/* Client Select */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Select Client</label>
                <select 
                   className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5 appearance-none"
                   value={selectedClientId}
                   onChange={e => setSelectedClientId(e.target.value)}
                   required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Task Name */}
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Project Name</label>
                 <input type="text" placeholder="e.g. Logo Design" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" 
                   value={task} onChange={e => setTask(e.target.value)} required />
              </div>

              {/* Cost & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Cost</label>
                   <input type="number" placeholder="0.00" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5" 
                     value={cost} onChange={e => setCost(e.target.value)} required />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase ml-2 block mb-1">Due Date</label>
                   <input type="date" className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold focus:ring-2 focus:ring-black/5 text-sm" 
                     value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              {/* Split Toggle */}
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

              <button type="submit" disabled={submitting} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg">
                {submitting ? 'Saving...' : 'Add Project'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}