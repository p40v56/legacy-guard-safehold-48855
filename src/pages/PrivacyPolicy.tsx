import { Link } from 'react-router-dom';

const PrivacyPolicy = () => (
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
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'white', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 48 }}>Last updated: 6 March 2026</p>

        <Section title="1. What Data We Collect">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><strong style={{ color: 'white' }}>Email address</strong> — used for authentication, check-in reminders, and switch notifications.</li>
            <li><strong style={{ color: 'white' }}>Encrypted vault contents</strong> — documents, account credentials, financial records, and personal messages. All encrypted client-side using AES-256-GCM before transmission. <em>We cannot read this data.</em></li>
            <li><strong style={{ color: 'white' }}>Usage logs</strong> — check-in timestamps, switch status, and basic application events for service operation.</li>
          </ul>
        </Section>

        <Section title="2. How We Use It">
          Your data is used solely to provide the LegacyVault service:
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>To authenticate your identity and maintain your session.</li>
            <li>To send check-in reminders and deadline warnings via email.</li>
            <li>To trigger switch notifications and deliver portal access to your trusted contacts when your Dead Man's Switch activates.</li>
          </ul>
          We do not use your data for advertising, profiling, or any purpose unrelated to the Service.
        </Section>

        <Section title="3. Data Storage">
          Your data is stored on infrastructure hosted in the EU region, powered by Supabase (PostgreSQL). All vault contents are encrypted at rest in addition to the client-side AES-256-GCM encryption applied before transmission. Database backups are encrypted. We do not store your encryption keys — they exist only in your browser's memory during an active session.
        </Section>

        <Section title="4. Your Rights">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><strong style={{ color: 'white' }}>Access</strong> — you can view all your stored data through the application at any time.</li>
            <li><strong style={{ color: 'white' }}>Export</strong> — data export functionality is available via the Settings page.</li>
            <li><strong style={{ color: 'white' }}>Deletion</strong> — you can permanently delete your account and all associated data via the Settings page. This action is irreversible.</li>
            <li><strong style={{ color: 'white' }}>Portability</strong> — you may request a copy of your data in a machine-readable format.</li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          LegacyVault uses session cookies only, required for authentication and maintaining your login state. We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.
        </Section>

        <Section title="6. Third Parties">
          We use the following third-party services to operate LegacyVault:
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><strong style={{ color: 'white' }}>Resend</strong> — for transactional email delivery (check-in reminders, switch notifications).</li>
            <li><strong style={{ color: 'white' }}>Supabase</strong> — for database hosting, authentication, and file storage (EU region).</li>
          </ul>
          These services process only the minimum data necessary for their function. Your encrypted vault contents are never shared with or accessible to these providers.
        </Section>

        <Section title="7. Contact">
          For privacy-related questions or to exercise your data rights, contact us at{' '}
          <a href="mailto:support@legacyvault.app" style={{ color: '#1A9BD7', textDecoration: 'underline' }}>support@legacyvault.app</a>.
        </Section>

        <Section title="8. Encryption Verification">
          Our client-side encryption implementation is publicly documented at{' '}
          <a href="/crypto-verification.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#1A9BD7', textDecoration: 'underline' }}>/crypto-verification.txt</a>.
        </Section>
      </div>
    </main>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'white', marginBottom: 12 }}>{title}</h2>
    <div style={{ fontSize: 15, color: 'rgba(255,255,255,.7)' }}>{children}</div>
  </div>
);

export default PrivacyPolicy;
