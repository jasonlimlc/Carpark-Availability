import { ApiConfig, Carpark } from '../types/carpark';
import { INITIAL_CARPARKS, calculateDistanceKm } from '../data/singaporeCarparks';

const STORAGE_API_CONFIG_KEY = 'parksg_api_config';
const STORAGE_FAVORITES_KEY = 'parksg_saved_carparks';

export const DEFAULT_API_CONFIG: ApiConfig = {
  useLiveDatagov: false,
  ltaApiKey: '',
  autoRefresh: true,
  refreshIntervalSeconds: 30,
};

export function getSavedApiConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_API_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_API_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading API config from storage:', err);
  }
  return DEFAULT_API_CONFIG;
}

export function saveApiConfig(config: ApiConfig): void {
  try {
    localStorage.setItem(STORAGE_API_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving API config to storage:', err);
  }
}

export function getSavedCarparkIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading saved carparks:', err);
  }
  return ['ION01', 'HDB_TP14']; // default samples
}

export function toggleSavedCarparkId(id: string): string[] {
  const current = getSavedCarparkIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving carparks to storage:', err);
  }
  return updated;
}

export async function checkServerlessHealth(): Promise<{
  status: string;
  hasLtaKey: boolean;
  service: string;
  note?: string;
}> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status || 'ok',
        hasLtaKey: Boolean(data.env?.hasLtaKey),
        service: data.service || 'ParkSG API Proxy',
        note: data.env?.note,
      };
    }
  } catch (err) {
    console.warn('Health check error:', err);
  }
  return { status: 'offline', hasLtaKey: false, service: 'Local Client' };
}

/**
 * Fetch live carpark availability from LTA DataMall serverless proxy, Data.gov.sg, or apply realistic simulation
 */
export async function fetchCarparkAvailability(
  currentCarparks: Carpark[],
  config: ApiConfig
): Promise<{ carparks: Carpark[]; source: 'live_datagov' | 'live_lta' | 'simulated'; timestamp: string }> {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Try serverless LTA DataMall proxy (/api/carparkavailability)
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (config.ltaApiKey) {
      headers['AccountKey'] = config.ltaApiKey;
    }

    const ltaResponse = await fetch('/api/carparkavailability?fetchAll=true', {
      headers,
    });

    if (ltaResponse.ok) {
      const json = await ltaResponse.json();
      const records = json?.value;

      if (Array.isArray(records) && records.length > 0) {
        // Build fast lookup by CarParkID and Development name
        const ltaMap = new Map<string, { carAvail?: number; motoAvail?: number; heavyAvail?: number }>();

        for (const item of records) {
          const idKey = (item.CarParkID || '').toUpperCase().trim();
          const devKey = (item.Development || '').toUpperCase().trim();
          const lots = Number(item.AvailableLots) || 0;
          const lotType = item.LotType || 'C';

          const existing = ltaMap.get(idKey) || {};
          if (lotType === 'C') existing.carAvail = lots;
          else if (lotType === 'Y') existing.motoAvail = lots;
          else if (lotType === 'H') existing.heavyAvail = lots;

          ltaMap.set(idKey, existing);
          if (devKey) {
            ltaMap.set(devKey, existing);
          }
        }

        let matchCount = 0;
        const updated = currentCarparks.map((cp) => {
          const match =
            ltaMap.get(cp.carparkNo.toUpperCase().trim()) ||
            ltaMap.get(cp.id.toUpperCase().trim()) ||
            ltaMap.get(cp.name.toUpperCase().trim());

          if (match && match.carAvail !== undefined) {
            matchCount++;
            return {
              ...cp,
              lots: {
                ...cp.lots,
                car: {
                  ...cp.lots.car,
                  available: Math.min(match.carAvail, cp.lots.car.total),
                },
                motorcycle: cp.lots.motorcycle && match.motoAvail !== undefined
                  ? { ...cp.lots.motorcycle, available: match.motoAvail }
                  : cp.lots.motorcycle,
                heavyVehicle: cp.lots.heavyVehicle && match.heavyAvail !== undefined
                  ? { ...cp.lots.heavyVehicle, available: match.heavyAvail }
                  : cp.lots.heavyVehicle,
              },
              lastUpdated: timeString,
            };
          }
          return { ...cp, lastUpdated: timeString };
        });

        if (matchCount > 0) {
          return {
            carparks: updated,
            source: 'live_lta',
            timestamp: timeString,
          };
        }
      }
    }
  } catch (err) {
    console.warn('LTA serverless proxy fetch attempt returned:', err);
  }

  // 2. If user enabled Live Data.gov.sg API
  if (config.useLiveDatagov) {
    try {
      const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data?.items?.[0]?.carpark_data;

        if (Array.isArray(items) && items.length > 0) {
          const mapByNo = new Map<string, { carLots?: number; carTotal?: number }>();

          for (const item of items) {
            const no = item.carpark_number;
            const carInfo = item.carpark_info?.find((ci: { lot_type: string }) => ci.lot_type === 'C');
            if (carInfo) {
              mapByNo.set(no, {
                carLots: parseInt(carInfo.lots_available, 10) || 0,
                carTotal: parseInt(carInfo.total_lots, 10) || 100,
              });
            }
          }

          const updated = currentCarparks.map((cp) => {
            const liveMatch = mapByNo.get(cp.carparkNo);
            if (liveMatch && liveMatch.carLots !== undefined) {
              return {
                ...cp,
                lots: {
                  ...cp.lots,
                  car: {
                    total: liveMatch.carTotal || cp.lots.car.total,
                    available: Math.min(liveMatch.carLots, liveMatch.carTotal || cp.lots.car.total),
                  },
                },
                lastUpdated: timeString,
              };
            }
            return { ...cp, lastUpdated: timeString };
          });

          return {
            carparks: updated,
            source: 'live_datagov',
            timestamp: timeString,
          };
        }
      }
    } catch (e) {
      console.warn('Data.gov.sg live fetch error, falling back to simulated live feed:', e);
    }
  }

  // 3. Realistic simulation: lots fluctuate naturally (cars enter/leave)
  const simulated = currentCarparks.map((cp) => {
    const delta = Math.floor(Math.random() * 7) - 3;
    const currentLots = cp.lots.car.available;
    const totalLots = cp.lots.car.total;
    const nextLots = Math.max(0, Math.min(totalLots, currentLots + delta));

    let evAvailable = cp.evChargersAvailable;
    if (cp.evCharging && cp.evChargersCount) {
      const evDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      evAvailable = Math.max(0, Math.min(cp.evChargersCount, (evAvailable ?? 1) + evDelta));
    }

    return {
      ...cp,
      lots: {
        ...cp.lots,
        car: {
          ...cp.lots.car,
          available: nextLots,
        },
      },
      evChargersAvailable: evAvailable,
      lastUpdated: timeString,
    };
  });

  return {
    carparks: simulated,
    source: 'simulated',
    timestamp: timeString,
  };
}

/**
 * Recomputes distances from user location
 */
export function updateCarparkDistances(
  carparks: Carpark[],
  userLocation: { lat: number; lng: number }
): Carpark[] {
  return carparks.map((cp) => {
    const dist = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      cp.coordinates.lat,
      cp.coordinates.lng
    );
    return {
      ...cp,
      distanceKm: dist,
    };
  });
}
