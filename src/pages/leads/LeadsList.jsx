import { Users } from 'lucide-react';
export default function LeadsList() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4">
        <Users size={28} className="text-brand-gold" />
      </div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Leads</h1>
      <p className="text-brand-muted text-sm">Lead management coming in Phase 2</p>
    </div>
  );
}
