"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids'); 

  const [client, setClient] = useState<any>(null);
  const [currentItems, setCurrentItems] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState({ total: 0, prevPaid: 0, balance: 0 });
  const [isMixedProjects, setIsMixedProjects] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', branch_name: '', account_name: '', account_number: '' });
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');
  
  const isAllPaid = currentItems.length > 0 && currentItems.every(item => item.status === 'PAID');

  useEffect(() => {
    if (invoiceId) document.title = invoiceId;
    else document.title = "PixBee Invoice";
  }, [invoiceId]);

  useEffect(() => {
    if (idsParam) {
      fetchData(idsParam.split(','));
    }
  }, [idsParam]);

  const fetchData = async (ids: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: selectedData } = await supabase.from('work_logs').select(`*, clients(*)`).in('id', ids);
    
    if (selectedData && selectedData.length > 0) {
      setCurrentItems(selectedData);
      setClient(selectedData[0].clients);
      const firstRoot = getRootName(selectedData[0].description);
      const hasDifferentProjects = selectedData.some(item => getRootName(item.description) !== firstRoot);
      setIsMixedProjects(hasDifferentProjects);

      if (!hasDifferentProjects && selectedData[0].client_id) {
         const { data: relatedData } = await supabase
           .from('work_logs')
           .select('*')
           .eq('client_id', selectedData[0].client_id)
           .ilike('description', `${firstRoot}%`);
         if (relatedData) calculateProjectStats(selectedData, relatedData);
      } else {
         setProjectStats({ total: 0, prevPaid: 0, balance: 0 });
      }
    }

    if (user) {
      const { data: settingsData } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single();
      if (settingsData) {
        setSettings(settingsData);
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
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

  const getRootName = (name: string) => name.split(' (')[0].trim();

  const calculateProjectStats = (selected: any[], allRelated: any[]) => {
    const total = allRelated.reduce((sum, item) => sum + item.cost, 0);
    const selectedIds = selected.map(i => i.id);
    const prevPaid = allRelated.filter(item => item.status === 'PAID' && !selectedIds.includes(item.id)).reduce((sum, item) => sum + item.cost, 0); 
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
    if (!newBank.bank_name || !newBank.account_number) return alert("Enter details");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('bank_accounts').insert([{ user_id: user.id, ...newBank }]).select();
        if (data) {
            setAllBanks([...allBanks, data[0]]);
            setSelectedBankIds([...selectedBankIds, data[0].id]);
            setShowAddBank(false);
            setNewBank({ bank_name: '', branch_name: '', account_name: '', account_number: '' });
        }
    }
  };

  const markInvoiceAsPaid = async () => {
    if (!confirm("Confirm payment?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    const ids = currentItems.map(i => i.id);
    await supabase.from('work_logs').update({ status: 'PAID' }).in('id', ids);
    if (user && settings) {
      await supabase.from('business_settings').update({ invoice_sequence: (settings.invoice_sequence || 200) + 1 }).eq('user_id', user.id);
    }
    fetchData(ids);
  };

  const currentTotal = currentItems.reduce((sum, item) => sum + item.cost, 0);
  const getWhatsAppUrl = (phone: string) => {
    if (!phone) return '';
    let cleanNum = phone.replace(/[^0-9]/g, ''); 
    if (cleanNum.startsWith('0')) cleanNum = '94' + cleanNum.substring(1);
    return `https://wa.me/${cleanNum}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!client) return <div className="p-10">Invoice data not found.</div>;

  const waUrl = getWhatsAppUrl(settings?.company_phone);
  const qrUrl = waUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(waUrl)}&color=000000` : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 relative print:py-0 print:bg-white">
      
      {/* Configuration Bar */}
      <div className="w-full max-w-[210mm] bg-white p-4 mb-4 rounded-xl shadow-sm border print:hidden">
        <div className="flex justify-between items-center mb-4">
           <button onClick={() => router.back()} className="text-gray-500 text-xs font-bold hover:text-black">Back</button>
           <button onClick={() => router.push('/settings')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Edit Info</button>
        </div>
        <div className="mb-4">
          <p className="text-[10px] font-bold mb-2 uppercase text-gray-400">Select Banks</p>
          <div className="flex flex-wrap gap-2 items-center">
            {allBanks.map(bank => (
              <button key={bank.id} onClick={() => toggleBank(bank.id)} className={`px-3 py-2 text-xs font-bold rounded-lg border ${selectedBankIds.includes(bank.id) ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>{bank.bank_name}</button>
            ))}
            <button onClick={() => setShowAddBank(true)} className="px-3 py-2 text-xs font-bold rounded-lg border border-dashed text-gray-500">+ New</button>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
          {!isAllPaid && <button onClick={markInvoiceAsPaid} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">Mark Current Paid</button>}
          <button onClick={() => window.print()} className="flex-1 bg-black text-white py-3 rounded-lg font-bold">Print PDF</button>
        </div>
      </div>

      {/* PAPER */}
      <div className="invoice-container bg-white w-[210mm] min-w-[210mm] min-h-[297mm] p-8 shadow-2xl text-black relative overflow-hidden flex flex-col print:p-6 print:shadow-none print:m-0">
        
        {/* Watermark */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-9xl font-black border-8 rounded-3xl p-10 select-none pointer-events-none mix-blend-multiply ${isAllPaid ? 'text-green-600 border-green-600 opacity-20' : 'text-yellow-400 border-yellow-400 opacity-10'}`}>
          {isAllPaid ? 'PAID' : 'PENDING'}
        </div>

        <div className="flex-grow">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-black pb-3 mb-4 relative z-10">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-black uppercase leading-tight">{settings?.company_name}</h1>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{settings?.company_slogan}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{isAllPaid ? 'RECEIPT' : 'INVOICE'}</h1>
              <p className="font-bold text-[10px] text-gray-600 font-mono">{invoiceId}</p>
            </div>
          </div>

          {/* Client Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-4 relative z-10 text-[10px]">
            <div>
              <p className="font-bold text-gray-400 uppercase mb-0.5">From</p>
              <p className="font-bold text-sm">{settings?.company_name}</p>
              <p className="text-gray-500">{settings?.company_address}</p>
              <p className="text-gray-500">{settings?.company_email}</p>
              <p className="text-gray-500">{settings?.company_phone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 uppercase mb-0.5">Bill To</p>
              <p className="font-bold text-sm">{client.name}</p>
              <p className="text-gray-500">{client.phone}</p>
              <p className="text-gray-500 mt-1">Date: <span className="font-bold text-black">{new Date().toLocaleDateString()}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-4 relative z-10">
            <thead className="bg-gray-100">
              <tr className="text-[9px] font-black uppercase text-gray-600 tracking-wider">
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {currentItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-bold text-gray-800">
                    {item.description}
                    {item.status === 'PAID' && <span className="ml-1.5 text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Paid</span>}
                  </td>
                  <td className="py-2 px-3 text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-right font-bold text-black">LKR {item.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Bank Detail Section */}
          <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
            <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-[10px]">
                <p className="font-black text-gray-400 uppercase mb-1.5 tracking-tighter">Payment Methods</p>
                <div className="space-y-1.5">
                  {allBanks.filter(b => selectedBankIds.includes(b.id)).map(bank => (
                    <div key={bank.id} className="border-l-2 border-gray-300 pl-2">
                      <p className="font-bold text-black">{bank.bank_name}</p>
                      <p className="font-mono">Acc: {bank.account_number}</p>
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-black text-white p-4 rounded-xl w-52 shadow-lg print:shadow-none">
                <div className="flex justify-between items-center text-gray-300 mb-1 text-[10px]">
                    <span>Subtotal</span>
                    <span className="font-bold">LKR {currentTotal.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/20 my-1.5"></div>
                <div className="flex justify-between items-center text-white">
                    <span className="font-bold text-[11px] uppercase">Total Due</span>
                    <span className="font-black text-base">LKR {currentTotal.toLocaleString()}</span>
                </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - SYSTEM BANNER & FOOTER */}
        <div className="relative z-10">
          <div className="border border-gray-200 rounded-lg p-2 text-center mb-3 bg-white">
            <p className="font-bold text-gray-600 uppercase tracking-widest text-[8px] mb-0.5">SYSTEM GENERATED INVOICE</p>
            <p className="text-[7px] text-gray-400 italic">No signature required.</p>
          </div>

          <div className="border-t-2 border-black pt-2 flex justify-between items-end">
            <div>
              <p className="font-bold text-black text-[11px] mb-0.5">{settings?.company_footer}</p>
              <div className="flex flex-col gap-0.5 text-[9px]">
                  <p className="font-bold text-black flex items-center gap-1.5">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                    {settings?.company_phone}
                  </p>
                  <p className="text-gray-500">{settings?.company_email}</p>
              </div>
            </div>

            {qrUrl && (
              <div className="flex items-center gap-2">
                 <p className="text-[7px] font-bold uppercase text-gray-400 text-right leading-none">Scan to<br/>Chat</p>
                 <img src={qrUrl} alt="WA QR" className="w-12 h-12 border border-black rounded p-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { overflow-x: auto; background: #f3f4f6; }
        .invoice-container { margin: 10px auto; }
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; height: 100%; overflow: hidden !important; }
          .print\\:hidden { display: none !important; }
          .invoice-container {
             width: 100% !important;
             max-width: 210mm !important;
             height: auto !important;
             min-height: 295mm !important;
             margin: 0 !important;
             padding: 4mm !important;
             /* 🟢 Aggressive scaling for mobile safe zone */
             transform: scale(0.85) !important;
             transform-origin: top center !important;
             overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintPage() { return ( <Suspense fallback={<div>Loading...</div>}> <InvoiceContent /> </Suspense> ); }