import { describe, expect, it } from "vitest";
import {
  calculateWaterRequirement,
  generateIrrigationRecommendation,
  type IrrigationInput,
} from "@/lib/irrigation-engine";
import type { ForecastDay } from "@/lib/weather";

describe("Irrigation Water Calculator", () => {
  it("calculates litres and cubic metres accurately for hectares (1 mm over 1 ha = 10,000 L)", () => {
    // 1 hectare, 10 mm depth => 1 * 10 * 10,000 = 100,000 Litres = 100 m3
    const res = calculateWaterRequirement({
      area: 1,
      unit: "hectares",
      depthMm: 10,
    });
    expect(res.totalLitres).toBe(100_000);
    expect(res.totalCubicMetres).toBe(100);
    expect(res.breakdown).toContain("1,00,000 Litres (100 m³)");
  });

  it("calculates litres and cubic metres accurately for acres (1 mm over 1 acre = 4,046.86 L)", () => {
    // 2 acres, 25 mm depth => 2 * 25 * 4046.85642 = 202,343 Litres = 202.34 m3
    const res = calculateWaterRequirement({
      area: 2,
      unit: "acres",
      depthMm: 25,
    });
    expect(res.totalLitres).toBe(202_343);
    expect(res.totalCubicMetres).toBe(202.34);
  });

  it("throws validation errors for non-positive area or depth", () => {
    expect(() =>
      calculateWaterRequirement({
        area: 0,
        unit: "acres",
        depthMm: 10,
      })
    ).toThrow("Field area must be a positive number.");

    expect(() =>
      calculateWaterRequirement({
        area: 2,
        unit: "hectares",
        depthMm: -5,
      })
    ).toThrow("Irrigation depth must be greater than 0 mm.");
  });
});

describe("Irrigation Recommendation Engine", () => {
  const mockDryForecast: ForecastDay[] = [
    {
      date: "2026-10-18",
      code: 0,
      min: 18,
      max: 32,
      rainProbability: 5,
      rainfall: 0,
    },
    {
      date: "2026-10-19",
      code: 1,
      min: 19,
      max: 33,
      rainProbability: 10,
      rainfall: 0,
    },
    {
      date: "2026-10-20",
      code: 1,
      min: 20,
      max: 34,
      rainProbability: 5,
      rainfall: 0,
    },
  ];

  const mockRainyForecast: ForecastDay[] = [
    {
      date: "2026-10-18",
      code: 61,
      min: 18,
      max: 26,
      rainProbability: 80,
      rainfall: 15,
    },
    {
      date: "2026-10-19",
      code: 63,
      min: 17,
      max: 25,
      rainProbability: 75,
      rainfall: 22,
    },
    {
      date: "2026-10-20",
      code: 2,
      min: 19,
      max: 28,
      rainProbability: 20,
      rainfall: 1,
    },
  ];

  it("recommends irrigate_now when soil is dry and no rain is forecast during flowering", () => {
    const input: IrrigationInput = {
      cropType: "wheat",
      cropStage: "flowering",
      soilType: "loamy",
      soilMoisture: "dry",
      forecast: mockDryForecast,
      fieldArea: 2.5,
      areaUnit: "acres",
      depthMm: 40,
    };

    const result = generateIrrigationRecommendation(input);
    expect(result.recommendation).toBe("irrigate_now");
    expect(result.urgency).toBe("high");
    expect(result.reasons.some((r) => r.includes("flowering"))).toBe(true);
    expect(result.waterEstimate?.totalLitres).toBeGreaterThan(0);
    expect(result.assumptionsAndUncertainty.length).toBeGreaterThan(0);
  });

  it("recommends delay_reassess when significant rain is forecast even if soil is dry", () => {
    const input: IrrigationInput = {
      cropType: "wheat",
      cropStage: "vegetative",
      soilType: "clay",
      soilMoisture: "dry",
      forecast: mockRainyForecast,
      fieldArea: 1.5,
      areaUnit: "hectares",
      depthMm: 30,
    };

    const result = generateIrrigationRecommendation(input);
    expect(result.recommendation).toBe("delay_reassess");
    expect(result.rainWarnings.length).toBeGreaterThan(0);
  });

  it("recommends delay_reassess when soil is already moist", () => {
    const input: IrrigationInput = {
      cropType: "rice",
      cropStage: "grain_filling",
      soilType: "clay",
      soilMoisture: "moist",
      forecast: mockDryForecast,
      fieldArea: 2,
      areaUnit: "acres",
    };

    const result = generateIrrigationRecommendation(input);
    expect(result.recommendation).toBe("delay_reassess");
    expect(result.urgency).toBe("low");
  });

  it("recommends delay_reassess when crop is at maturity", () => {
    const input: IrrigationInput = {
      cropType: "mustard",
      cropStage: "maturity",
      soilType: "loamy",
      soilMoisture: "dry",
      forecast: mockDryForecast,
      fieldArea: 3,
      areaUnit: "acres",
    };

    const result = generateIrrigationRecommendation(input);
    expect(result.recommendation).toBe("delay_reassess");
    expect(result.reasons.some((r) => r.includes("maturity"))).toBe(true);
  });

  it("recommends check_soil when moisture is medium in sandy soil", () => {
    const input: IrrigationInput = {
      cropType: "tomato",
      cropStage: "vegetative",
      soilType: "sandy",
      soilMoisture: "medium",
      forecast: mockDryForecast,
      fieldArea: 1,
      areaUnit: "acres",
    };

    const result = generateIrrigationRecommendation(input);
    expect(result.recommendation).toBe("check_soil");
    expect(result.reasons.some((r) => r.includes("Sandy soil"))).toBe(true);
  });
});
