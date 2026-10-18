import { describe, expect, it } from "vitest";
import {
  describeWeather,
  formatWeatherDate,
  isIndianLocation,
  getRainAdvisory,
  type ForecastDay,
  type FarmLocation,
} from "@/lib/weather";

describe("Weather Utilities", () => {
  it("maps WMO weather codes to human-readable descriptions", () => {
    expect(describeWeather(0)).toBe("Clear sky");
    expect(describeWeather(1)).toBe("Mainly clear");
    expect(describeWeather(3)).toBe("Overcast");
    expect(describeWeather(45)).toBe("Fog / Mist");
    expect(describeWeather(51)).toBe("Light drizzle");
    expect(describeWeather(61)).toBe("Rain showers");
    expect(describeWeather(95)).toBe("Thunderstorm");
  });

  it("identifies Indian locations by country name or coordinates", () => {
    const loc1: FarmLocation = {
      name: "Sonipat",
      latitude: 28.99,
      longitude: 77.01,
      country: "India",
    };
    expect(isIndianLocation(loc1)).toBe(true);

    const loc2: FarmLocation = {
      name: "London",
      latitude: 51.5,
      longitude: -0.12,
      country: "United Kingdom",
    };
    expect(isIndianLocation(loc2)).toBe(false);

    // Coordinates inside India without country name
    const loc3: FarmLocation = {
      name: "Nagpur Farm",
      latitude: 21.14,
      longitude: 79.08,
    };
    expect(isIndianLocation(loc3)).toBe(true);
  });

  it("formats dates using Asia/Kolkata timezone", () => {
    const formatted = formatWeatherDate("2026-10-18");
    expect(formatted).toMatch(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/);
    expect(formatted).toContain("18");
    expect(formatted).toContain("Oct");
  });

  it("produces rain advisory warning when rain is forecast", () => {
    const rainy: ForecastDay[] = [
      { date: "2026-10-18", code: 0, min: 20, max: 30, rainProbability: 10, rainfall: 0 },
      { date: "2026-10-19", code: 61, min: 19, max: 28, rainProbability: 75, rainfall: 12 },
      { date: "2026-10-20", code: 2, min: 21, max: 29, rainProbability: 20, rainfall: 1 },
    ];
    const advisory = getRainAdvisory(rainy);
    expect(advisory).toContain("Forecast indicates rain");
    expect(advisory).toContain("75% precipitation probability");
  });

  it("produces clear advisory when no rain is forecast in next 3 days", () => {
    const clear: ForecastDay[] = [
      { date: "2026-10-18", code: 0, min: 20, max: 32, rainProbability: 0, rainfall: 0 },
      { date: "2026-10-19", code: 1, min: 19, max: 31, rainProbability: 5, rainfall: 0 },
      { date: "2026-10-20", code: 2, min: 21, max: 33, rainProbability: 10, rainfall: 0 },
    ];
    const advisory = getRainAdvisory(clear);
    expect(advisory).toContain("No significant rain signal");
  });
});

