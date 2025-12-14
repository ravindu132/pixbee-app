"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');

  useEffect(() => {
    if (id) {
      fetchData(id);
      // Generate a random invoice ID for display
      setInvoiceId(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [id]);

  const fetchData = async (clientId: string) => {
    // Get Client
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (clientData) setClient(clientData);

    // Get ONLY Unbilled Items
    const { data: workData } = await supabase
      .from('work_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'UNBILLED');
    
    if (workData) setItems(workData);
    setLoading(false);
  };

  const total = items.reduce((sum, item) => sum + item.cost, 0);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;
  if (!client) return <div className="p-10">Client not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      
      {/* Action Bar (Hidden when printing) */}
      <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 px-4 print:hidden">
        <button onClick={() => router.back()} className="text-gray-500 font-bold hover:text-black">← Back</button>
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 shadow-lg flex items-center gap-2"
        >
          🖨️ Print PDF
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl print:shadow-none print:w-full print:max-w-none text-black relative">
        
        {/* 1. Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <img src="/logo.png" alt="PixBee" className="h-20 w-auto object-contain" />
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">PixBee Agency</h1>
              <p className="text-sm text-gray-500 font-bold tracking-widest">CREATIVE SOLUTIONS</p>
            </div>
          </div>
          <div className="text-right">
             <h1 className="text-5xl font-black text-gray-100 tracking-widest">INVOICE</h1>
             <p className="font-bold text-lg mt-2 text-gray-600">{invoiceId}</p>
          </div>
        </div>

        {/* 2. Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">From</p>
            <p className="font-bold text-lg">PixBee Agency</p>
            <p className="text-sm text-gray-500">No. 123, Creative Street</p>
            <p className="text-sm text-gray-500">Kandy, Sri Lanka</p>
            <p className="text-sm text-gray-500 mt-1">hello@pixbee.com</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bill To</p>
            <p className="font-bold text-xl">{client.name}</p>
            <p className="text-sm text-gray-500">{client.phone || 'No Phone Number'}</p>
            <p className="text-sm text-gray-500 mt-4">Date Issued: <span className="font-bold text-black">{new Date().toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* 3. Item Table */}
        <table className="w-full mb-8">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-4 px-4 text-left text-xs font-black uppercase text-gray-600 tracking-wider">Description</th>
              <th className="py-4 px-4 text-left text-xs font-black uppercase text-gray-600 tracking-wider">Date</th>
              <th className="py-4 px-4 text-right text-xs font-black uppercase text-gray-600 tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 px-4 font-bold text-gray-800">{item.description}</td>
                <td className="py-4 px-4 text-sm text-gray-500 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                <td className="py-4 px-4 text-right font-bold text-black">LKR {item.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Totals */}
        <div className="flex justify-end mt-8">
           <div className="bg-black text-white p-8 rounded-xl w-72 shadow-lg print:shadow-none">
              <div className="flex justify-between mb-2">
                <span className="text-sm opacity-70 font-medium">Subtotal</span>
                <span className="font-bold">LKR {total.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/20 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Due</span>
                <span className="font-black text-2xl">LKR {total.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* 5. Footer */}
        <div className="absolute bottom-12 left-12 right-12 text-center border-t pt-8">
          <p className="font-bold text-black mb-1">Thank you for your business!</p>
          <p className="text-sm text-gray-400">Please make payments within 14 days. Questions? Call +94 77 123 4567</p>
        </div>

      </div>

      {/* Print CSS Fixes */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:w-full { width: 100% !important; max-width: 100% !important; }
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