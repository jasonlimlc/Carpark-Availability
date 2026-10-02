import React from 'react';
import { X, Navigation, Bookmark, Zap, ShieldCheck, Clock, MapPin, ExternalLink, Calculator } from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { formatDistance, getLotAvailabilityStatus } from '../data/singaporeCarparks';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenCalculator: () => void;
  vehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onOpenCalculator,
  vehicleType,
}) => {
  if (!isOpen || !carpark) return null;

  let lotsAvail = carpark.lots.car.available;
  let lotsTotal = carpark.lots.car.total;

  if (vehicleType === 'motorcycle' && carpark.lots.motorcycle) {
    lotsAvail = carpark.lots.motorcycle.available;
    lotsTotal = carpark.lots.motorcycle.total;
  } else if (vehicleType === 'heavyVehicle' && carpark.lots.heavyVehicle) {
    lotsAvail = carpark.lots.heavyVehicle.available;
    lotsTotal = carpark.lots.heavyVehicle.total;
  }

  const status = getLotAvailabilityStatus(lotsAvail, lotsTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-mono text-slate-300 font-semibold">{carpark.carparkNo}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.carparkType}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{carpark.name}</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-xl border transition-colors ${
                isSaved
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save carpark'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Lots Breakdown Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Lot Availability
            </span>
            <span className="text-xs text-slate-500 font-mono">Updated: {carpark.lastUpdated}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Cars */}
            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Cars</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {carpark.lots.car.available}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ {carpark.lots.car.total}</span>
              </div>
            </div>

            {/* Motorcycles */}
            {carpark.lots.motorcycle && (
              <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Motorcycles</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">
                    {carpark.lots.motorcycle.available}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ {carpark.lots.motorcycle.total}</span>
                </div>
              </div>
            )}

            {/* EV Chargers */}
            {carpark.evCharging && (
              <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1 text-emerald-300">
                  <Zap className="w-3 h-3" />
                  <span>EV Chargers</span>
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    {carpark.evChargersAvailable ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ {carpark.evChargersCount ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Schedule Table */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Parking Rate Structure
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" />
              <span>Calculate exact fee</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 text-xs">
            <div className="p-3 flex justify-between gap-4">
              <span className="text-slate-400 shrink-0">Weekday (Day/Peak)</span>
              <span className="text-slate-200 text-right font-medium">{carpark.rates.weekdayPeak}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-slate-400 shrink-0">Weekday (Evening/Off-Peak)</span>
              <span className="text-slate-200 text-right font-medium">{carpark.rates.weekdayOffPeak}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-slate-400 shrink-0">Saturday</span>
              <span className="text-slate-200 text-right font-medium">{carpark.rates.saturday}</span>
            </div>
            <div className="p-3 flex justify-between gap-4">
              <span className="text-slate-400 shrink-0">Sunday & Public Holidays</span>
              <span className="text-slate-200 text-right font-medium">
                {carpark.rates.sundayAndPH}
              </span>
            </div>
            {carpark.rates.nightParkingRate && (
              <div className="p-3 flex justify-between gap-4">
                <span className="text-slate-400 shrink-0">Night Parking Scheme</span>
                <span className="text-slate-200 text-right font-medium">{carpark.rates.nightParkingRate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Operational Specifications */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Grace Period</span>
            <span className="font-semibold text-slate-200 font-mono">{carpark.gracePeriodMins} mins</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Gantry Height</span>
            <span className="font-semibold text-slate-200 font-mono">{carpark.gantryHeight} meters</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[11px]">EPS System</span>
            <span className="font-semibold text-emerald-400">CashCard / IU</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Distance</span>
            <span className="font-semibold text-slate-200 font-mono">{formatDistance(carpark.distanceKm)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-lg shadow-sky-950/40"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Navigation</span>
          </a>
        </div>
      </div>
    </div>
  );
};
