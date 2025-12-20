"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids'); 

  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState({ total: 0, prevPaid: 0, balance: 0 });
  
  const [settings, setSettings] = useState<any>(null);
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', branch_name: '', account_name: '', account_number: '' });
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');
  
  const isAllPaid = items.length > 0 && items.every(item => item.status === 'PAID');

  useEffect(() => {
    if (idsParam) {
      fetchData(idsParam.split(','));
    }
  }, [idsParam]);

  const fetchData = async (ids: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Get Selected Items
    const { data: selectedData } = await supabase.from('work_logs').select(`*, clients(*)`).in('id', ids);
    
    if (selectedData && selectedData.length > 0) {
      setCurrentItems(selectedData);
      setClient(selectedData[0].clients);
      
      // Calculate Project Stats (Advance vs Balance)
      const firstItem = selectedData[0];
      const rootName = firstItem.description.split(' (')[0]; 

      if (rootName && firstItem.client_id) {
         const { data: relatedData } = await supabase
           .from('work_logs')
           .select('*')
           .eq('client_id', firstItem.client_id)
           .ilike('description', `${rootName}%`);
         
         if (relatedData) calculateProjectStats(selectedData, relatedData);
      } else {
        calculateProjectStats(selectedData, selectedData);
      }
    }

    if (user) {
      // 2. Get Settings (Includes Invoice Sequence)
      const { data: settingsData } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single();
      
      if (settingsData) {
        setSettings(settingsData);
        
        // 🟢 GENERATE ID: INV-DATE-SEQUENCE (e.g., INV-251220-0200)
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        // Use sequence from DB, default to 200. Pad with zeros (0200)
        const seq = String(settingsData.invoice_sequence || 200).padStart(4, '0');
        setInvoiceId(`INV-${dateStr}-${seq}`);
      }

      const { data: bankData } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id);
      if (bankData) {
        setAllBanks(bankData);
        if (selectedBankIds.length === 0 && bankData.length > 0) setSelectedBankIds([bankData[0].id]);
      }
    }
    setLoading(false);
  };

  const [currentItems, setCurrentItems] = useState<any[]>([]);

  const calculateProjectStats = (selected: any[], allRelated: any[]) => {
    const total = allRelated.reduce((sum, item) => sum + item.cost, 0);
    const selectedIds = selected.map(i => i.id);
    const prevPaid = allRelated
      .filter(item => item.status === 'PAID' && !selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.cost, 0);
    const currentBillTotal = selected.reduce((sum, item) => sum + item.cost, 0);
    const balance = total - prevPaid - currentBillTotal;
    setProjectStats({ total, prevPaid, balance });
  };

  const toggleBank = (id: string) => {
    if (selectedBankIds.includes(id)) {
      setSelectedBankIds(selectedBankIds.filter(bid => bid !== id));
    } else {
      setSelectedBankIds([...selectedBankIds, id]);
    }
  };

  const saveNewBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) return alert("Please enter Bank Name and Account Number");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('bank_accounts').insert([{ user_id: user.id, ...newBank }]).select();
        if (data) {
            const addedBank = data[0];
            setAllBanks([...allBanks, addedBank]);
            setSelectedBankIds([...selectedBankIds, addedBank.id]);
            setShowAddBank(false);
            setNewBank({ bank_name: '', branch_name: '', account_name: '', account_number: '' });
        }
    }
  };

  const markInvoiceAsPaid = async () => {
    if (!confirm("Confirm payment received? This will increment your Invoice Counter.")) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const ids = currentItems.map(i => i.id);
    
    // 1. Mark Items as Paid
    await supabase.from('work_logs').update({ status: 'PAID' }).in('id', ids);

    // 2. 🟢 INCREMENT INVOICE SEQUENCE (200 -> 201)
    if (user && settings) {
      await supabase
        .from('business_settings')
        .update({ invoice_sequence: (settings.invoice_sequence || 200) + 1 })
        .eq('user_id', user.id);
    }

    fetchData(ids);
  };

  const currentTotal = currentItems.reduce((sum, item) => sum + item.cost, 0);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!client) return <div className="p-10">Invoice data not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 relative">
      
      {/* Configuration Bar */}
      <div className="w-full max-w-[210mm] bg-white p-4 mb-6 rounded-xl shadow-sm border print:hidden">
        <div className="flex justify-between items-center mb-4">
           <button onClick={() => router.back()} className="text-gray-500 text-xs font-bold hover:text-black flex items-center gap-1">Back</button>
           <button onClick={() => router.push('/settings')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-2">Edit Info</button>
        </div>
        <div className="mb-4">
          <p className="text-[10px] font-bold mb-2 uppercase text-gray-400">Select Banks to Show</p>
          <div className="flex flex-wrap gap-2 items-center">
            {allBanks.map(bank => (
              <button key={bank.id} onClick={() => toggleBank(bank.id)} className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${selectedBankIds.includes(bank.id) ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{bank.bank_name} {selectedBankIds.includes(bank.id) ? '✓' : ''}</button>
            ))}
            <button onClick={() => setShowAddBank(true)} className="px-3 py-2 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-600 transition flex items-center gap-1">+ New</button>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
          {!isAllPaid && <button onClick={markInvoiceAsPaid} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Mark Current Paid</button>}
          <button onClick={() => window.print()} className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800">Print PDF</button>
        </div>
      </div>

      {/* 📄 INVOICE PAPER */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl print:shadow-none print:w-full print:max-w-none text-black relative overflow-hidden flex flex-col">
        
        {/* Watermark */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-9xl font-black opacity-10 border-8 rounded-3xl p-10 select-none pointer-events-none ${isAllPaid ? 'text-green-600 border-green-600' : 'text-yellow-400 border-yellow-400'}`}>
          {isAllPaid ? 'PAID' : 'PENDING'}
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8 relative z-10 mt-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">{settings?.company_name || 'My Agency'}</h1>
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">{settings?.company_slogan || 'Creative Solutions'}</p>
            </div>
          </div>
          <div className="text-right">
             <h1 className="text-3xl font-black text-gray-900 tracking-widest">{isAllPaid ? 'RECEIPT' : 'INVOICE'}</h1>
             <p className="font-bold text-sm mt-1 text-gray-600 font-mono tracking-wide">{invoiceId}</p>
             {isAllPaid && <p className="text-green-600 font-bold uppercase text-[10px] mt-1">✓ Payment Complete</p>}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-10 relative z-10">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">From</p>
            <p className="font-bold text-base">{settings?.company_name || 'My Agency'}</p>
            <p className="text-xs text-gray-500">{settings?.company_address || 'Address'}</p>
            <p className="text-xs text-gray-500">{settings?.company_email || 'Email'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bill To</p>
            <p className="font-bold text-lg">{client.name}</p>
            <p className="text-xs text-gray-500">{client.phone || 'No Phone'}</p>
            <p className="text-xs text-gray-500 mt-2">Date: <span className="font-bold text-black">{new Date().toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8 relative z-10">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase text-gray-600 tracking-wider">Description</th>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase text-gray-600 tracking-wider">Date</th>
              <th className="py-3 px-4 text-right text-[10px] font-black uppercase text-gray-600 tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-bold text-sm text-gray-800">
                  {item.description}
                  {item.status === 'PAID' && <span className="ml-2 text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Paid</span>}
                </td>
                <td className="py-3 px-4 text-xs text-gray-500 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right font-bold text-sm text-black">LKR {item.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 🔻 BANK & TOTAL SECTION */}
        <div className="flex justify-between items-start mt-auto relative z-10 gap-8 mb-8">
           
           <div className="flex-1 bg-gray-50 bg-opacity-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Payment Methods</p>
              {selectedBankIds.length === 0 ? (
                <p className="text-xs text-red-400 italic">No bank selected</p>
              ) : (
                <div className="space-y-3">
                  {allBanks.filter(b => selectedBankIds.includes(b.id)).map(bank => (
                    <div key={bank.id} className="text-xs text-gray-700 border-l-2 border-gray-300 pl-3">
                      <p className="font-bold text-black">{bank.bank_name} <span className="font-normal text-gray-500">({bank.branch_name})</span></p>
                      <p>Acc: <span className="font-mono font-bold">{bank.account_number}</span></p>
                      <p className="text-[10px] text-gray-500">{bank.account_name}</p>
                    </div>
                  ))}
                </div>
              )}
           </div>

           {/* 🟢 TOTALS BOX */}
           <div className="bg-black text-white p-6 rounded-xl w-64 shadow-lg print:shadow-none">
              <div className="flex justify-between mb-1">
                <span className="text-xs opacity-70 font-medium">Total Amount</span>
                <span className="font-bold text-sm text-white">LKR {projectStats.total.toLocaleString()}</span>
              </div>
              
              {projectStats.prevPaid > 0 && (
                <div className="flex justify-between mb-1 text-red-400">
                  <span className="text-xs font-medium">Advance Payment</span>
                  <span className="font-bold text-sm">- {projectStats.prevPaid.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t border-white/20 my-2"></div>
              
              <div className="flex justify-between items-center text-green-400 mb-1">
                 <span className="font-bold text-base">Total Paid</span>
                 <span className="font-black text-xl">LKR {currentTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-yellow-400 mt-2 pt-2 border-t border-dashed border-white/20">
                 <span className="font-bold text-xs uppercase tracking-wide">Balance</span>
                 <span className="font-bold text-lg">LKR {projectStats.balance.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* System Generated Banner */}
        <div className="border border-gray-200 rounded-xl p-3 text-center mt-4 mb-4 bg-white z-10 relative">
          <p className="font-bold text-gray-600 uppercase tracking-widest text-[11px] mb-1">SYSTEM GENERATED INVOICE</p>
          <p className="text-[9px] text-gray-400">This is a computer-generated document. No signature is required.</p>
        </div>

        {/* Footer Text */}
        <div className="text-center border-t pt-4">
          <p className="font-bold text-black text-sm mb-1">{settings?.company_footer || 'Thank you for your business!'}</p>
          <p className="text-[10px] text-gray-400">Contact: {settings?.company_email}</p>
        </div>
      </div>

      {/* Add Bank Modal */}
      {showAddBank && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Add New Bank</h3>
            <div className="space-y-3">
               <input type="text" placeholder="Bank Name" className="w-full p-2 border rounded-lg" value={newBank.bank_name} onChange={e => setNewBank({...newBank, bank_name: e.target.value})} />
               <input type="text" placeholder="Branch" className="w-full p-2 border rounded-lg" value={newBank.branch_name} onChange={e => setNewBank({...newBank, branch_name: e.target.value})} />
               <input type="text" placeholder="Account Name" className="w-full p-2 border rounded-lg" value={newBank.account_name} onChange={e => setNewBank({...newBank, account_name: e.target.value})} />
               <input type="text" placeholder="Account Number" className="w-full p-2 border rounded-lg" value={newBank.account_number} onChange={e => setNewBank({...newBank, account_number: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddBank(false)} className="flex-1 py-2 text-gray-500 font-bold">Cancel</button>
              <button onClick={saveNewBank} className="flex-1 bg-black text-white rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:w-full { width: 100% !important; max-width: 100% !important; }
          .print\\:bg-transparent { background: transparent !important; }
          .print\\:border-none { border: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}