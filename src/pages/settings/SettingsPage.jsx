import { Settings } from 'lucide-react';
export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4"><Settings size={28} className="text-brand-gold" /></div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Settings</h1>
      <p className="text-brand-muted text-sm">Dealership settings coming soon</p>
    </div>
  );
}
