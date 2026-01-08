import TeamSelectionStepV2 from "@/components/TeamSelectionStepV2";
import { MadeWithDyad } from "@/components/made-with-dyad";

const TeamV2 = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-lightblue))] flex flex-col">
      {/* Bandeau titre Équipe */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/80 border-b border-brand-dark/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <h1 className="text-xl font-bold text-brand-dark">Équipe</h1>
        </div>
      </div>

      <TeamSelectionStepV2 />
      <MadeWithDyad />
    </div>
  );
};

export default TeamV2;
