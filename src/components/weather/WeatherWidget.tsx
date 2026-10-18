import { useEffect, useRef, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Sun,
  Wind,
  AlertTriangle,
  RotateCcw,
  Clock,
  Compass,
} from "lucide-react";

import {
  fetchFarmWeather,
  searchFarmLocations,
  describeWeather,
  getRainAdvisory,
  formatWeatherDate,
  type FarmLocation,
  type FarmWeather,
} from "@/lib/weather";

function WeatherIcon({ code, size = 28 }: { code: number; size?: number }) {
  const props = { size, "aria-hidden": true as const };

  if (code === 0) return <Sun {...props} className="text-amber-500" />;
  if (code <= 2) return <CloudSun {...props} className="text-amber-400" />;
  if (code === 3) return <Cloud {...props} className="text-slate-400" />;
  if ([45, 48].includes(code)) return <CloudFog {...props} className="text-slate-400" />;
  if ([51, 53, 55, 56, 57].includes(code))
    return <CloudDrizzle {...props} className="text-sky-500" />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain {...props} className="text-blue-600" />;
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow {...props} className="text-sky-300" />;
  if ([95, 96, 99].includes(code))
    return <CloudLightning {...props} className="text-amber-600" />;

  return <CloudSun {...props} className="text-amber-500" />;
}

interface WeatherWidgetProps {
  initialLocation?: FarmLocation | undefined;
  onLocationChange?: ((location: FarmLocation) => void) | undefined;
  onWeatherLoaded?: ((weather: FarmWeather) => void) | undefined;
  className?: string | undefined;
}

