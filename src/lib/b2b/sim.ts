export type SimScenario = { price: number; cost: number };

export type SimState = {
  price: number;
  cost: number;
  margin: number;
  rest: number;
  scenario: number;
  demo: true;
};

export const SIM_KEY = "gelato.b2b.sim";

export const SIM_SCENARIOS: SimScenario[] = [
  { price: 10, cost: 4.5 },
  { price: 12, cost: 3.8 },
  { price: 14, cost: 3.2 },
  { price: 16, cost: 2.9 },
  { price: 18, cost: 2.7 },
];

export function money(value: number) {
  try {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${Number(value).toFixed(2)}`;
  }
}

export function percent(value: number) {
  try {
    return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
  } catch {
    return `${Number(value).toFixed(1)}%`;
  }
}

export function readSim(): SimState | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SIM_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSim(data: SimState) {
  try {
    sessionStorage.setItem(SIM_KEY, JSON.stringify(data));
  } catch {
    /* optional */
  }
}

export function computeScenario(index: number): SimState {
  const safe = Math.max(0, Math.min(SIM_SCENARIOS.length - 1, index));
  const scenario = SIM_SCENARIOS[safe];
  const rest = scenario.price - scenario.cost;
  const margin = (rest / scenario.price) * 100;
  return {
    price: scenario.price,
    cost: scenario.cost,
    margin: Math.round(margin * 10) / 10,
    rest: Math.round(rest * 100) / 100,
    scenario: safe,
    demo: true,
  };
}
