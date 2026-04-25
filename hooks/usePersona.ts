"use client";
import { useState, useEffect } from "react";

export const AMIRAH_ID = "00000000-0000-0000-0000-000000000001";
export const MARTIN_ID = "00000000-0000-0000-0000-000000000002";

export function usePersona() {
  // Always start with Amirah for SSR, then immediately hydrate from local storage
  const [userId, setUserId] = useState<string>(AMIRAH_ID);
  const [isMartin, setIsMartin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bajet_persona");
    if (saved === MARTIN_ID) {
      setUserId(MARTIN_ID);
      setIsMartin(true);
    }
    setIsReady(true);
  }, []);

  const togglePersona = () => {
    const next = isMartin ? AMIRAH_ID : MARTIN_ID;
    localStorage.setItem("bajet_persona", next);
    window.location.reload(); // Simplest way to cleanly reset all state
  };

  return { userId, isMartin, togglePersona, isReady };
}
