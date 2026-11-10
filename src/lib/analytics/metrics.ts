import type { AnalyticsEvent } from "./store";

type Props = Record<string, unknown>;

function propsOf(event: AnalyticsEvent): Props {
  return event.props || {};
}

function pageOf(event: AnalyticsEvent) {
  return (
    event.page_path ||
    String(propsOf(event).page_path || event.path || "(sconosciuta)")
  );
}

function sessions(list: AnalyticsEvent[]) {
  const seen: Record<string, true> = {};
  list.forEach((event) => {
    if (event.session_id) seen[event.session_id] = true;
  });
  return Object.keys(seen).length;
}

function byPage(events: AnalyticsEvent[]) {
  const groups: Record<string, AnalyticsEvent[]> = {};
  events.forEach((event) => {
    const key = pageOf(event);
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  });
  return groups;
}

function maxNumber(values: Array<number | null | undefined>) {
  let max: number | null = null;
  values.forEach((value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    if (max === null || value > max) max = value;
  });
  return max;
}

function average(values: Array<number | null | undefined>) {
  const nums = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!nums.length) return null;
  return nums.reduce((total, value) => total + value, 0) / nums.length;
}

const DEPTH_EVENTS: Record<string, true> = {
  page_scroll_depth: true,
  content_dropoff: true,
  content_read_completed: true,
};

export function pages(events: AnalyticsEvent[]) {
  const groups = byPage(events);
  return Object.keys(groups)
    .map((path) => {
      const list = groups[path];
      const bySession: Record<string, AnalyticsEvent[]> = {};
      list.forEach((event) => {
        if (!event.session_id) return;
        if (!bySession[event.session_id]) bySession[event.session_id] = [];
        bySession[event.session_id].push(event);
      });
      const times: number[] = [];
      const depths: number[] = [];
      const expected: number[] = [];
      let reads = 0;
      let visits = 0;
      Object.keys(bySession).forEach((id) => {
        const mine = bySession[id];
        if (!mine.some((event) => event.name === "page_view")) return;
        visits += 1;
        const time = maxNumber(mine.map((event) => propsOf(event).time_seconds as number));
        const depth = maxNumber(
          mine.map((event) => {
            if (!DEPTH_EVENTS[event.name]) return null;
            return propsOf(event).depth_percentage as number;
          }),
        );
        if (time !== null) times.push(time);
        if (depth !== null) depths.push(depth);
        if (mine.some((event) => event.name === "content_read_completed")) reads += 1;
        mine.forEach((event) => {
          if (event.name === "page_view" && typeof propsOf(event).expected_seconds === "number") {
            expected.push(propsOf(event).expected_seconds as number);
          }
        });
      });
      return {
        page_path: path,
        visits,
        avg_time_seconds: average(times),
        avg_depth: average(depths),
        expected_seconds: average(expected),
        reads,
        measured: times.length,
      };
    })
    .sort((a, b) => b.visits - a.visits || a.page_path.localeCompare(b.page_path));
}

