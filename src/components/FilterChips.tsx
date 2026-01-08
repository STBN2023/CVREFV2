import { Button } from "@/components/ui/button";
import { useState } from "react";

type FilterChipsProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  scrollable?: boolean;
  maxHeight?: number | string; // e.g. 200 or "12rem"
  collapsible?: boolean;
  initialVisible?: number;
  moreLabel?: string;
  lessLabel?: string;
};

export const FilterChips = ({ options, selected, onChange, label, scrollable = false, maxHeight, collapsible = false, initialVisible = 10, moreLabel = "Voir plus", lessLabel = "Voir moins" }: FilterChipsProps) => {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const [expanded, setExpanded] = useState(false);
  const effInitial = Math.max(0, initialVisible ?? 0);
  const visibleOptions = collapsible && !expanded ? options.slice(0, effInitial) : options;

  const chips = (
    <div className="flex flex-wrap gap-2">
      {visibleOptions.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Button
            key={option}
            variant={isSelected ? "default" : "outline"}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition
              border-2
              ${
                isSelected
                  ? "bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-dark))] border-[hsl(var(--brand-yellow))] shadow focus:ring-2 focus:ring-[hsl(var(--brand-yellow))/0.6]"
                  : "border-[hsl(var(--brand-dark))] text-[hsl(var(--brand-dark))] bg-white hover:bg-[hsl(var(--brand-pale))] focus:ring-2 focus:ring-[hsl(var(--brand-blue))/0.4]"
              }
              focus:outline-none
            `}
            onClick={() => toggle(option)}
            type="button"
            aria-pressed={isSelected}
            tabIndex={0}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );

  const maxH = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  return (
    <div>
      {label && <div className="mb-2 text-sm font-semibold text-[hsl(var(--brand-dark))]">{label}</div>}
      {scrollable ? (
        <div className="overflow-y-auto pr-1" style={maxH ? { maxHeight: maxH } : undefined}>
          {chips}
        </div>
      ) : (
        chips
      )}
      {collapsible && options.length > effInitial && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full px-4 py-1.5 border-2 border-[hsl(var(--brand-dark))] text-[hsl(var(--brand-dark))] bg-white hover:bg-[hsl(var(--brand-pale))]"
          >
            {expanded ? lessLabel : moreLabel}
          </Button>
        </div>
      )}
    </div>
  );
};