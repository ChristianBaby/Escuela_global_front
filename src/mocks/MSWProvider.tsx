"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledRequest: "bypass" })
    ).then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-[#2B55A3] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