export function dropoff(events: AnalyticsEvent[]) {
  const groups = byPage(events);
  return Object.keys(groups)
    .map((path) => {
      const list = groups[path];
      const views: Record<string, { depth: number | null; left: boolean; section: string }> = {};
      list.forEach((event) => {
        if (!event.view_id) return;
        if (!views[event.view_id]) views[event.view_id] = { depth: null, left: false, section: "" };
        const row = views[event.view_id];
        if (event.name === "content_dropoff") {
          row.left = true;
          row.section = String(propsOf(event).section_label || row.section);
          if (typeof propsOf(event).depth_percentage === "number") {
            const depth = propsOf(event).depth_percentage as number;
            row.depth = row.depth === null ? depth : Math.max(row.depth, depth);
          }
        }
        if (event.name === "page_scroll_depth" && typeof propsOf(event).depth_percentage === "number") {
          const depth = propsOf(event).depth_percentage as number;
          row.depth = row.depth === null ? depth : Math.max(row.depth, depth);
        }
      });
      const exits = Object.keys(views)
        .map((id) => views[id])
        .filter((row) => row.left);
      const early = exits.filter((row) => row.depth !== null && row.depth < 50);
      const sections: Record<string, number> = {};
      early.forEach((row) => {
        const key = row.section || "—";
        sections[key] = (sections[key] || 0) + 1;
      });
      let topSection = "—";
      let topCount = 0;
      Object.keys(sections).forEach((key) => {
        if (sections[key] > topCount) {
          topCount = sections[key];
          topSection = key;
        }
      });
      return {
        page_path: path,
        exits: exits.length,
        early: early.length,
        rate: exits.length ? early.length / exits.length : 0,
        section_label: topSection,
      };
    })
    .filter((row) => row.exits > 0)
    .sort((a, b) => b.rate - a.rate || b.early - a.early || a.page_path.localeCompare(b.page_path));
}

export function cta(events: AnalyticsEvent[]) {
  const visitsByPage: Record<string, Record<string, true>> = {};
  events.forEach((event) => {
    if (event.name !== "page_view") return;
    const path = pageOf(event);
    if (!visitsByPage[path]) visitsByPage[path] = {};
    if (event.session_id) visitsByPage[path][event.session_id] = true;
  });
  const groups: Record<
    string,
    {
      page_path: string;
      section_label: string;
      track_id: string;
      track_copy: string;
      clicks: number;
      sessions: Record<string, true>;
    }
  > = {};
  events.forEach((event) => {
    if (event.name !== "cta_click") return;
    const path = pageOf(event);
    const section = String(propsOf(event).section_label || "—");
    const copy = String(propsOf(event).track_copy || propsOf(event).track_id || "CTA");
    const id = String(propsOf(event).track_id || copy);
    const key = `${path}|${section}|${id}`;
    if (!groups[key]) {
      groups[key] = {
        page_path: path,
        section_label: section,
        track_id: id,
        track_copy: copy,
        clicks: 0,
        sessions: {},
      };
    }
    groups[key].clicks += 1;
    if (event.session_id) groups[key].sessions[event.session_id] = true;
  });
  return Object.keys(groups)
    .map((key) => {
      const row = groups[key];
      const unique = Object.keys(row.sessions).length;
      const visits = visitsByPage[row.page_path] ? Object.keys(visitsByPage[row.page_path]).length : 0;
      return {
        page_path: row.page_path,
        section_label: row.section_label,
        track_id: row.track_id,
        track_copy: row.track_copy,
        clicks: row.clicks,
        unique_clicks: unique,
        visits,
        ctr: visits ? unique / visits : 0,
      };
    })
    .sort((a, b) => b.ctr - a.ctr || b.clicks - a.clicks);
}

export function forms(events: AnalyticsEvent[]) {
  const steps = ["view_catalog", "expand_product_details", "checkout_started", "order_completed"];
  const funnel = steps.map((name) => {
    const list = events.filter((event) => event.name === name);
    return { name, events: list.length, sessions: sessions(list) };
  });
  const fields: Record<string, { form_id: string; field_label: string; exits: number }> = {};
  events.forEach((event) => {
    if (event.name !== "form_dropoff") return;
    const formId = String(propsOf(event).form_id || "form");
    const label = String(propsOf(event).field_label || propsOf(event).field_name || "campo");
    const key = `${formId}|${label}`;
    if (!fields[key]) fields[key] = { form_id: formId, field_label: label, exits: 0 };
    fields[key].exits += 1;
  });
  const checkout = funnel[2].sessions;
  const orders = funnel[3].sessions;
  return {
    funnel,
    order_rate: checkout ? orders / checkout : 0,
    fields: Object.keys(fields)
      .map((key) => fields[key])
      .sort((a, b) => b.exits - a.exits || a.field_label.localeCompare(b.field_label)),
  };
}
