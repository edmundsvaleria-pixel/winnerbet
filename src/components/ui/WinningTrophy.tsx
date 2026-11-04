"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

export default function WinningTrophy() {
  const [showTrophy, setShowTrophy] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const symbol = useUserStore((s) => s.symbol);
  const addWinnings = useUserStore((s) => s.addWinnings);
  
  // Use a ref to prevent duplicate subscriptions in Strict Mode
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // If a channel already exists, clean it up first
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Create the channel instance
      const channel = supabase.channel(`user-bets-${user.id}`);
      
      // IMPORTANT: Add the listener BEFORE subscribing
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBet = payload.new;
          if (newBet.status === "won") {
            setWinAmount(Number(newBet.potential_win));
            setShowTrophy(true);
            // Optional: addWinnings(Number(newBet.potential_win));
          }
        }
      );

      // Now subscribe
      channel.subscribe();
      channelRef.current = channel;
    }

    setupRealtime();

    return () => {
      isMounted = false;
      // Cleanup: Remove the channel on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {showTrophy && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-wb-primary/30 bg-gradient-to-b from-wb-surface to-wb-bg p-8 text-center shadow-2xl shadow-wb-primary/20">
            <button 
              onClick={() => setShowTrophy(false)}
              className="absolute top-4 right-4 text-wb-muted hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-wb-primary/10"
            >
              <Trophy className="h-12 w-12 text-wb-primary" />
            </motion.div>

            <h2 className="text-2xl font-black text-white mb-2">Congratulations!</h2>
            <p className="text-sm text-wb-muted mb-4">You just won a bet!</p>
            
            <div className="rounded-xl bg-wb-bg border border-wb-border-strong p-4 mb-6">
              <p className="text-xs text-wb-muted uppercase">Winnings</p>
              <p className="text-3xl font-black text-wb-primary tabular-nums">
                {symbol} {winAmount.toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => setShowTrophy(false)}
              className="w-full rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover"
            >
              Awesome!
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}