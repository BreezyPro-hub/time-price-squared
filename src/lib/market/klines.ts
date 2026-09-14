import { createServerFn } from "@tanstack/react-start";
import type { Interval } from "./symbols";

export const getKlines = createServerFn({ method: "POST" })
  .validator((d: { symbol: string; interval: string }) => d)
  .handler(async ({ data }) => {
    const { loadMarket } = await import("./fetch.server");
    return loadMarket(data.symbol, data.interval as Interval);
  });
