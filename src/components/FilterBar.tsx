import React from 'react';
import { VehicleType, CarparkAgency, SortOption } from '../types/carpark';
import { Car, Bike, Truck, Zap, Sun, ShieldAlert, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  vehicleType: VehicleType;
  setVehicleType: (type: VehicleType) => void;
  agencyFilter: CarparkAgency | 'ALL';
  setAgencyFilter: (agency: CarparkAgency | 'ALL') => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  evOnly: boolean;
  setEvOnly: (val: boolean) => void;
  freeSundayOnly: boolean;
  setFreeSundayOnly: (val: boolean) => void;
  highClearanceOnly: boolean;
  setHighClearanceOnly: (val: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  vehicleType,
  setVehicleType,
  agencyFilter,
  setAgencyFilter,
  radiusKm,
  setRadiusKm,
  sortOption,
  setSortOption,
  evOnly,
  setEvOnly,
  freeSundayOnly,
  setFreeSundayOnly,
  highClearanceOnly,
  setHighClearanceOnly,
}) => {
  return (
    <div className="w-full space-y-2.5 py-1">
      {/* Primary Row: Vehicle Type & Radius & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Vehicle Segmented Control */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setVehicleType('car')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vehicleType === 'car'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars (C)</span>
          </button>
          <button
            onClick={() => setVehicleType('motorcycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vehicleType === 'motorcycle'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles (Y)</span>
          </button>
          <button
            onClick={() => setVehicleType('heavyVehicle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vehicleType === 'heavyVehicle'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy (H)</span>
          </button>
        </div>

        {/* Radius & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Radius selector */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-500 px-2 text-[11px] hidden sm:inline">Radius:</span>
            {[
              { label: '1 km', value: 1 },
              { label: '3 km', value: 3 },
              { label: '5 km', value: 5 },
              { label: 'All SG', value: 50 },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => setRadiusKm(r.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  radiusKm === r.value
                    ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="distance" className="bg-slate-900 text-slate-200">
                Nearest to me
              </option>
              <option value="available" className="bg-slate-900 text-slate-200">
                Most lots available
              </option>
              <option value="cheapest" className="bg-slate-900 text-slate-200">
                Lowest estimated rate
              </option>
              <option value="occupancy" className="bg-slate-900 text-slate-200">
                Least crowded %
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Row: Agency Filter & Feature Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
        {/* Operator Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-slate-500 text-[11px] mr-1 hidden md:inline">Operator:</span>
          {(['ALL', 'HDB', 'URA', 'Commercial'] as const).map((ag) => (
            <button
              key={ag}
              onClick={() => setAgencyFilter(ag)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                agencyFilter === ag
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              {ag === 'ALL' ? 'All Operators' : ag}
            </button>
          ))}
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setEvOnly(!evOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              evOnly
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>EV Charging</span>
          </button>

          <button
            onClick={() => setFreeSundayOnly(!freeSundayOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              freeSundayOnly
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-medium'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3 h-3 text-sky-400" />
            <span>Free Sunday</span>
          </button>

          <button
            onClick={() => setHighClearanceOnly(!highClearanceOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              highClearanceOnly
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>≥ 2.0m Height</span>
          </button>
        </div>
      </div>
    </div>
  );
};
