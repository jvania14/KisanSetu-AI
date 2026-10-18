export type FarmLocation = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string | undefined;
  country?: string | undefined;
};

export type ForecastDay = {
  date: string;
  code: number;
  min: number;
  max: number;
  rainProbability: number | null;
  rainfall: number;
};

export type FarmWeather = {
  location: FarmLocation;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    code: number;
    time: string;
  };
  forecast: ForecastDay[];
  fetchedAt: number;
  stale?: boolean;
};

const cache = new Map<string, { data: FarmWeather; time: number }>();
const CACHE_MS = 10 * 60 * 1000;

async function request<T>(url: string, externalSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  const abortHandler = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new Error("Request was cancelled.");
    }
    externalSignal.addEventListener("abort", abortHandler);
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Weather service error (${response.status}).`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Weather request timed out or was cancelled. Try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortHandler);
    }
  }
}

export function isIndianLocation(loc: FarmLocation): boolean {
  if (loc.country?.toLowerCase() === "india") return true;
  return (
    loc.latitude >= 6.0 &&
    loc.latitude <= 38.0 &&
    loc.longitude >= 68.0 &&
    loc.longitude <= 98.0
  );
}

// Well-known Indian postal codes and agricultural hubs for instant lookup
const INDIAN_PIN_MAP: Record<string, { name: string; admin1: string; lat: number; lon: number }> = {
  "110001": { name: "New Delhi", admin1: "Delhi", lat: 28.6139, lon: 77.2090 },
  "131001": { name: "Sonipat", admin1: "Haryana", lat: 28.9931, lon: 77.0151 },
  "132001": { name: "Karnal", admin1: "Haryana", lat: 29.6857, lon: 76.9905 },
  "132103": { name: "Panipat", admin1: "Haryana", lat: 29.3909, lon: 76.9635 },
  "124001": { name: "Rohtak", admin1: "Haryana", lat: 28.8955, lon: 76.6066 },
  "125001": { name: "Hisar", admin1: "Haryana", lat: 29.1492, lon: 75.7217 },
  "141001": { name: "Ludhiana", admin1: "Punjab", lat: 30.9010, lon: 75.8573 },
  "143001": { name: "Amritsar", admin1: "Punjab", lat: 31.6340, lon: 74.8723 },
  "151001": { name: "Bathinda", admin1: "Punjab", lat: 30.2110, lon: 74.9455 },
  "302001": { name: "Jaipur", admin1: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  "342001": { name: "Jodhpur", admin1: "Rajasthan", lat: 26.2389, lon: 73.0243 },
  "380001": { name: "Ahmedabad", admin1: "Gujarat", lat: 23.0225, lon: 72.5714 },
  "411001": { name: "Pune", admin1: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  "422001": { name: "Nashik", admin1: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  "431001": { name: "Chhatrapati Sambhajinagar", admin1: "Maharashtra", lat: 19.8762, lon: 75.3433 },
  "440001": { name: "Nagpur", admin1: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  "452001": { name: "Indore", admin1: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  "462001": { name: "Bhopal", admin1: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  "226001": { name: "Lucknow", admin1: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  "221001": { name: "Varanasi", admin1: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  "208001": { name: "Kanpur", admin1: "Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  "243001": { name: "Bareilly", admin1: "Uttar Pradesh", lat: 28.3670, lon: 79.4304 },
  "800001": { name: "Patna", admin1: "Bihar", lat: 25.5941, lon: 85.1376 },
  "700001": { name: "Kolkata", admin1: "West Bengal", lat: 22.5726, lon: 88.3639 },
  "500001": { name: "Hyderabad", admin1: "Telangana", lat: 17.3850, lon: 78.4867 },
  "522001": { name: "Guntur", admin1: "Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
  "560001": { name: "Bengaluru", admin1: "Karnataka", lat: 12.9716, lon: 77.5946 },
  "600001": { name: "Chennai", admin1: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  "682001": { name: "Kochi", admin1: "Kerala", lat: 9.9312, lon: 76.2673 },
};

export const MAJOR_FARMING_HUBS: FarmLocation[] = [
  { name: "Sonipat", admin1: "Haryana", latitude: 28.9931, longitude: 77.0151, country: "India" },
  { name: "Karnal", admin1: "Haryana", latitude: 29.6857, longitude: 76.9905, country: "India" },
  { name: "Ludhiana", admin1: "Punjab", latitude: 30.9010, longitude: 75.8573, country: "India" },
  { name: "Nashik", admin1: "Maharashtra", latitude: 19.9975, longitude: 73.7898, country: "India" },
  { name: "Pune", admin1: "Maharashtra", latitude: 18.5204, longitude: 73.8567, country: "India" },
  { name: "Indore", admin1: "Madhya Pradesh", latitude: 22.7196, longitude: 75.8577, country: "India" },
  { name: "Guntur", admin1: "Andhra Pradesh", latitude: 16.3067, longitude: 80.4365, country: "India" },
  { name: "Bathinda", admin1: "Punjab", latitude: 30.2110, longitude: 74.9455, country: "India" },
  { name: "Varanasi", admin1: "Uttar Pradesh", latitude: 25.3176, longitude: 82.9739, country: "India" },
  { name: "Jaipur", admin1: "Rajasthan", latitude: 26.9124, longitude: 75.7873, country: "India" },
];

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1 min ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
}

export async function searchFarmLocations(
  query: string,
  signal?: AbortSignal
): Promise<FarmLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    throw new Error("Enter at least two characters to search.");
  }

  // Check if query is an Indian 6-digit PIN code
  if (/^\d{6}$/.test(trimmed)) {
    const known = INDIAN_PIN_MAP[trimmed];
    if (known) {
      return [
        {
          name: `${known.name} (PIN ${trimmed})`,
          latitude: known.lat,
          longitude: known.lon,
          admin1: known.admin1,
          country: "India",
        },
      ];
    }
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const result = await request<{
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      country?: string;
      country_code?: string;
    }>;
  }>(url.toString(), signal);

  if (!result.results || result.results.length === 0) {
    // If it was a PIN code with no direct geocoding result, try finding nearest circle
    if (/^\d{6}$/.test(trimmed)) {
      const prefix2 = trimmed.slice(0, 2);
      const prefixMatch = Object.entries(INDIAN_PIN_MAP).find(([pin]) => pin.startsWith(prefix2));
      if (prefixMatch) {
        const [, val] = prefixMatch;
        return [
          {
            name: `${val.name} Region (PIN ${trimmed})`,
            latitude: val.lat,
            longitude: val.lon,
            admin1: val.admin1,
            country: "India",
          },
        ];
      }
    }
    throw new Error(`No locations found matching "${trimmed}". Try another town or district.`);
  }

  // Prioritize Indian results first if any exist
  const places = result.results.map((place) => ({
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    admin1: place.admin1,
    country: place.country,
  }));

  places.sort((a, b) => {
    const aIn = isIndianLocation(a) ? 1 : 0;
    const bIn = isIndianLocation(b) ? 1 : 0;
    return bIn - aIn;
  });

  return places;
}

export async function fetchFarmWeather(
  location: FarmLocation,
  forceRefresh = false,
  signal?: AbortSignal
): Promise<FarmWeather> {
  const key = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
  const cached = cache.get(key);

  if (!forceRefresh && cached && Date.now() - cached.time < CACHE_MS) {
    return cached.data;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum"
  );
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set(
    "timezone",
    isIndianLocation(location) ? "Asia/Kolkata" : "auto"
  );
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");

  try {
    const result = await request<{
      current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        precipitation: number;
        weather_code: number;
      };
      daily: {
        time: string[];
        weather_code: (number | null)[];
        temperature_2m_min: (number | null)[];
        temperature_2m_max: (number | null)[];
        precipitation_probability_max: (number | null)[];
        precipitation_sum: (number | null)[];
      };
    }>(url.toString(), signal);

    const forecast: ForecastDay[] = (result.daily.time ?? []).map((date, i) => ({
      date,
      code: result.daily.weather_code[i] ?? 0,
      min: result.daily.temperature_2m_min[i] ?? 0,
      max: result.daily.temperature_2m_max[i] ?? 0,
      rainProbability: result.daily.precipitation_probability_max?.[i] ?? null,
      rainfall: result.daily.precipitation_sum[i] ?? 0,
    }));

    const data: FarmWeather = {
      location,
      current: {
        temperature: result.current.temperature_2m,
        feelsLike: result.current.apparent_temperature,
        humidity: result.current.relative_humidity_2m,
        windSpeed: result.current.wind_speed_10m,
        precipitation: result.current.precipitation,
        code: result.current.weather_code,
        time: result.current.time,
      },
      forecast,
      fetchedAt: Date.now(),
    };

    cache.set(key, { data, time: Date.now() });
    return data;
  } catch (error) {
    if (cached) {
      return { ...cached.data, stale: true };
    }
    throw error;
  }
}

export function describeWeather(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog / Mist";
  if ([51, 53, 55, 56, 57].includes(code)) return "Light drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain showers";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow / Sleet";
  if ([80, 81, 82].includes(code)) return "Heavy rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Fair weather";
}

export function getRainAdvisory(days: ForecastDay[]): string {
  const upcoming = days.slice(0, 3);

  const rainyDay = upcoming.find(
    (day) =>
      day.rainfall >= 5 ||
      (day.rainProbability !== null && day.rainProbability >= 60)
  );

  if (!rainyDay) {
    return "No significant rain signal in the next 3 days. Base your irrigation on measured root-zone moisture and current crop growth stage.";
  }

  const reason =
    rainyDay.rainProbability !== null && rainyDay.rainProbability >= 60
      ? `${rainyDay.rainProbability}% precipitation probability`
      : `${rainyDay.rainfall.toFixed(1)} mm forecast rainfall`;

  return `Forecast indicates rain on ${formatWeatherDate(rainyDay.date)} (${reason}). Check soil dampness before starting pumps to conserve power and avoid waterlogging.`;
}

export function formatWeatherDate(dateStr: string): string {
  // Use Asia/Kolkata date display
  try {
    const d = new Date(`${dateStr}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return dateStr;
  }
}
