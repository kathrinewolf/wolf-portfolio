"use client";

import { motion } from "framer-motion";

interface AnimatedCursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}

export function AnimatedCursor({ x, y, clicking, visible = true }: AnimatedCursorProps) {
  return (
    <motion.div
      animate={{
        x,
        y,
        opacity: visible ? 1 : 0,
        scale: clicking ? 0.8 : 1,
      }}
      transition={{
        x: { type: "spring", stiffness: 120, damping: 20 },
        y: { type: "spring", stiffness: 120, damping: 20 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.1 },
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 0 12px rgba(255, 255, 255, 0.3), 0 0 4px rgba(255, 255, 255, 0.5)",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {/* Click ripple */}
      {clicking && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        />
      )}
    </motion.div>
  );
}
