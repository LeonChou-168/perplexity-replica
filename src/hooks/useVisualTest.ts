import type { Locale, VisualStateFixture } from "../types";

function boundedNumber(params: URLSearchParams, key: string, min: number, max: number): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

export function readVisualTestFixture(search = typeof window === "undefined" ? "" : window.location.search): VisualStateFixture {
  const params = new URLSearchParams(search);
  const enabled = import.meta.env.DEV && params.get("visualTest") === "1";
  if (!enabled) return { enabled: false };

  const requestedLocale = params.get("locale");
  const locale: Locale | undefined = requestedLocale === "en" || requestedLocale === "zh-CN" ? requestedLocale : undefined;
  const workflowStep = boundedNumber(params, "workflowStep", 0, 2);

  return {
    enabled,
    locale,
    verbIndex: boundedNumber(params, "verbIndex", 0, 99),
    taskIndex: boundedNumber(params, "taskIndex", 0, 99),
    unifiesProgress: boundedNumber(params, "unifiesProgress", 0, 1),
    workflowStep: workflowStep === undefined ? undefined : Math.round(workflowStep) as 0 | 1 | 2,
    mediaTime: boundedNumber(params, "mediaTime", 0, 3600),
  };
}

export function useVisualTest(): boolean {
  return readVisualTestFixture().enabled;
}
