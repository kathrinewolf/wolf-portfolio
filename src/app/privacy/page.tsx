import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Alexander Wolf Pedersen",
  description: "How alexanderwp.com and connected services handle personal data.",
};

const updated = "May 5, 2026";

export default function PrivacyPolicy() {
  return (
    <main
      style={{
        background: "var(--bg-deep, #0b0b0c)",
        color: "var(--fg, #f3efe7)",
        minHeight: "100vh",
        padding: "120px 24px 96px",
      }}
    >
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          lineHeight: 1.65,
          fontSize: 16,
        }}
      >
        <header style={{ marginBottom: 48 }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 12,
            }}
          >
            alexanderwp.com
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
            Privacy Policy
          </h1>
          <p style={{ opacity: 0.6, marginTop: 16 }}>Last updated: {updated}</p>
        </header>

        <section style={section}>
          <h2 style={h2}>Who this covers</h2>
          <p>
            This policy applies to alexanderwp.com and to the marketing and advertising
            services operated by Alexander Wolf Pedersen, including iceKore (icekore.dk)
            and any associated Meta, Google, and email-marketing activity that links here
            from those properties.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>What we collect</h2>
          <p>
            <strong>On this site (alexanderwp.com):</strong> minimal traffic logs (IP,
            user agent, referrer) collected by the hosting provider (Vercel) and standard
            error telemetry. No analytics scripts, no advertising trackers.
          </p>
          <p>
            <strong>If you contact us:</strong> the email address and message content you
            send. Used only to respond.
          </p>
          <p>
            <strong>Through advertising and marketing tools used by connected brands</strong>{" "}
            (e.g. iceKore.dk): when you click an ad or sign up to a newsletter on those
            properties, the relevant ad platform (Meta, Google) and email platform
            (Klaviyo) collect the data described in their own privacy policies, including
            cookies and pixel identifiers needed to measure ad performance and deliver
            email.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>How we use it</h2>
          <ul style={ul}>
            <li>To operate and secure this website.</li>
            <li>To respond to messages you send.</li>
            <li>
              To measure marketing performance and improve advertising on connected
              brands (e.g. iceKore.dk), in line with the consent you give on those
              properties.
            </li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p>
            We do not sell personal data. We do not use it for profiling that has legal
            or similarly significant effects on you.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Cookies</h2>
          <p>
            alexanderwp.com itself does not set tracking cookies. Connected marketing
            properties may set cookies and pixels (Meta Pixel, Google tags, Klaviyo) when
            you visit them. You can manage cookies in your browser settings and via the
            consent banners on those sites.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Sharing</h2>
          <p>
            We share data only with service providers who help us run the site and our
            marketing (hosting, analytics, advertising, email), each under written data
            processing agreements. Notable processors:
          </p>
          <ul style={ul}>
            <li>Vercel (hosting)</li>
            <li>Meta (Facebook and Instagram advertising and pixel)</li>
            <li>Google (advertising and search performance)</li>
            <li>Klaviyo (email marketing)</li>
            <li>Shopify (commerce, on connected brands)</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>International transfers</h2>
          <p>
            Some processors are based outside the EU/EEA, primarily in the United States.
            Transfers are covered by Standard Contractual Clauses or equivalent
            safeguards as required by GDPR.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Retention</h2>
          <p>
            Server logs: up to 30 days. Email correspondence: up to 24 months unless we
            have a longer legal or contractual reason to keep it. Marketing data on
            connected brands follows the retention rules in their own policies.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Your rights</h2>
          <p>
            Under GDPR you have the right to access, correct, delete, restrict, or port
            your personal data, and to object to processing. To exercise any of these,
            email{" "}
            <a href="mailto:awp683@gmail.com" style={a}>
              awp683@gmail.com
            </a>
            . You can also lodge a complaint with the Danish Data Protection Agency
            (Datatilsynet).
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Children</h2>
          <p>
            This site and the connected marketing services are not directed at children
            under 13, and we do not knowingly collect personal data from them.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Changes</h2>
          <p>
            We may update this policy. The &ldquo;last updated&rdquo; date at the top
            reflects the most recent change. Material changes will be highlighted on this
            page.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Contact</h2>
          <p>
            Alexander Wolf Pedersen
            <br />
            <a href="mailto:awp683@gmail.com" style={a}>
              awp683@gmail.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}

const section: React.CSSProperties = { marginBottom: 32 };
const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 12,
  letterSpacing: "-0.005em",
};
const ul: React.CSSProperties = { paddingLeft: 20, margin: "8px 0" };
const a: React.CSSProperties = { color: "inherit", textDecoration: "underline" };
