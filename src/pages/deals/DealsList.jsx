import { Handshake } from 'lucide-react';
export default function DealsList() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4"><Handshake size={28} className="text-brand-gold" /></div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Deals</h1>
      <p className="text-brand-muted text-sm">Deal pipeline coming in Phase 3</p>
    </div>
  );
}
