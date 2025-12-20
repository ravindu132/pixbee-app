"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_name: '',
    company_slogan: '',
    company_address: '',
    company_email: '',
    company_phone: '', // 🟢 NEW FIELD
    company_footer: '',
    invoice_sequence: 200,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single();
      if (data) setFormData(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('business_settings')
      .upsert({ user_id: user.id, ...formData });

    if (error) alert('Error saving settings');
    else alert('Settings saved successfully!');
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-black mb-6">Business Settings</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-400">Company Name</label>
          <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full p-3 border rounded-lg font-bold" />
        </div>
        
        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">Company Slogan</label>
           <input name="company_slogan" value={formData.company_slogan} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        {/* 🟢 NEW PHONE FIELD */}
        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">WhatsApp / Phone Number</label>
           <input 
             name="company_phone" 
             placeholder="+94 77 123 4567"
             value={formData.company_phone} 
             onChange={handleChange} 
             className="w-full p-3 border rounded-lg font-mono" 
           />
           <p className="text-[10px] text-gray-400 mt-1">Include country code (e.g. +94) for the QR code to work.</p>
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">Address</label>
           <input name="company_address" value={formData.company_address} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">Email</label>
           <input name="company_email" value={formData.company_email} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">Invoice Footer Message</label>
           <input name="company_footer" value={formData.company_footer} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-400">Next Invoice Sequence</label>
           <input type="number" name="invoice_sequence" value={formData.invoice_sequence} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        <button onClick={handleSave} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform">
          Save Settings
        </button>
      </div>
    </div>
  );
}