import { Link } from 'react-router-dom';

const TermsOfService = () => (
  <div id="lv-root">
    <header style={{ background: '#0D1B2A', padding: '20px 0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(26,155,215,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A9BD7" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'white' }}>LegacyVault</span>
        </Link>
        <Link to="/auth" style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, textDecoration: 'none' }}>Log in</Link>
      </div>
    </header>

    <main style={{ background: '#0D1B2A', minHeight: '100vh', padding: '60px 24px 100px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', color: 'rgba(255,255,255,.85)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'white', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 48 }}>Last updated: 6 March 2026</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using LegacyVault ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
        </Section>

        <Section title="2. Description of Service">
          LegacyVault is a zero-knowledge encrypted digital legacy management service. It allows you to securely store documents, account credentials, financial information, and personal messages — and configure automatic delivery to designated trusted contacts via a Dead Man's Switch mechanism. All data is encrypted client-side using AES-256-GCM before being transmitted to our servers. We cannot access, read, or decrypt your data.
        </Section>

        <Section title="3. User Responsibilities">
          You are solely responsible for maintaining the confidentiality of your account password. Your encryption keys are derived from your password and never leave your device. <strong style={{ color: 'white' }}>If you lose your password, your data cannot be recovered.</strong> We cannot reset your encryption keys or access your vault contents under any circumstances. You agree to provide accurate information and to use the Service in compliance with all applicable laws.
        </Section>

        <Section title="4. Data and Privacy">
          LegacyVault operates on a zero-knowledge architecture. Your data is encrypted in your browser before it reaches our servers. We store only ciphertext. We cannot read your documents, account credentials, personal messages, or any other vault contents. For full details, see our <Link to="/privacy" style={{ color: '#1A9BD7', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </Section>

        <Section title="5. Service Availability">
          We aim to provide reliable and continuous access to the Service, but we do not guarantee 100% uptime. The Service is provided on a "best effort" basis. We may perform maintenance, updates, or experience outages that temporarily affect availability. We will endeavour to provide advance notice of planned maintenance where possible.
        </Section>

        <Section title="6. Limitation of Liability">
          LegacyVault is a digital tool designed to assist with legacy planning. <strong style={{ color: 'white' }}>It is not a substitute for professional legal advice, a solicitor, or a licensed financial advisor.</strong> We strongly recommend that you consult qualified professionals for estate planning, will preparation, and financial matters. To the maximum extent permitted by law, LegacyVault shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
        </Section>

        <Section title="7. Termination">
          You may delete your account at any time via the Settings page. Upon deletion, all your data — including encrypted vault contents, contacts, documents, and account credentials — will be permanently removed from our servers. We reserve the right to suspend or terminate accounts that violate these terms or are used for unlawful purposes.
        </Section>

        <Section title="8. Governing Law">
          These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms or the use of the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </Section>

        <Section title="9. Contact">
          If you have questions about these Terms, please contact us at{' '}
          <a href="mailto:support@legacyvault.app" style={{ color: '#1A9BD7', textDecoration: 'underline' }}>support@legacyvault.app</a>.
        </Section>
      </div>
    </main>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'white', marginBottom: 12 }}>{title}</h2>
    <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)' }}>{children}</p>
  </div>
);

export default TermsOfService;
