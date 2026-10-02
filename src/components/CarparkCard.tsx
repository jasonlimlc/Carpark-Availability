import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { formatDistance, getLotAvailabilityStatus } from '../data/singaporeCarparks';
import { Bookmark, Navigation, Zap, ShieldCheck, ChevronRight, Calculator } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  isSaved: boolean;
  vehicleType: VehicleType;
  onSelect: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onOpenCalculator: (e: React.MouseEvent) => void;
  onOpenDetails: (e: React.MouseEvent) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  isSaved,
  vehicleType,
  onSelect,
  onToggleSave,
  onOpenCalculator,
  onOpenDetails,
}) => {
  let lotsAvail = carpark.lots.car.available;
  let lotsTotal = carpark.lots.car.total;

  if (vehicleType === 'motorcycle' && carpark.lots.motorcycle) {
    lotsAvail = carpark.lots.motorcycle.available;
    lotsTotal = carpark.lots.motorcycle.total;
  } else if (vehicleType === 'heavyVehicle' && carpark.lots.heavyVehicle) {
    lotsAvail = carpark.lots.heavyVehicle.available;
    lotsTotal = carpark.lots.heavyVehicle.total;
  }

  const occupancyPercent = lotsTotal > 0 ? Math.round(((lotsTotal - lotsAvail) / lotsTotal) * 100) : 0;
  const status = getLotAvailabilityStatus(lotsAvail, lotsTotal);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-150 border ${
        isSelected
          ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-950/40 ring-1 ring-sky-500/30'
          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top row: Name & Bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-mono text-slate-300 font-semibold">{carpark.carparkNo}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.carparkType.replace(' Car Park', '')}</span>
          </div>

          <h3 className="text-base font-semibold text-white tracking-tight leading-snug truncate group-hover:text-sky-300 transition-colors">
            {carpark.name}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{carpark.address}</p>
        </div>

        <button
          onClick={onToggleSave}
          title={isSaved ? 'Remove from saved' : 'Save carpark'}
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            isSaved
              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
          aria-label="Bookmark carpark"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Lot Stats & Availability Banner */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 items-center">
        {/* Availability Count */}
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${status.color}`}>
            {lotsAvail}
          </span>
          <div className="text-xs text-slate-400">
            <span>lots</span>
            <span className="text-slate-500 text-[11px] block">of {lotsTotal}</span>
          </div>
        </div>

        {/* Distance & Rate Quick View */}
        <div className="text-right">
          <div className="text-sm font-semibold font-mono text-slate-200 tabular-nums">
            {formatDistance(carpark.distanceKm)}
          </div>
          <div className="text-xs text-slate-400 truncate">
            ~${carpark.rates.hourlyEstimated.toFixed(2)}/hr
          </div>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            lotsAvail === 0
              ? 'bg-rose-500'
              : lotsAvail < 20
              ? 'bg-amber-400'
              : lotsAvail < 50
              ? 'bg-yellow-400'
              : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, 100 - occupancyPercent))}%` }}
        />
      </div>

      {/* Unboxed Metadata row (No pills rule compliant) */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          {carpark.evCharging && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap className="w-3 h-3" />
              <span>EV ({carpark.evChargersAvailable ?? 0}/{carpark.evChargersCount ?? 0})</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
            </span>
          )}
          <span>H: {carpark.gantryHeight}m</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{carpark.gracePeriodMins}m grace</span>
          {carpark.hasFreeSundayParking && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-sky-300">Free Sun</span>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-mono shrink-0">
          {carpark.lastUpdated}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <button
          onClick={onOpenDetails}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 py-1 hover:underline"
        >
          <span>View Rates & Rules</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCalculator}
            title="Calculate parking fee for this carpark"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm"
          >
            <Navigation className="w-3 h-3" />
            <span>Navigate</span>
          </a>
        </div>
      </div>
    </div>
  );
};
