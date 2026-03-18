"use client";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div
      style={{
        width: "280px",
        aspectRatio: "9 / 19.5",
        borderRadius: "40px",
        border: "8px solid var(--bg-elevated)",
        background: "var(--bg-card)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 0 1px var(--stroke), 0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80px",
          height: "24px",
          borderRadius: "12px",
          background: "#000",
          zIndex: 10,
        }}
      />

      {/* Content */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "32px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
