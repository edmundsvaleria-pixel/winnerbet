"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, ShieldCheck, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

export default function KycPage() {
  const [status, setStatus] = useState<string>("unverified");
  const [docType, setDocType] = useState("ghana_card");
  
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("kyc_status").eq("id", user.id).single();
      if (data) setStatus(data.kyc_status);
      setLoading(false);
    }
    loadStatus();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 2 * 1024 * 1024) {
      setMessage("File size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === "front") setFrontPreview(reader.result as string);
      else setBackPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
    if (side === "front") setFrontFile(selected);
    else setBackFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!frontPreview) return setMessage("Please upload the front of your document.");
    if (docType === "ghana_card" && !backPreview) return setMessage("Please upload the back of your Ghana Card.");
    
    setSubmitting(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("kyc_submissions").insert({
      user_id: user.id,
      document_type: docType,
      document_url: frontPreview, 
      document_url_back: backPreview, 
      status: "pending"
    });

    if (insertError) {
      setMessage(insertError.message);
      setSubmitting(false);
      return;
    }

    await supabase.from("profiles").update({ 
      kyc_status: "pending",
      kyc_document_url: frontPreview
    }).eq("id", user.id);

    setStatus("pending");
    setSubmitting(false);
    setMessage("Documents submitted successfully. Pending admin approval.");
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-6 w-6 text-wb-primary" />
        <h1 className="text-xl font-bold text-white">Identity Verification (KYC)</h1>
      </div>

      <div className={`mb-6 rounded-xl border p-4 text-sm ${status === 'verified' ? 'border-wb-primary/30 bg-wb-primary/10 text-wb-primary' : status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-wb-danger/30 bg-wb-danger/10 text-wb-danger'}`}>
        <p className="font-bold uppercase tracking-wider mb-1">Status: {status}</p>
        <p className="opacity-80">
          {status === 'unverified' && "You must verify your identity to withdraw funds over GH₵ 10,000."}
          {status === 'pending' && "Your document is under review. This usually takes 24 hours."}
          {status === 'verified' && "Your identity has been verified. You can now withdraw without limits."}
          {status === 'rejected' && "Your document was rejected. Please upload a clearer image."}
        </p>
      </div>

      {status !== 'verified' && status !== 'pending' && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-wb-border bg-wb-surface p-5">
          <div>
            <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none">
              <option value="ghana_card">Ghana Card</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">
              {docType === "ghana_card" ? "Front of Ghana Card" : "Passport Bio Page"}
            </label>
            <div className="relative border-2 border-dashed border-wb-border-strong rounded-xl p-6 text-center hover:bg-wb-sub transition">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "front")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="h-6 w-6 text-wb-muted mx-auto mb-2" />
              <p className="text-sm text-white font-medium">{frontFile ? frontFile.name : "Click to upload front image"}</p>
            </div>
            {frontPreview && <img src={frontPreview} alt="Front Preview" className="mt-3 w-full h-32 object-cover rounded-xl border border-wb-border-strong" />}
          </div>

          {docType === "ghana_card" && (
            <div>
              <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Back of Ghana Card</label>
              <div className="relative border-2 border-dashed border-wb-border-strong rounded-xl p-6 text-center hover:bg-wb-sub transition">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "back")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="h-6 w-6 text-wb-muted mx-auto mb-2" />
                <p className="text-sm text-white font-medium">{backFile ? backFile.name : "Click to upload back image"}</p>
              </div>
              {backPreview && <img src={backPreview} alt="Back Preview" className="mt-3 w-full h-32 object-cover rounded-xl border border-wb-border-strong" />}
            </div>
          )}

          {message && <p className="text-sm text-wb-danger font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {message}</p>}

          <button type="submit" disabled={submitting || !frontFile || (docType === 'ghana_card' && !backFile)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-40">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Verification"}
          </button>
        </form>
      )}
    </div>
  );
}
