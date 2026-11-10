import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { capture, ensureSessionId } from "../lib/analytics/store";

function nearestSection(el: Element | null): string {
  let node: Element | null = el;
  while (node) {
    const section = node.getAttribute("data-section");
    if (section) return section;
    node = node.parentElement;
  }
  return "";
}

export function AnalyticsBootstrap() {
  const location = useLocation();

  useEffect(() => {
    ensureSessionId();
    capture("page_view", {
      page_path: location.pathname + location.hash,
      title: document.title,
    });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const tracked = target?.closest?.("[data-track-id]") as HTMLElement | null;
      if (!tracked) return;
      capture("cta_click", {
        track_id: tracked.getAttribute("data-track-id") || "",
        track_copy: tracked.getAttribute("data-track-copy") || tracked.textContent?.trim() || "",
        section_label: nearestSection(tracked),
        page_path: window.location.pathname + window.location.hash,
      });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
