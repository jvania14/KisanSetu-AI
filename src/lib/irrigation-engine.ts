import type { ForecastDay } from "./weather";

export type CropType =
  | "wheat"
  | "rice"
  | "tomato"
  | "mustard"
  | "cotton"
  | "other";

export type CropStage =
  | "sowing"
  | "vegetative"
  | "flowering"
  | "grain_filling"
  | "maturity";

export type SoilType = "sandy" | "loamy" | "clay";

export type SoilMoistureObserved = "dry" | "medium" | "moist";

export type AreaUnit = "acres" | "hectares";

export type IrrigationRecommendationType =
  | "irrigate_now"
  | "check_soil"
  | "delay_reassess";

export interface IrrigationInput {
  cropType: CropType;
  cropStage: CropStage;
  soilType: SoilType;
  soilMoisture: SoilMoistureObserved;
  forecast?: ForecastDay[] | undefined;
  fieldArea: number;
  areaUnit: AreaUnit;
  manualRainfallMm?: number | undefined;
  fieldObservations?: string | undefined;
  depthMm?: number | undefined;
}

export interface WaterCalculationResult {
  area: number;
  unit: AreaUnit;
  depthMm: number;
  totalLitres: number;
  totalCubicMetres: number;
  breakdown: string;
  disclaimer: string;
}

export interface IrrigationRecommendation {
  recommendation: IrrigationRecommendationType;
  title: string;
  urgency: "high" | "moderate" | "low";
  reasons: string[];
  rainWarnings: string[];
  suggestedNextSteps: string[];
  assumptionsAndUncertainty: string[];
  waterEstimate?: WaterCalculationResult | undefined;
  generatedAt: string;
}

export interface SavedIrrigationPlan {
  id: string;
  createdAt: number;
  cropType: CropType;
  cropStage: CropStage;
  soilType: SoilType;
  soilMoisture: SoilMoistureObserved;
  fieldArea: number;
  areaUnit: AreaUnit;
  depthMm: number;
  recommendation: IrrigationRecommendationType;
  totalLitres: number;
  locationName?: string | undefined;
  notes?: string | undefined;
}

/**
 * 1 mm over 1 hectare (10,000 m²) = 10,000 Litres (10 m³).
 * 1 acre = 0.404685642 hectares = 4,046.85642 m².
 * 1 mm over 1 acre = 4,046.85642 Litres ≈ 4.047 m³.
 */
const LITRES_PER_MM_PER_HECTARE = 10_000;
const LITRES_PER_MM_PER_ACRE = 4_046.85642;

export function calculateWaterRequirement(params: {
  area: number;
  unit: AreaUnit;
  depthMm: number;
}): WaterCalculationResult {
  const { area, unit, depthMm } = params;

  if (isNaN(area) || area <= 0) {
    throw new Error("Field area must be a positive number.");
  }
  if (isNaN(depthMm) || depthMm <= 0) {
    throw new Error("Irrigation depth must be greater than 0 mm.");
  }

  const factor =
    unit === "hectares" ? LITRES_PER_MM_PER_HECTARE : LITRES_PER_MM_PER_ACRE;

  const totalLitres = Math.round(area * depthMm * factor);
  const totalCubicMetres = Number((totalLitres / 1000).toFixed(2));

  const breakdown =
    unit === "hectares"
      ? `${area} ha × ${depthMm} mm × 10,000 L/ha-mm = ${totalLitres.toLocaleString("en-IN")} Litres (${totalCubicMetres} m³)`
      : `${area} acres × ${depthMm} mm × 4,047 L/acre-mm = ${totalLitres.toLocaleString("en-IN")} Litres (${totalCubicMetres} m³) [1 acre = 0.405 ha]`;

  return {
    area,
    unit,
    depthMm,
    totalLitres,
    totalCubicMetres,
    breakdown,
    disclaimer:
      "Agronomic estimate: does not account for delivery losses (drip ~90% efficiency, sprinkler ~75%, furrow/flood ~50%). Adjust application duration based on actual pump discharge and soil infiltration rate.",
  };
}

