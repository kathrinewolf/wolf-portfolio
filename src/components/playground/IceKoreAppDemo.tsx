"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneFrame } from "./PhoneFrame";

interface Props {
  isVisible: boolean;
}

export function IceKoreAppDemo({ isVisible }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <PhoneFrame>
          <video
            ref={videoRef}
            src="/playground/icekore-app.mov"
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </PhoneFrame>
      </motion.div>
    </div>
  );
}
