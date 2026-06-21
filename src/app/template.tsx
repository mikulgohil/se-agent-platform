"use client";

import { motion } from "motion/react";

/**
 * App Router `template.tsx` re-mounts on every navigation, so wrapping children
 * here gives a subtle page-transition on route change. Children stay server
 * components — only this thin wrapper is client.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
