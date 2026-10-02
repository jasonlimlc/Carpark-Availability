import React from 'react';
import { MapPin, Navigation, Search, Check } from 'lucide-react';
import { POPULAR_LOCATIONS } from '../data/singaporeCarparks';
import { LocationPreset } from '../types/carpark';

interface LocationSelectorProps {
  currentLocationName: string;
  isLocating: boolean;
  onLocateUser: () => void;
  onSelectPreset: (preset: LocationPreset) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCarparksFound: number;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocationName,
  isLocating,
  onLocateUser,
  onSelectPreset,
  searchQuery,
  setSearchQuery,
  totalCarparksFound,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Top search & Locate Me row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search carpark name, road, HDB code (e.g. TP14, Orchard, MBS)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* GPS Locate Me Button */}
        <button
          onClick={onLocateUser}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-sm shadow-emerald-950/40 disabled:opacity-50 shrink-0 cursor-pointer active:scale-95"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Finding GPS...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* Popular Singapore Hubs - Single row horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-slate-400 shrink-0 text-[11px] font-medium mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span>Hotspots:</span>
        </span>
        {POPULAR_LOCATIONS.map((preset) => {
          const isActive = currentLocationName === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => onSelectPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {isActive && <Check className="w-3 h-3 text-white" />}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Current location & match counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Current focal point:</span>
          <span className="text-slate-200 font-medium">{currentLocationName}</span>
        </div>
        <div className="font-mono text-slate-300">
          <span className="tabular-nums font-semibold text-white">{totalCarparksFound}</span> carparks nearby
        </div>
      </div>
    </div>
  );
};
