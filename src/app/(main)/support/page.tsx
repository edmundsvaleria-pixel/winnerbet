"use client";

import { useState } from "react";
import { LifeBuoy, Mail, MessageCircle, ChevronDown, CheckCircle2 } from "lucide-react";

const FAQS = [
  { q: "How long do deposits take?", a: "Deposits via Mobile Money and Card are processed instantly." },
  { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal is GH₵ 10,000. You must also have made at least 3 successful deposits." },
  { q: "How do I load a bet using a booking code?", a: "Go to the 'My Bets' page, scroll to the 'Load Bet by Code' section, enter the 7-letter code." },
  { q: "How does the Accumulator Bonus work?", a: "When you add more than 5 selections to your bet slip, we automatically apply a bonus up to 200%." },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-24">
      <div className="text-center mb-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wb-primary/15">
          <LifeBuoy className="h-8 w-8 text-wb-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white">How can we help?</h1>
        <p className="text-sm text-wb-muted mt-2">Search our FAQs or contact our 24/7 support team.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, index) => (
              <div key={index} className="rounded-xl border border-wb-border bg-wb-surface overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between p-4 text-left">
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-wb-muted transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-sm text-wb-muted animate-fade-up">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-4">Contact Us</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a href="mailto:support@winnerbet.com" className="flex flex-col items-center justify-center rounded-xl border border-wb-border bg-wb-surface p-4 hover:border-wb-primary transition">
              <Mail className="h-6 w-6 text-wb-primary mb-2" />
              <span className="text-xs font-bold text-white">Email Us</span>
            </a>
            <a href="https://wa.me/233000000000" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center rounded-xl border border-wb-border bg-wb-surface p-4 hover:border-wb-primary transition">
              <MessageCircle className="h-6 w-6 text-wb-primary mb-2" />
              <span className="text-xs font-bold text-white">WhatsApp</span>
            </a>
          </div>

          <div className="rounded-xl border border-wb-border bg-wb-surface p-5">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-wb-primary mb-3" />
                <h3 className="text-sm font-bold text-white">Ticket Submitted</h3>
                <p className="text-xs text-wb-muted mt-1">Our team will reply to your email within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Subject</label>
                  <select required className="w-full rounded-lg border border-wb-border-strong bg-wb-bg px-3 py-2.5 text-sm text-white focus:border-wb-primary focus:outline-none">
                    <option value="deposit">Deposit Issue</option>
                    <option value="withdrawal">Withdrawal Issue</option>
                    <option value="account">Account / Login</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Message</label>
                  <textarea required rows={4} placeholder="Describe your issue..." className="w-full rounded-lg border border-wb-border-strong bg-wb-bg px-3 py-2.5 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none resize-none"></textarea>
                </div>
                <button type="submit" className="w-full rounded-lg bg-wb-primary py-2.5 text-sm font-bold text-black hover:bg-wb-primary-hover transition">
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}