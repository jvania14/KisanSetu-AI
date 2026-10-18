import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  CloudRain,
  Calculator,
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  Trash2,
  BookmarkCheck,
  X,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

import {
  calculateWaterRequirement,
  generateIrrigationRecommendation,
  getSavedIrrigationPlans,
  saveIrrigationPlan,
  deleteSavedIrrigationPlan,
  type CropType,
  type CropStage,
  type SoilType,
  type SoilMoistureObserved,
  type AreaUnit,
  type IrrigationInput,
  type IrrigationRecommendation,
  type SavedIrrigationPlan,
  type WaterCalculationResult,
} from "@/lib/irrigation-engine";

import type { FarmLocation, FarmWeather, ForecastDay } from "@/lib/weather";
import WeatherWidget from "@/components/weather/WeatherWidget";

interface IrrigationPlannerProps {
  currentLocation?: FarmLocation | undefined;
  weather?: FarmWeather | null | undefined;
  selectedCrop?: string | undefined;
  onNavigateToAdvisory?: ((prompt: string) => void) | undefined;
  notify?: ((msg: string) => void) | undefined;
}

export default function IrrigationPlanner({
  currentLocation,
  weather,
  selectedCrop = "wheat",
  onNavigateToAdvisory,
  notify = () => {},
}: IrrigationPlannerProps) {
  // Form state
  const [cropType, setCropType] = useState<CropType>(() => {
    const c = selectedCrop.toLowerCase();
    if (["wheat", "rice", "tomato", "mustard", "cotton"].includes(c)) {
      return c as CropType;
    }
    return "wheat";
  });

  const [cropStage, setCropStage] = useState<CropStage>("flowering");
  const [soilType, setSoilType] = useState<SoilType>("loamy");
  const [soilMoisture, setSoilMoisture] = useState<SoilMoistureObserved>("medium");
  const [fieldArea, setFieldArea] = useState<string>("2.0");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("acres");
  const [depthMm, setDepthMm] = useState<string>("35");
  const [manualRainfall, setManualRainfall] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  // Saved plans state
  const [savedPlans, setSavedPlans] = useState<SavedIrrigationPlan[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Load saved plans on mount
  useEffect(() => {
    setSavedPlans(getSavedIrrigationPlans());
  }, []);

  // Update cropType if prop changes
  useEffect(() => {
    const c = selectedCrop.toLowerCase();
    if (["wheat", "rice", "tomato", "mustard", "cotton"].includes(c)) {
      setCropType(c as CropType);
    }
  }, [selectedCrop]);

  const numArea = parseFloat(fieldArea) || 0;
  const numDepth = parseFloat(depthMm) || 0;
  const numManualRain = manualRainfall ? parseFloat(manualRainfall) || 0 : undefined;

  // Real forecast from weather telemetry if available
  const forecast: ForecastDay[] = weather?.forecast ?? [];

  // Generate recommendation whenever inputs change
  const recommendation: IrrigationRecommendation = useMemo(() => {
    const input: IrrigationInput = {
      cropType,
      cropStage,
      soilType,
      soilMoisture,
      forecast,
      fieldArea: numArea > 0 ? numArea : 1,
      areaUnit,
      depthMm: numDepth > 0 ? numDepth : 35,
      manualRainfallMm: numManualRain,
      fieldObservations: observations,
    };
    return generateIrrigationRecommendation(input);
  }, [
    cropType,
    cropStage,
    soilType,
    soilMoisture,
    forecast,
    numArea,
    areaUnit,
    numDepth,
    numManualRain,
    observations,
  ]);

  // Water calculation result
  const waterResult: WaterCalculationResult | null = useMemo(() => {
    if (numArea <= 0 || numDepth <= 0) return null;
    try {
      return calculateWaterRequirement({
        area: numArea,
        unit: areaUnit,
        depthMm: numDepth,
      });
    } catch {
      return null;
    }
  }, [numArea, areaUnit, numDepth]);

  // Actions
  const handleReset = () => {
    setCropType("wheat");
    setCropStage("flowering");
    setSoilType("loamy");
    setSoilMoisture("medium");
    setFieldArea("2.0");
    setAreaUnit("acres");
    setDepthMm("35");
    setManualRainfall("");
    setObservations("");
    notify("Irrigation inputs reset to standard defaults.");
  };

  const handleSavePlan = () => {
    if (numArea <= 0 || numDepth <= 0) {
      notify("Please provide a valid area and irrigation depth to save.");
      return;
    }

    const saved = saveIrrigationPlan({
      cropType,
      cropStage,
      soilType,
      soilMoisture,
      fieldArea: numArea,
      areaUnit,
      depthMm: numDepth,
      recommendation: recommendation.recommendation,
      totalLitres: waterResult?.totalLitres ?? 0,
      locationName: currentLocation?.name ?? "Sonipat, Haryana",
      notes: observations,
    });

    setSavedPlans((prev) => [saved, ...prev]);
    notify("Irrigation plan saved to this device (localStorage).");
  };

  const handleLoadPlan = (p: SavedIrrigationPlan) => {
    setCropType(p.cropType);
    setCropStage(p.cropStage);
    setSoilType(p.soilType);
    setSoilMoisture(p.soilMoisture);
    setFieldArea(String(p.fieldArea));
    setAreaUnit(p.areaUnit);
    setDepthMm(String(p.depthMm));
    if (p.notes) setObservations(p.notes);
    setShowSavedModal(false);
    notify(`Loaded saved plan for ${p.cropType} (${p.fieldArea} ${p.areaUnit}).`);
  };

  const handleDeletePlan = (id: string) => {
    deleteSavedIrrigationPlan(id);
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    notify("Plan removed from local storage.");
  };

  // Color mappings for recommendation badge
  const badgeColors = {
    irrigate_now: "bg-emerald-100 text-emerald-800 border-emerald-300",
    check_soil: "bg-amber-100 text-amber-800 border-amber-300",
    delay_reassess: "bg-blue-100 text-blue-800 border-blue-300",
  }[recommendation.recommendation];

  return (
    <div className="space-y-6">
      {/* Real Weather Widget Section */}
      <WeatherWidget initialLocation={currentLocation} />

      {/* Main Irrigation Recommendation Workspace */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        {/* Left: Input Form */}
        <section className="rounded-3xl border border-[#dfe7dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ea] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f3e4] text-[#247547]">
                <Droplets size={22} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#143e2b]">
                  Agronomic Irrigation Engine
                </h2>
                <p className="text-xs text-[#758478]">
                  Crop stage · Hand-feel moisture · Weather context
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSavedModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#dce5da] bg-[#f7faf5] px-3 py-2 text-xs font-bold text-[#23583a] hover:bg-[#edf4eb]"
              >
                <BookmarkCheck size={15} />
                <span>Saved Plans ({savedPlans.length})</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset form"
                className="flex items-center gap-1 rounded-xl border border-[#dce5da] p-2 text-xs text-[#718174] hover:bg-slate-50"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSavePlan();
            }}
            className="mt-5 space-y-4"
          >
            {/* Crop & Growth Stage */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Target Crop
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value as CropType)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal text-[#173b2b] shadow-sm outline-none focus:border-[#307d4f] focus:ring-2 focus:ring-[#d8eedb]"
                >
                  <option value="wheat">Wheat (गेहूँ)</option>
                  <option value="rice">Paddy / Rice (धान)</option>
                  <option value="tomato">Tomato (टमाटर)</option>
                  <option value="mustard">Mustard (सरसों)</option>
                  <option value="cotton">Cotton (कपास)</option>
                  <option value="other">Other Field Crop</option>
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Crop Growth Stage
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value as CropStage)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal text-[#173b2b] shadow-sm outline-none focus:border-[#307d4f] focus:ring-2 focus:ring-[#d8eedb]"
                >
                  <option value="sowing">Sowing / Emergence (बुवाई)</option>
                  <option value="vegetative">Vegetative / Tillering (वानस्पतिक)</option>
                  <option value="flowering">Flowering / Heading (फूल / दाना)</option>
                  <option value="grain_filling">Grain Filling / Pod Formation (दाना भराव)</option>
                  <option value="maturity">Ripening / Harvest Prep (पकने की अवस्था)</option>
                </select>
              </label>
            </div>

            {/* Soil Type & Observed Moisture */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Field Soil Texture
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value as SoilType)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal text-[#173b2b] shadow-sm outline-none focus:border-[#307d4f] focus:ring-2 focus:ring-[#d8eedb]"
                >
                  <option value="sandy">Sandy (बलुई — drains quickly)</option>
                  <option value="loamy">Loamy (दोमट — balanced retention)</option>
                  <option value="clay">Clay (चिकनी — holds water / slow drainage)</option>
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Farmer Observed Soil Moisture
                <select
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(e.target.value as SoilMoistureObserved)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal text-[#173b2b] shadow-sm outline-none focus:border-[#307d4f] focus:ring-2 focus:ring-[#d8eedb]"
                >
                  <option value="dry">Dry (सूखी — powdery/cracked, no ball forms)</option>
                  <option value="medium">Medium (मध्यम — cool, weak ball crumbles)</option>
                  <option value="moist">Moist (नम — pliable ball, leaves damp mark)</option>
                </select>
              </label>
            </div>

            {/* Field Area & Irrigation Depth */}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Field Area
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                  placeholder="e.g. 2.0"
                  required
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Area Unit
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                >
                  <option value="acres">Acres (एकड़)</option>
                  <option value="hectares">Hectares (हेक्टेयर)</option>
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Target Depth (mm)
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="150"
                  value={depthMm}
                  onChange={(e) => setDepthMm(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                  placeholder="e.g. 35"
                  required
                />
              </label>
            </div>

            {/* Optional Manual Rain & Observations */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Recent Rainfall (mm) <span className="font-normal lowercase text-[#859489]">(optional)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={manualRainfall}
                  onChange={(e) => setManualRainfall(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                  placeholder="e.g. 8.5"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#43614c]">
                Field Notes & Observations <span className="font-normal lowercase text-[#859489]">(optional)</span>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dce5da] bg-white p-3 text-sm font-normal shadow-sm outline-none focus:border-[#307d4f]"
                  placeholder="e.g. mild topsoil crusting, cool underneath"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#145a37] px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0f482b]"
              >
                <Save size={16} /> Save Plan to Device
              </button>

              {onNavigateToAdvisory && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToAdvisory(
                      `What are the best irrigation timing and water conservation practices for my ${cropType} field at ${cropStage} stage in ${soilType} soil?`
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-[#bddbbd] bg-[#f0f7ee] px-4 py-3 text-xs font-bold text-[#1f5f38] hover:bg-[#e4f1e1]"
                >
                  <Sparkles size={15} /> Ask Kisan AI About Timing
                </button>
              )}
            </div>
          </form>

          {/* Honest disclaimer notice */}
          <div className="mt-6 rounded-2xl bg-[#f8faf6] p-3.5 border border-[#e4ebe1] text-xs text-[#6e7f72] flex items-start gap-2">
            <Info size={16} className="text-[#367c4e] shrink-0 mt-0.5" />
            <span>
              <strong>Transparency Note:</strong> KisanSetu calculates this schedule using transparent agronomic rules and Open-Meteo atmospheric forecasts. It does not control pumps remotely or connect to physical field telemetry.
            </span>
          </div>
        </section>

        {/* Right: Recommendation & Water Volume Calculator */}
        <section className="space-y-6">
          {/* Dynamic Recommendation Card */}
          <article className="rounded-3xl border border-[#d8e4d4] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebf0e8] pb-4">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeColors}`}>
                {recommendation.recommendation.replace("_", " ")}
              </span>
              <span className="text-[11px] font-semibold text-[#808e82]">
                Urgency: <strong className="capitalize text-[#1b4330]">{recommendation.urgency}</strong>
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-[#143e2b]">
              {recommendation.title}
            </h3>

            {/* Rain Warnings if any */}
            {recommendation.rainWarnings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <CloudRain size={16} className="text-blue-700" />
                  <span>Forecast Rain Warning</span>
                </div>
                {recommendation.rainWarnings.map((warn, i) => (
                  <p key={i} className="mt-1.5">{warn}</p>
                ))}
              </div>
            )}

            {/* Agronomic Reasons */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#45614d]">
                Key Reasons:
              </p>
              <ul className="space-y-1.5 text-xs leading-5 text-[#3b5443]">
                {recommendation.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#358552] shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Next Steps */}
            {recommendation.suggestedNextSteps.length > 0 && (
              <div className="mt-5 rounded-2xl bg-[#f2f8f0] p-4 border border-[#d8e8d5]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1e5c38]">
                  Recommended Next Steps:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#2e4c37]">
                  {recommendation.suggestedNextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#2b7e4a] shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Assumptions & Uncertainty */}
            <div className="mt-4 border-t border-[#edf2ea] pt-3 text-[11px] leading-4 text-[#7b8a7f]">
              <p className="font-semibold text-[#486350] mb-1">Assumptions & Limits:</p>
              <ul className="space-y-1">
                {recommendation.assumptionsAndUncertainty.slice(0, 3).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </article>

          {/* Water Volume Calculator Result */}
          {waterResult && (
            <article className="rounded-3xl border border-[#dbe6d7] bg-gradient-to-br from-[#f5faf3] to-[#ebf5e8] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#1c5534]">
                <Calculator size={20} />
                <h4 className="text-base font-bold">Estimated Water Requirement</h4>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e1e9de]">
                  <span className="text-[11px] font-bold uppercase text-[#738477]">
                    Total Volume
                  </span>
                  <p className="mt-1 text-2xl font-black text-[#14472c]">
                    {waterResult.totalLitres.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-[#718274]">Litres of water</p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e1e9de]">
                  <span className="text-[11px] font-bold uppercase text-[#738477]">
                    Metric Cubes
                  </span>
                  <p className="mt-1 text-2xl font-black text-[#14472c]">
                    {waterResult.totalCubicMetres.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-[#718274]">Cubic metres (m³)</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs leading-5 text-[#415a49] border border-white">
                <p className="font-bold text-[#1a442d]">Formula Breakdown:</p>
                <p className="font-mono text-[11px] text-[#1b5030] mt-0.5">
                  {waterResult.breakdown}
                </p>
                <p className="mt-2 text-[10px] text-[#758679]">
                  {waterResult.disclaimer}
                </p>
              </div>
            </article>
          )}
        </section>
      </div>

      {/* Saved Plans Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102b1e]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e6ece2] pb-3">
              <div className="flex items-center gap-2">
                <BookmarkCheck size={20} className="text-[#2b794a]" />
                <h3 className="text-lg font-bold text-[#143d2a]">
                  Saved Irrigation Plans
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#718175]">
              These plans are stored exclusively on this device's browser localStorage.
            </p>

            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {savedPlans.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#87958b]">
                  No saved plans yet. Generate a recommendation and tap "Save Plan to Device".
                </div>
              ) : (
                savedPlans.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e2e8de] bg-[#f9fbf8] p-4 text-xs transition hover:border-[#388556]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <b className="text-sm font-bold capitalize text-[#173d2a]">
                          {p.cropType} · {p.cropStage.replace("_", " ")}
                        </b>
                        <p className="text-[#6d7e72]">
                          {p.fieldArea} {p.areaUnit} · {p.soilType} soil · {p.soilMoisture} moisture
                        </p>
                        <p className="text-[10px] text-[#8e9c91]">
                          Depth: {p.depthMm} mm · {p.totalLitres.toLocaleString("en-IN")} Litres
                        </p>
                      </div>

                      <span className="rounded-full bg-[#e3efe0] px-2.5 py-1 text-[10px] font-bold uppercase text-[#1a5533]">
                        {p.recommendation.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#edf2ea] pt-2">
                      <span className="text-[10px] text-[#88968b]">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadPlan(p)}
                          className="rounded-lg bg-[#145a37] px-3 py-1 font-bold text-white hover:bg-[#0f4429]"
                        >
                          Load into Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(p.id)}
                          className="rounded-lg border border-red-200 p-1 text-red-600 hover:bg-red-50"
                          title="Delete plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="rounded-xl border border-[#d6dfd3] px-4 py-2 text-xs font-bold text-[#445b4b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
