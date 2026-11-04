"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Mail, Send, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AdminSendEmailPage() {
  const [users, setUsers] = useState<{ email: string; username: string }[]>([]);
  const [targetEmail, setTargetEmail] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase.from("profiles").select("email, username");
      if (data) setUsers(data.filter(u => u.email));
    }
    loadUsers();
  }, []);

  async function handleAIGenerate() {
    if (!subject) {
      alert("Please enter a subject first so the AI knows what to write about.");
      return;
    }
    setAiLoading(true);
    setStatus(null);
    
    try {
      const res = await fetch("/api/admin/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Write a professional and exciting promotional email for a sports betting platform called RiggedWin. The email is about: "${subject}". Keep it short, engaging, and do not use placeholders like [Name].` 
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessage(data.text);
      } else {
        throw new Error(data.error || "Failed to generate");
      }
    } catch (err: any) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, subject, message }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", text: `Successfully sent to ${data.sent} user(s).` });
        setSubject(""); 
        setMessage("");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm font-bold text-wb-primary hover:underline">← Back to Admin</Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Mail className="h-6 w-6 text-wb-primary" /> Send Email
      </h1>

      <form onSubmit={handleSend} className="space-y-4 rounded-2xl border border-wb-border bg-wb-surface p-6">
        {/* Target Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Recipient</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-muted" />
            <select 
              value={targetEmail} 
              onChange={(e) => setTargetEmail(e.target.value)}
              className="w-full rounded-xl border border-wb-border-strong bg-wb-sub pl-10 pr-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none"
            >
              <option value="ALL">All Registered Users ({users.length})</option>
              {users.map((u, i) => (
                <option key={i} value={u.email}>{u.username} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Subject</label>
          <input 
            type="text" value={subject} onChange={(e) => setSubject(e.target.value)} 
            placeholder="e.g. New Promo Alert!" required 
            className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" 
          />
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-wb-muted uppercase">Message</label>
            <button 
              type="button" 
              onClick={handleAIGenerate} 
              disabled={aiLoading || !subject}
              className="flex items-center gap-1.5 text-xs font-bold text-wb-primary hover:text-white transition disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiLoading ? "Generating..." : "Auto-Generate with AI"}
            </button>
          </div>
          <textarea 
            value={message} onChange={(e) => setMessage(e.target.value)} 
            placeholder="Type your message here or use the AI generator..." required rows={8}
            className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none resize-none" 
          />
        </div>

        {status && (
          <div className={`p-3 rounded-lg text-sm font-medium ${status.type === "success" ? "bg-wb-primary/10 text-wb-primary" : "bg-wb-danger/10 text-wb-danger"}`}>
            {status.text}
          </div>
        )}

        <button type="submit" disabled={loading || !subject || !message} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3.5 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-50 transition">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Sending..." : "Send Email"}
        </button>
      </form>
    </div>
  );
}