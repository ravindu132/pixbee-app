"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Company Info State
  const [company, setCompany] = useState({
    company_name: '',
    company_slogan: '',
    company_address: '',
    company_email: '',
    company_footer: '' // New Field
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [newBank, setNewBank] = useState({ bank_name: '', branch_name: '', account_name: '', account_number: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Company Settings
    let { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single();
    if (!settings) {
      const { data: newData } = await supabase.from('business_settings').insert([{ user_id: user.id }]).select().single();
      settings = newData;
    }
    setCompany(settings);

    // 2. Get Bank Accounts
    const { data: bankList } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('created_at');
    if (bankList) setBanks(bankList);
  };

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('business_settings').upsert({ user_id: user.id, ...company });
      alert("Settings Saved! ✅");
      router.push('/'); // Redirect to dashboard after save
    }
    setLoading(false);
  };

  const addBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) return alert("Please fill in Bank Name and Account Number");
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase.from('bank_accounts').insert([{ user_id: user.id, ...newBank }]).select();
      if (data) {
        setBanks([...banks, data[0]]);
        setNewBank({ bank_name: '', branch_name: '', account_name: '', account_number: '' }); 
      }
    }
  };

  const deleteBank = async (id: string) => {
    if (confirm("Remove this bank account?")) {
      await supabase.from('bank_accounts').delete().eq('id', id);
      setBanks(banks.filter(b => b.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 md:p-12 border">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">Business Settings</h1>
          <button onClick={() => router.push('/')} className="text-gray-400 font-bold hover:text-black">Cancel</button>
        </div>

        {/* 1. COMPANY INFO */}
        <form onSubmit={saveCompany} className="space-y-6 mb-12">
          <h2 className="text-xl font-bold flex items-center gap-2">🏢 Agency Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Agency Name</label>
                <input type="text" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={company.company_name || ''} onChange={e => setCompany({...company, company_name: e.target.value})} />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Slogan / Tagline</label>
                <input type="text" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={company.company_slogan || ''} onChange={e => setCompany({...company, company_slogan: e.target.value})} />
             </div>
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Address</label>
                <input type="text" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={company.company_address || ''} onChange={e => setCompany({...company, company_address: e.target.value})} />
             </div>
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Email / Contact</label>
                <input type="text" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={company.company_email || ''} onChange={e => setCompany({...company, company_email: e.target.value})} />
             </div>
             {/* NEW FOOTER MESSAGE FIELD */}
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Invoice Footer Message</label>
                <input type="text" placeholder="e.g. Thank you for your business!" className="w-full border-b-2 p-2 outline-none focus:border-yellow-400 font-bold" 
                  value={company.company_footer || ''} onChange={e => setCompany({...company, company_footer: e.target.value})} />
             </div>
          </div>
          <button type="submit" disabled={loading} className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition">
            {loading ? 'Saving...' : 'Save Info'}
          </button>
        </form>

        <hr className="border-gray-100 mb-10" />

        {/* 2. BANK ACCOUNTS MANAGER */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🏦 Bank Accounts</h2>
          <div className="space-y-3 mb-8">
            {banks.map(bank => (
              <div key={bank.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
                <div>
                  <p className="font-bold">{bank.bank_name}</p>
                  <p className="text-xs text-gray-500">{bank.account_number} • {bank.account_name}</p>
                </div>
                <button onClick={() => deleteBank(bank.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">🗑️</button>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
             <h3 className="font-bold text-sm uppercase mb-4 text-yellow-800">+ Add New Bank</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <input type="text" placeholder="Bank Name" className="p-3 rounded-lg border outline-none" 
                  value={newBank.bank_name} onChange={e => setNewBank({...newBank, bank_name: e.target.value})} />
               <input type="text" placeholder="Branch" className="p-3 rounded-lg border outline-none" 
                  value={newBank.branch_name} onChange={e => setNewBank({...newBank, branch_name: e.target.value})} />
               <input type="text" placeholder="Account Name" className="p-3 rounded-lg border outline-none" 
                  value={newBank.account_name} onChange={e => setNewBank({...newBank, account_name: e.target.value})} />
               <input type="text" placeholder="Account Number" className="p-3 rounded-lg border outline-none" 
                  value={newBank.account_number} onChange={e => setNewBank({...newBank, account_number: e.target.value})} />
             </div>
             <button onClick={addBank} className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition">Add Account</button>
          </div>
        </div>

      </div>
    </div>
  );
}