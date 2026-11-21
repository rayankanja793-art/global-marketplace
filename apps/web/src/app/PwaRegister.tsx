
"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Global-ServiceMarket service worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
