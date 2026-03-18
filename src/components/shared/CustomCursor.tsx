"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsTouchDevice } from "@/hooks/useMediaQuery";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isTouch = useIsTouchDevice();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest(
        'a, button, [role="button"], [data-hover]'
      );
      setIsHovering(!!el);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", () => setIsVisible(false));
    document.addEventListener("mouseenter", () => setIsVisible(true));

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.current.x}px,${current.current.y}px,0)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf.current);
      document.body.style.cursor = "";
    };
  }, [isTouch, isVisible]);

  if (isTouch) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cursorRef}
          className="fixed top-0 left-0 pointer-events-none z-[9998]"
          style={{ willChange: "transform" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ position: "relative" }}
            animate={{
              width: isHovering ? 44 : 18,
              height: isHovering ? 44 : 18,
              border: isHovering
                ? "1.5px solid rgba(255,255,255,0.40)"
                : "1.5px solid rgba(255,255,255,0.30)",
              backgroundColor: isHovering
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.0)",
              boxShadow: isHovering
                ? "0 0 16px 3px rgba(255,255,255,0.06)"
                : "0 0 12px 2px rgba(255,255,255,0.08)",
            }}
            transition={{ type: "spring", stiffness: 320, damping: 22, mass: 0.4 }}
          >
            {/* Center dot — hidden on hover */}
            <motion.div
              animate={{
                opacity: isHovering ? 0 : 1,
                scale: isHovering ? 0 : 1,
              }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 3,
                height: 3,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.4)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
