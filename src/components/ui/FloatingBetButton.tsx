"use client";

import { useEffect } from "react";
import { Receipt } from "lucide-react";
import { usePathname } from "next/navigation";
import { useBetSlipStore } from "@/store/betSlip";

export default function FloatingBetButton() {
  const pathname = usePathname();
  const count = useBetSlipStore((s) => s.selections.length);
  const totalOdds = useBetSlipStore((s) => s.totalOdds());
  const toggleSlip = useBetSlipStore((s) => s.toggleSlip);
  const closeSlip = useBetSlipStore((s) => s.closeSlip);
  const isOpen = useBetSlipStore((s) => s.isOpen);

  // Safely close the slip on route change
  useEffect(() => {
    closeSlip();
  }, [pathname, closeSlip]);

  if (count === 0 || isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleSlip}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-full bg-[#00C853] px-5 py-3.5 text-black shadow-2xl shadow-[#00C853]/20 transition hover:bg-[#00E676] active:scale-95 lg:bottom-6 lg:right-6"
    >
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
        <Receipt className="h-4 w-4" />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-[#00C853]">
          {count}
        </span>
      </span>
      <span className="text-sm font-bold">
        Bet Slip · {totalOdds.toFixed(2)}
      </span>
    </button>
  );
}