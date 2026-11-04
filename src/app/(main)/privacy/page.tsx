export default function PrivacyPage() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm text-wb-muted space-y-4">
        <h2 className="text-lg font-bold text-white">1. Data We Collect</h2>
        <p>We collect your name, email, phone number, and KYC documents to comply with anti-money laundering regulations.</p>
        <h2 className="text-lg font-bold text-white">2. How We Use Data</h2>
        <p>Your data is used to process bets, verify identity, prevent fraud, and communicate account updates.</p>
        <h2 className="text-lg font-bold text-white">3. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data with regulators or law enforcement when required by law.</p>
        <h2 className="text-lg font-bold text-white">4. Security</h2>
        <p>We use industry-standard encryption to protect your data. However, no system is 100% secure.</p>
      </div>
    </div>
  );
}