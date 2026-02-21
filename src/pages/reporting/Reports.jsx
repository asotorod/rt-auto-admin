import { BarChart3 } from 'lucide-react';
export default function Reports() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4"><BarChart3 size={28} className="text-brand-gold" /></div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Reporting</h1>
      <p className="text-brand-muted text-sm">Analytics and reporting coming in Phase 4</p>
    </div>
  );
}
