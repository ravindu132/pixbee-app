"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');

  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!clientId) return;

    const getData = async () => {
      // 1. Get Client Details
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientData) setClient(clientData);

      // 2. Get UNBILLED Work Only
      const { data: workData } = await supabase
        .from('work_logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'UNBILLED'); // Only get unpaid work

      if (workData) {
        setItems(workData);
        // Calculate Total
        const sum = workData.reduce((acc, item) => acc + item.cost, 0);
        setTotal(sum);
      }
    };

    getData();
  }, [clientId]);

  const markAsBilled = async () => {
    const confirm = window.confirm("Are you sure? This will mark these items as PAID/BILLED in the database.");
    if (!confirm) return;

    // Update all these items to 'BILLED'
    const { error } = await supabase
      .from('work_logs')
      .update({ status: 'BILLED' })
      .eq('client_id', clientId)
      .eq('status', 'UNBILLED');

    if (!error) {
      alert("Success! Invoice marked as billed.");
      router.push('/'); // Go back home
    }
  };

  if (!client) return <div className="p-10">Generating Invoice...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-10 max-w-3xl mx-auto border my-10 shadow-lg print:border-0 print:shadow-none">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
          <p className="text-gray-500">Invoice #{Math.floor(Math.random() * 10000)}</p>
          <p className="text-gray-500">Date: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <h2 className="font-bold text-xl">PixBee Freelance</h2>
          <p>pixbee@example.com</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-10 border-b pb-10">
        <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Bill To:</p>
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <p>{client.email || "No email on file"}</p>
      </div>

      {/* Items Table */}
      <table className="w-full mb-10">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-3">Description</th>
            <th className="py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-4">{item.description}</td>
              <td className="py-4 text-right">${item.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end mb-20">
        <div className="text-right">
          <p className="text-gray-500 mr-4">Total Due:</p>
          <h2 className="text-4xl font-bold">${total.toFixed(2)}</h2>
        </div>
      </div>

      {/* Actions (Hidden when Printing) */}
      <div className="flex gap-4 justify-center print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-gray-200 text-black px-6 py-3 rounded hover:bg-gray-300"
        >
          🖨️ Print / Save PDF
        </button>

        <button 
          onClick={markAsBilled}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          ✅ Mark as Billed
        </button>

        <button 
          onClick={() => router.back()}
          className="text-gray-500 px-6 py-3 hover:underline"
        >
          Cancel
        </button>
      </div>

    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}