export default function WeatherWidget({
  initialLocation,
  onLocationChange,
  onWeatherLoaded,
  className = "",
}: WeatherWidgetProps) {
  const [location, setLocation] = useState<FarmLocation>(() => {
    if (initialLocation) return initialLocation;
    try {
      const saved = localStorage.getItem("kisansetu_selected_location");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      name: "Sonipat",
      latitude: 28.9931,
      longitude: 77.0151,
      admin1: "Haryana",
      country: "India",
    };
  });

  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<FarmLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [geoPrompt, setGeoPrompt] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  async function loadWeather(selected: FarmLocation, forceRefresh = false) {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const result = await fetchFarmWeather(selected, forceRefresh, controller.signal);
      setLocation(selected);
      setWeather(result);
      try {
        localStorage.setItem("kisansetu_selected_location", JSON.stringify(selected));
      } catch {
        // ignore storage errors
      }
      onLocationChange?.(selected);
      onWeatherLoaded?.(result);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load live weather from Open-Meteo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const updateOnline = () => setOffline(!navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    updateOnline();

    void loadWeather(location);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("Please type at least 2 characters to search for a town or district.");
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    setError("");
    setMatches([]);

    try {
      const results = await searchFarmLocations(query, controller.signal);
      setMatches(results);

      if (results.length === 1 && results[0]) {
        await loadWeather(results[0]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Location search failed. Check your connection."
      );
    } finally {
      setSearching(false);
    }
  }

  function handleSelectPlace(place: FarmLocation) {
    setMatches([]);
    setQuery("");
    void loadWeather(place);
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not supported on this device. Please search manually.");
      return;
    }
    setGeoPrompt(false);
    setGeoLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        const autoLoc: FarmLocation = {
          name: "My Farm GPS",
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          admin1: "Device location",
          country: "India",
        };
        void loadWeather(autoLoc, true);
      },
      (geoErr) => {
        setGeoLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(
            "Location permission was denied. You can manually enter your village, district, or nearest town above."
          );
        } else {
          setError(
            "Could not determine your GPS location. Please search for your district or market town manually."
          );
        }
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: true }
    );
  }

  const current = weather?.current;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl text-[#14432d]">
            <CloudSun className="text-[#3b8755]" size={26} />
            Live Weather & Rain Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#67776b]">
            Open-Meteo real-time telemetry · Asia/Kolkata Indian Standard Time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadWeather(location, true)}
            disabled={loading || offline}
            title="Refresh current forecast"
            className="flex items-center gap-1.5 rounded-xl border border-[#d6dfd3] bg-white px-3.5 py-2 text-xs font-bold text-[#1e5837] shadow-sm hover:bg-[#f1f6ed] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#347c4e]" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Location Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3.5 text-[#829286]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search village, district, or mandi (e.g. Karnal, Sonipat, Pune, Nashik)"
            aria-label="Search location"
            className="w-full rounded-xl border border-[#dce5da] bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-[#338253] focus:ring-2 focus:ring-[#d8eedb]"
          />
        </div>

        <button
          type="submit"
          disabled={searching || loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#145a37] px-5 py-3 text-sm font-bold text-white shadow hover:bg-[#0f462a] disabled:opacity-50"
        >
          {searching ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Search size={17} />
          )}
          <span>Search</span>
        </button>

        <button
          type="button"
          onClick={() => setGeoPrompt(true)}
          disabled={loading || geoLocating}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#dce5da] bg-white px-4 py-3 text-sm font-bold text-[#23583a] shadow-sm hover:bg-[#f2f7ef] disabled:opacity-50"
        >
          {geoLocating ? (
            <LoaderCircle size={17} className="animate-spin text-[#2b794a]" />
          ) : (
            <LocateFixed size={17} className="text-[#2b794a]" />
          )}
          <span>My GPS</span>
        </button>
      </form>

      {/* Explicit Geolocation Permission Prompt */}
      {geoPrompt && (
        <div className="rounded-2xl border border-[#b8ddbe] bg-[#f0f8ed] p-4 text-sm text-[#18482f] shadow-sm">
          <div className="flex items-start gap-3">
            <Compass size={22} className="shrink-0 text-[#257345]" />
            <div className="flex-1">
              <p className="font-bold">Allow location access for local agricultural forecast?</p>
              <p className="mt-1 text-xs text-[#52705d]">
                KisanSetu uses your GPS coordinates solely to query real-time Open-Meteo weather for your farm. Your location coordinates are not shared with advertisers.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={requestBrowserLocation}
                  className="rounded-lg bg-[#165c39] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#10482c]"
                >
                  Allow & Fetch
                </button>
                <button
                  type="button"
                  onClick={() => setGeoPrompt(false)}
                  className="rounded-lg border border-[#c6d7c7] bg-white px-3 py-1.5 text-xs font-semibold text-[#546b5a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Matches List */}
      {matches.length > 0 && (
        <div className="rounded-2xl border border-[#dce5da] bg-white p-3 shadow-md">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[#6d7f71]">
            Select your location:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {matches.map((place, index) => (
              <button
                key={`${place.latitude}-${place.longitude}-${index}`}
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="flex items-start gap-2.5 rounded-xl border border-[#e8ece4] p-3 text-left transition hover:border-[#388457] hover:bg-[#f1f8ee]"
              >
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#307c4d]" />
                <div>
                  <span className="block text-sm font-bold text-[#183e2b]">{place.name}</span>
                  <span className="text-xs text-[#738376]">
                    {[place.admin1, place.country].filter(Boolean).join(", ")}
                    <span className="ml-1 text-[10px] text-[#919e93]">
                      ({place.latitude.toFixed(2)}°N, {place.longitude.toFixed(2)}°E)
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offline Alert */}
      {offline && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 border border-amber-200">
          <AlertTriangle size={16} /> Device is currently offline. Cached telemetry will be shown when available.
        </p>
      )}

      {/* Error state with retry */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadWeather(location, true)}
            className="inline-flex items-center gap-1 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !weather && (
        <div className="space-y-4 rounded-2xl border border-[#e2e8df] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      )}

      {/* Real Weather Display */}
      {weather && current && (
        <>
          {weather.stale && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              Showing previously cached telemetry because the latest network update timed out.
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            {/* Current Weather Card */}
            <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#11492f] via-[#165a3b] to-[#25784d] p-6 text-white shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
                <p className="flex items-center gap-2 text-sm font-bold tracking-wide">
                  <MapPin size={17} className="text-[#ffd064]" />
                  <span>{location.name}</span>
                  {location.admin1 ? <span className="text-white/80">· {location.admin1}</span> : null}
                  {location.country ? <span className="text-white/60">({location.country})</span> : null}
                </p>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#ffd064]">
                  Live Open-Meteo
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold sm:text-6xl">
                      {Math.round(current.temperature)}°
                    </span>
                    <span className="text-lg font-medium text-white/80">C</span>
                  </div>
                  <p className="mt-1 text-base font-semibold text-[#ffd977]">
                    {describeWeather(current.code)}
                  </p>
                  <p className="text-xs text-white/75">
                    Feels like {Math.round(current.feelsLike)}°C
                  </p>
                </div>
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <WeatherIcon code={current.code} size={56} />
                </div>
              </div>

              {/* 3 Metric Pills */}
              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Droplets size={16} className="text-sky-300" />
                    <span className="text-[11px] font-medium">Humidity</span>
                  </div>
                  <p className="mt-1.5 text-base font-bold sm:text-lg">{current.humidity}%</p>
                </div>

                <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Wind size={16} className="text-emerald-200" />
                    <span className="text-[11px] font-medium">Wind</span>
                  </div>
                  <p className="mt-1.5 text-base font-bold sm:text-lg">
                    {Math.round(current.windSpeed)} <span className="text-xs font-normal">km/h</span>
                  </p>
                </div>

                <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <CloudRain size={16} className="text-blue-300" />
                    <span className="text-[11px] font-medium">Precip.</span>
                  </div>
                  <p className="mt-1.5 text-base font-bold sm:text-lg">
                    {current.precipitation} <span className="text-xs font-normal">mm</span>
                  </p>
                </div>
              </div>

              {/* Timestamp footer */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-white/70">
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  Telemetry: {current.time.replace("T", " ")} IST
                </span>
                <span>
                  Updated: {new Date(weather.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </article>

            {/* Rain Advisory Card */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#dbe6d7] bg-[#edf6eb] p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dbeed9] px-3 py-1 text-xs font-bold text-[#1d5c38]">
                    <Droplets size={14} /> 72-HOUR OUTLOOK
                  </span>
                  <span className="text-xs font-semibold text-[#6d7e72]">Kolkata Time</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#143e2a]">
                  Weather-driven field advisory
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#355241]">
                  {getRainAdvisory(weather.forecast)}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-white/80 p-3.5 text-xs leading-5 text-[#5c6e61]">
                <p className="font-semibold text-[#18482f]">Farmer Rule of Thumb:</p>
                If cumulative 72h forecast rainfall exceeds 10 mm or rain probability is &gt;60%, withhold surface irrigation to prevent seed decay or root waterlogging.
              </div>
            </article>
          </div>

          {/* 7-day forecast cards */}
          <section className="rounded-3xl border border-[#e1e7de] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#143d2b] sm:text-lg">
                  7-Day Weather & Precipitation Outlook
                </h3>
                <p className="text-xs text-[#718175]">
                  Daily maximum/minimum temperatures, forecast rainfall volume, and rain probability.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#6e7d73]">
                Unit: °C · Rainfall in mm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {weather.forecast.map((day, idx) => (
                <article
                  key={day.date}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 text-center transition ${
                    idx === 0
                      ? "border-[#a5d2b1] bg-[#f2f9f1] ring-2 ring-[#c6e6cf]"
                      : "border-[#e5ebe2] bg-[#fbfcfb] hover:bg-[#f6f9f4]"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#1b4330]">
                      {idx === 0 ? "Today" : formatWeatherDate(day.date)}
                    </p>
                    <p className="text-[10px] text-[#7d8b80]">{day.date}</p>

                    <div className="my-3 flex justify-center">
                      <WeatherIcon code={day.code} size={30} />
                    </div>

                    <p className="text-[11px] font-medium leading-tight text-[#526356]">
                      {describeWeather(day.code)}
                    </p>
                  </div>

                  <div className="mt-3 border-t border-[#ebf0ea] pt-2">
                    <p className="text-sm font-extrabold text-[#143d2b]">
                      {Math.round(day.max)}° <span className="text-xs font-normal text-[#758478]">/ {Math.round(day.min)}°</span>
                    </p>

                    <div className="mt-2 space-y-0.5 text-[11px]">
                      <p className={`font-semibold ${day.rainProbability && day.rainProbability >= 50 ? "text-blue-700" : "text-[#69796e]"}`}>
                        Rain: {day.rainProbability === null ? "—" : `${day.rainProbability}%`}
                      </p>
                      <p className="font-bold text-[#1e5837]">
                        {day.rainfall.toFixed(1)} mm
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-4 text-right text-[11px] text-[#859288]">
              Data provided by <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline font-semibold text-[#256a42]">Open-Meteo</a> APIs. Validated for agriculture planning.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
