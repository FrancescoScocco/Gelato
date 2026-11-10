import { type ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, type Location } from "react-router-dom";

type Props = {
  children: (location: Location) => ReactNode;
};

function scrollFor(location: Location) {
  if (location.hash) {
    const id = location.hash.slice(1);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/**
 * Soft exit → enter between Home, B2B and Franquias.
 * Hash-only changes on the same path skip the animation.
 */
export function PageTransition({ children }: Props) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState<"enter" | "exit" | "idle">("enter");
  const settleRef = useRef(0);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) {
      if (location.hash !== displayLocation.hash || location.search !== displayLocation.search) {
        setDisplayLocation(location);
        scrollFor(location);
      }
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplayLocation(location);
      setPhase("idle");
      scrollFor(location);
      return;
    }

    setPhase("exit");
    const timer = window.setTimeout(() => {
      setDisplayLocation(location);
      setPhase("enter");
      scrollFor(location);
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(() => setPhase("idle"), 520);
    }, 240);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(settleRef.current);
    };
  }, [location, displayLocation.hash, displayLocation.pathname, displayLocation.search]);

  return (
    <div
      className={`page-transition page-transition--${phase}`}
      data-page={displayLocation.pathname || "/"}
    >
      {children(displayLocation)}
    </div>
  );
}
