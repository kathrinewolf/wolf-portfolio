"use client";

import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { motion, useInView } from "framer-motion";

/* ───────── Constants ───────── */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ───────── Icons (inline SVG) ───────── */

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

/* ───────── Component ───────── */

export function Connect() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Header />
      <ContactMethods />
      <ContactForm />
      <Footer />
    </div>
  );
}

/* ───────── Header ───────── */

function Header() {
  return (
    <div style={{ marginBottom: 48 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={monoLabelStyle}
      >
        Connect
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="gradient-text"
        style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          marginBottom: 16,
        }}
      >
        Let&apos;s build something great.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "var(--text-tertiary)", display: "inline-flex" }}>
          <CoffeeIcon />
        </span>
        Or just grab a coffee. I&apos;m easy.
      </motion.p>
    </div>
  );
}

/* ───────── Contact Methods ───────── */

const METHODS = [
  {
    icon: EmailIcon,
    label: "Email",
    value: "ap@alexanderwp.com",
    href: "mailto:ap@alexanderwp.com",
    note: null,
  },
  {
    icon: PhoneIcon,
    label: "Phone",
    value: "+45 6136 3180",
    href: "tel:+4561363180",
    note: "Fair warning: I never pick up if I don\u2019t know the number. Shoot me a text instead.",
  },
  {
    icon: LinkedInIcon,
    label: "LinkedIn",
    value: "Alexander Wolf Pedersen",
    href: "https://www.linkedin.com/in/alexanderwolfpedersen/",
    note: null,
  },
];

function ContactMethods() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {METHODS.map((method, i) => (
          <FadeIn key={method.label} visible={inView} delay={0.1 + i * 0.1}>
            <a
              href={method.href}
              target={method.label === "LinkedIn" ? "_blank" : undefined}
              rel={method.label === "LinkedIn" ? "noopener noreferrer" : undefined}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "20px 20px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--stroke)",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.3s, background 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--stroke-hover)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--stroke)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                  flexShrink: 0,
                  transition: "color 0.3s",
                }}
              >
                <method.icon />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    marginBottom: 6,
                  }}
                >
                  {method.label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {method.value}
                </div>
                {method.note && (
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "var(--text-tertiary)",
                      marginTop: 6,
                      fontStyle: "italic",
                    }}
                  >
                    {method.note}
                  </p>
                )}
              </div>
              <div
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: 14,
                  marginTop: 4,
                  transition: "transform 0.3s",
                }}
              >
                &rarr;
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ───────── Contact Form ───────── */

function ContactForm() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const message = data.get("message") as string;

    // Simple mailto fallback
    const subject = encodeURIComponent(`Message from ${name}`);
    const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
    window.open(`mailto:ap@alexanderwp.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section ref={ref} style={{ marginBottom: 48 }}>
      <FadeIn visible={inView} delay={0.1}>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: 20,
          }}
        >
          Or drop me a message
        </div>
      </FadeIn>

      <FadeIn visible={inView} delay={0.2}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              name="name"
              placeholder="Name"
              required
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              style={{
                ...inputStyle,
                borderColor:
                  focused === "name"
                    ? "var(--stroke-hover)"
                    : "var(--stroke)",
              }}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={{
                ...inputStyle,
                borderColor:
                  focused === "email"
                    ? "var(--stroke-hover)"
                    : "var(--stroke)",
              }}
            />
          </div>

          <textarea
            name="message"
            placeholder="What's on your mind?"
            rows={5}
            required
            onFocus={() => setFocused("message")}
            onBlur={() => setFocused(null)}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 120,
              borderColor:
                focused === "message"
                  ? "var(--stroke-hover)"
                  : "var(--stroke)",
            }}
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              alignSelf: "flex-start",
              padding: "12px 28px",
              borderRadius: 12,
              background: submitted
                ? "rgba(160, 255, 200, 0.08)"
                : "rgba(255,255,255,0.06)",
              border: `1px solid ${
                submitted
                  ? "rgba(160, 255, 200, 0.2)"
                  : "var(--stroke-hover)"
              }`,
              color: submitted
                ? "rgba(160, 255, 200, 0.9)"
                : "var(--text-primary)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition:
                "background 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!submitted) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitted) {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {submitted ? "Opening mail client..." : "Send message"}
          </motion.button>
        </form>
      </FadeIn>
    </section>
  );
}

/* ───────── Footer ───────── */

function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref}>
      <FadeIn visible={inView}>
        <div
          style={{
            paddingTop: 32,
            borderTop: "1px solid var(--stroke)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            Based in Copenhagen. Available worldwide.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

/* ───────── Shared ───────── */

function FadeIn({
  children,
  visible,
  delay = 0,
}: {
  children: React.ReactNode;
  visible: boolean;
  delay?: number;
}) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ${EASE} ${delay}s, transform 0.6s ${EASE} ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const monoLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 16,
};

const inputStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--stroke)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  lineHeight: 1.5,
  outline: "none",
  transition: "border-color 0.3s, background 0.3s",
};
