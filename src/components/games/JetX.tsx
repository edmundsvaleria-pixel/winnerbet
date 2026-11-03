"use client";

import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function JetX() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);

  const [stake, setStake] = useState("200");
  const [multiplier, setMultiplier] = useState(1);
  const [gameState, setGameState] = useState<"idle" | "running" | "crashed" | "cashed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const multiplierRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#2A2A2A";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      if (gameState === "idle") return;

      const currentMulti = multiplierRef.current;
      const progress = Math.min(currentMulti / 10, 1);

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      for (let x = 0; x < canvas.width * progress; x += 5) {
        const curveMulti = Math.pow(x / (canvas.width * 0.1), 1.5);
        const y = canvas.height - (curveMulti * 10);
        ctx.lineTo(x, y);
      }

      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      
      if (gameState === "crashed") {
        ctx.strokeStyle = "#EF4444";
      } else {
        ctx.strokeStyle = "#00C853";
        const tipX = canvas.width * progress;
        const tipY = canvas.height - (Math.pow(progress * 10, 1.5) * 10);
        
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.font = "24px Arial";
        ctx.fillText("🚀", -12, -12);
        ctx.restore();
      }

      ctx.stroke();

      if (gameState === "running") {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "running") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const newMulti = 1 + Math.pow(elapsed, 2) * 0.5; 
      
      multiplierRef.current = newMulti;
      setMultiplier(newMulti);
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  function startGame() {
    const stakeNum = parseFloat(stake) || 0;
    if (stakeNum < 10 || stakeNum > balance) return;

    setGameState("running");
    setMessage(null);
    setMultiplier(1);
    multiplierRef.current = 1;
    startTimeRef.current = Date.now();
  }

  async function cashOut() {
    if (gameState !== "running") return;
    
    setGameState("cashed");
    setLoading(true);
    const cashoutMultiplier = multiplierRef.current;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id, game: "jetx", stake: parseFloat(stake), action: "cashout", payload: { multiplier: cashoutMultiplier },
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      if (data.winAmount > 0) {
        setBalances(data.newAvailableBalance, data.newWithdrawableBalance); // INSTANT UPDATE
        setMessage(data.message);
        setGameState("cashed");
      } else {
        setMessage(data.message);
        setGameState("crashed");
      }
    } else {
      setMessage(data.error || "Failed to cash out");
      setGameState("idle");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative rounded-2xl border border-wb-border bg-wb-surface overflow-hidden mb-4 h-[300px]">
        <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className={`text-6xl font-black tabular-nums drop-shadow-lg ${
            gameState === "crashed" ? "text-wb-danger" : 
            gameState === "cashed" ? "text-wb-primary" : 
            "text-white"
          }`}>
            {multiplier.toFixed(2)}×
          </p>
          {gameState === "crashed" && <p className="text-wb-danger font-bold mt-2 bg-black/50 px-4 py-1 rounded-full">Crashed</p>}
          {gameState === "cashed" && <p className="text-wb-primary font-bold mt-2 bg-black/50 px-4 py-1 rounded-full">Cashed Out</p>}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          disabled={gameState === "running"}
          className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm font-semibold text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none"
        />
        <button
          onClick={gameState === "running" ? cashOut : startGame}
          disabled={loading || (gameState !== "running" && (parseFloat(stake) < 10 || parseFloat(stake) > balance))}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition ${
            gameState === "running" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-wb-primary hover:bg-wb-primary-hover disabled:opacity-40"
          }`}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
           gameState === "running" ? `Cash Out (${multiplier.toFixed(2)}×)` : "Start Game"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold text-center">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}