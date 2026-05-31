"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const shouldEnableMsw =
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_MSW === "true";

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!shouldEnableMsw) {
      setReady(true);
      return;
    }

    // Timeout de seguridad: si MSW no arranca en 3s, seguimos igual
    const timeout = setTimeout(() => setReady(true), 3000);

    import("./browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .then(() => {
        clearTimeout(timeout);
        setReady(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        setReady(true);
      });

    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 rounded-full border-2 border-[#2B55A3] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