export function generateIrrigationRecommendation(
  input: IrrigationInput
): IrrigationRecommendation {
  const {
    cropType,
    cropStage,
    soilType,
    soilMoisture,
    forecast = [],
    fieldArea,
    areaUnit,
    manualRainfallMm,
    fieldObservations = "",
    depthMm = 35,
  } = input;

  const reasons: string[] = [];
  const rainWarnings: string[] = [];
  const suggestedNextSteps: string[] = [];
  const assumptionsAndUncertainty: string[] = [];

  // 1. Analyze upcoming forecast rainfall (next 3 days)
  const upcoming3Days = forecast.slice(0, 3);
  let forecastRain3Days = 0;
  let maxRainProb = 0;
  let rainyDayNotice: string | null = null;

  for (const day of upcoming3Days) {
    forecastRain3Days += day.rainfall ?? 0;
    if (day.rainProbability && day.rainProbability > maxRainProb) {
      maxRainProb = day.rainProbability;
    }
    if (
      (day.rainfall >= 5 || (day.rainProbability && day.rainProbability >= 60)) &&
      !rainyDayNotice
    ) {
      rainyDayNotice = `${day.date}: ${day.rainfall.toFixed(1)} mm (${day.rainProbability ?? "N/A"}% probability)`;
    }
  }

  const effectiveRainMm = (manualRainfallMm ?? 0) + forecastRain3Days;

  // Rain alerts
  if (rainyDayNotice) {
    rainWarnings.push(
      `Rain signal in 72-hour forecast (${rainyDayNotice}). Irrigating immediately prior to rainfall may cause standing water or nutrient leaching.`
    );
  }
  if (manualRainfallMm && manualRainfallMm > 0) {
    reasons.push(
      `Farmer reported recent local rainfall of ${manualRainfallMm} mm.`
    );
  }

  // 2. Crop-specific sensitivity rules
  const isCriticalStage =
    cropStage === "flowering" ||
    (cropType === "wheat" && cropStage === "vegetative") || // Crown Root Initiation (CRI)
    (cropType === "rice" && cropStage === "vegetative") || // Tillering
    cropStage === "grain_filling";

  const isMaturityStage = cropStage === "maturity";

  // 3. Soil retention characteristics
  if (soilType === "sandy") {
    reasons.push(
      "Sandy soil has rapid drainage and low water retention; moisture depletes quickly in root zone."
    );
  } else if (soilType === "clay") {
    reasons.push(
      "Clay soil holds moisture longer but has poor aeration when saturated; susceptible to waterlogging."
    );
  } else {
    reasons.push(
      "Loamy soil provides balanced moisture retention and drainage for root aeration."
    );
  }

  // 4. Decision logic
  let recommendation: IrrigationRecommendationType = "check_soil";
  let title = "Check Soil Before Irrigating";
  let urgency: "high" | "moderate" | "low" = "moderate";

  if (isMaturityStage) {
    recommendation = "delay_reassess";
    title = "Delay Irrigation — Crop Near Maturity";
    urgency = "low";
    reasons.push(
      `${capitalize(cropType)} is at maturity stage. Irrigation at this time delays ripening and increases lodging or grain discoloration risks.`
    );
    suggestedNextSteps.push(
      "Withhold irrigation to allow even grain drying and prepare field for harvest machinery."
    );
  } else if (effectiveRainMm >= 10 || maxRainProb >= 70) {
    recommendation = "delay_reassess";
    title = "Delay Irrigation — Significant Rain Expected";
    urgency = "low";
    reasons.push(
      `Significant rain expected (${effectiveRainMm.toFixed(1)} mm cumulative or ${maxRainProb}% probability). Delaying saves fuel/electricity and prevents waterlogging.`
    );
    suggestedNextSteps.push(
      "Monitor the local sky and weather updates over the next 24-48 hours.",
      "Clear drainage outlets so that sudden heavy downpours can exit the field safely."
    );
  } else if (soilMoisture === "dry") {
    if (effectiveRainMm >= 5 || maxRainProb >= 50) {
      recommendation = "check_soil";
      title = "Check Soil Moisture — Moderate Rain Chance";
      urgency = "moderate";
      reasons.push(
        "Soil is observed as dry, but moderate rain is in the forecast. Heavy watering now could oversaturate if showers arrive."
      );
      suggestedNextSteps.push(
        "Dig 10-15 cm into the subsoil: if subsoil has dampness, hold off for 24 hours.",
        "If topsoil and subsoil are bone dry and crop shows slight wilting, apply a light partial irrigation."
      );
    } else {
      recommendation = "irrigate_now";
      title = "Irrigate Now — Moisture Deficit Detected";
      urgency = isCriticalStage ? "high" : "moderate";
      reasons.push(
        `Observed soil is dry with no significant rainfall in the 3-day forecast (${forecastRain3Days.toFixed(1)} mm).`
      );
      if (isCriticalStage) {
        reasons.push(
          `${capitalize(cropType)} is in a moisture-critical phase (${cropStage.replace("_", " ")}). Water stress now directly reduces yield.`
        );
      }
      suggestedNextSteps.push(
        "Irrigate during early morning or evening hours to minimize evaporation losses.",
        "Check distribution uniformity across the field to avoid over-irrigating headlands."
      );
    }
  } else if (soilMoisture === "moist") {
    recommendation = "delay_reassess";
    title = "Delay Irrigation — Soil Currently Moist";
    urgency = "low";
    reasons.push(
      "Field soil already has adequate moisture; further water application would waste resources and risk root hypoxia."
    );
    suggestedNextSteps.push(
      "Re-check soil moisture in 2-3 days, especially if temperatures rise.",
      "Scout for fungal pathogens that thrive in prolonged damp soil."
    );
  } else {
    // soilMoisture === "medium"
    if (soilType === "sandy" && !rainyDayNotice) {
      recommendation = "check_soil";
      title = "Check Soil Depth — Sandy Texture";
      urgency = "moderate";
      reasons.push(
        "Soil moisture is medium, but sandy soil loses water rapidly in warm conditions."
      );
      suggestedNextSteps.push(
        "Squeeze a handful of soil from 15 cm depth: if it crumbles immediately, plan irrigation within 24 hours."
      );
    } else if (effectiveRainMm >= 4) {
      recommendation = "delay_reassess";
      title = "Delay and Reassess After Forecast Rain";
      urgency = "low";
      reasons.push(
        `Soil moisture is currently moderate and light-to-moderate rain (${effectiveRainMm.toFixed(1)} mm) is anticipated.`
      );
      suggestedNextSteps.push(
        "Reassess field condition after the forecast rain window passes."
      );
    } else {
      recommendation = "check_soil";
      title = "Check Soil Before Irrigating";
      urgency = "moderate";
      reasons.push(
        "Soil moisture is at a moderate level. Irrigation should be timed to prevent the root zone from dropping below 50% available water capacity."
      );
      suggestedNextSteps.push(
        "Inspect the root zone (top 15-20 cm) in representative areas of your field.",
        "Verify weather updates before turning on pump sets."
      );
    }
  }

  // Field observations note
  if (fieldObservations.trim().length > 0) {
    reasons.push(`Field observation noted: "${fieldObservations.trim()}".`);
  }

  // Transparency and agronomic assumptions
  assumptionsAndUncertainty.push(
    "Open-Meteo numerical weather forecasts are model predictions and may differ from localized microclimates.",
    "Farmer hand-feel moisture observation is subjective; tensiometers or soil moisture probes provide higher precision.",
    "Soil water retention values assume typical profile depths without shallow hardpans or high water tables.",
    "This tool provides decision support, not an automated hardware pump actuation or verified agronomist prescription."
  );

  let waterEstimate: WaterCalculationResult | undefined;
  if (fieldArea > 0 && depthMm > 0) {
    try {
      waterEstimate = calculateWaterRequirement({
        area: fieldArea,
        unit: areaUnit,
        depthMm,
      });
    } catch {
      // ignore invalid input for water estimate
    }
  }

  return {
    recommendation,
    title,
    urgency,
    reasons,
    rainWarnings,
    suggestedNextSteps,
    assumptionsAndUncertainty,
    waterEstimate,
    generatedAt: new Date().toISOString(),
  };
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// LocalStorage helpers for saved plans
const STORAGE_KEY = "kisansetu_saved_irrigation_plans";

export function getSavedIrrigationPlans(): SavedIrrigationPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedIrrigationPlan[];
  } catch {
    return [];
  }
}

export function saveIrrigationPlan(
  plan: Omit<SavedIrrigationPlan, "id" | "createdAt">
): SavedIrrigationPlan {
  const plans = getSavedIrrigationPlans();
  const newPlan: SavedIrrigationPlan = {
    ...plan,
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  const updated = [newPlan, ...plans].slice(0, 20); // Keep last 20
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newPlan;
}

export function deleteSavedIrrigationPlan(id: string): void {
  const plans = getSavedIrrigationPlans();
  const updated = plans.filter((p) => p.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}
