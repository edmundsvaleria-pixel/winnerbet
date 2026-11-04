export default function TermsPage() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Terms & Conditions</h1>
      <div className="prose prose-invert prose-sm text-wb-muted space-y-4">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
        <p>By accessing or using RiggedWin ("the Service"), you agree to be bound by these Terms. If you do not agree, you must not use the Service.</p>
        
        <h2 className="text-lg font-bold text-white">2. Eligibility</h2>
        <p>You must be at least 18 years old to use this Service. It is your responsibility to ensure that online gambling is legal in your jurisdiction before placing any bets.</p>

        <h2 className="text-lg font-bold text-white">3. Account & KYC</h2>
        <p>Users must provide accurate information. We reserve the right to request identity verification (KYC) before processing withdrawals. Accounts with incomplete KYC may be restricted from withdrawing funds.</p>

        <h2 className="text-lg font-bold text-white">4. Deposits & Withdrawals</h2>
        <p>Minimum deposit is GH₵ 200. Minimum withdrawal is GH₵ 10,000. A 10% commission is required to process withdrawals. Users must have at least 3 successful deposits to be eligible for withdrawal.</p>

        <h2 className="text-lg font-bold text-white">5. Responsible Gambling</h2>
        <p>Gambling involves financial risk. Never bet more than you can afford to lose. We provide self-exclusion and deposit limit tools in your account settings.</p>

        <h2 className="text-lg font-bold text-white">6. License & Regulatory</h2>
        <p>RiggedWin operates under the laws of [Insert Jurisdiction]. [Insert License Number if applicable]. We reserve the right to void bets in the event of obvious pricing errors or technical malfunctions.</p>
      </div>
    </div>
  );
}