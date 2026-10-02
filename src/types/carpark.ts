export type VehicleType = 'car' | 'motorcycle' | 'heavyVehicle';

export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'Commercial';

export type CarparkType =
  | 'Multi-Storey Car Park'
  | 'Surface Car Park'
  | 'Basement Car Park'
  | 'Covered Car Park'
  | 'Mechanised Car Park';

export interface LotInfo {
  total: number;
  available: number;
}

export interface CarparkRates {
  weekdayPeak: string;
  weekdayOffPeak: string;
  saturday: string;
  sundayAndPH: string;
  hourlyEstimated: number; // for sorting/calculating
  nightParkingRate?: string;
}

export interface Carpark {
  id: string;
  carparkNo: string;
  name: string;
  address: string;
  agency: CarparkAgency;
  carparkType: CarparkType;
  coordinates: {
    lat: number;
    lng: number;
  };
  lots: {
    car: LotInfo;
    motorcycle?: LotInfo;
    heavyVehicle?: LotInfo;
  };
  rates: CarparkRates;
  gracePeriodMins: number;
  gantryHeight: number; // in meters (e.g., 2.0)
  evCharging: boolean;
  evChargersCount?: number;
  evChargersAvailable?: number;
  hasFreeSundayParking: boolean;
  electronicParkingSystem: boolean;
  nightParking: boolean;
  distanceKm?: number;
  lastUpdated: string;
}

export interface LocationPreset {
  name: string;
  area: string;
  lat: number;
  lng: number;
}

export interface ApiConfig {
  useLiveDatagov: boolean;
  ltaApiKey: string;
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
}

export type SortOption = 'distance' | 'available' | 'cheapest' | 'occupancy';
