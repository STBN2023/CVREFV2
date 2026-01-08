type TeamCounterProps = {
  count: number;
};

export const TeamCounter = ({ count }: TeamCounterProps) => (
  <div className="fixed bottom-8 right-8 z-50">
    <div className="bg-[hsl(var(--brand-blue))] text-white rounded-full px-7 py-4 shadow-2xl font-bold text-xl flex items-center gap-3 border-4 border-white">
      <span>Équipe :</span>
      <span className="text-3xl">{count}</span>
    </div>
  </div>
);