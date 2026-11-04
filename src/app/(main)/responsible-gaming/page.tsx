export default function ResponsibleGamingPage() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Responsible Gaming</h1>
      <div className="prose prose-invert prose-sm text-wb-muted space-y-4">
        <p>Gambling should be fun, not a financial burden. We encourage you to set limits.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Set a Budget:</strong> Decide how much you can afford to lose before you start.</li>
          <li><strong>Take Breaks:</strong> Gambling should not interfere with your daily responsibilities.</li>
          <li><strong>Self-Exclusion:</strong> If you feel you are losing control, use the self-exclusion tool in your settings to freeze your account.</li>
        </ul>
        <p className="mt-4">If you need help, contact local support services in Ghana (e.g., the Mental Health Authority).</p>
      </div>
    </div>
  );
}