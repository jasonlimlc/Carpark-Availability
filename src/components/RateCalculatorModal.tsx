import React, { useState } from 'react';
import { X, Calculator, Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: Carpark[];
  initialCarparkId?: string;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  isOpen,
  onClose,
  carparks,
  initialCarparkId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialCarparkId || carparks[0]?.id || ''
  );
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [entryHour, setEntryHour] = useState<number>(14); // 2 PM default
  const [entryMin, setEntryMin] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationMins, setDurationMins] = useState<number>(30);
  const [vehicle, setVehicle] = useState<VehicleType>('car');

  if (!isOpen) return null;

  const currentCarpark = carparks.find((c) => c.id === selectedId) || carparks[0];

  // Calculation Logic
  const totalParkedMinutes = durationHours * 60 + durationMins;
  const isGrace = totalParkedMinutes <= currentCarpark.gracePeriodMins;

  let estimatedCost = 0;
  let calculationNote = '';

  if (isGrace) {
    estimatedCost = 0;
    calculationNote = `Parked for ${totalParkedMinutes}m, within the ${currentCarpark.gracePeriodMins}-minute grace period (No charge).`;
  } else if (dayType === 'sunday' && currentCarpark.hasFreeSundayParking && entryHour >= 7 && entryHour + durationHours <= 22) {
    estimatedCost = 0;
    calculationNote = 'Qualifies for HDB Free Parking Scheme (Sundays & PH 7:00 AM - 10:30 PM).';
  } else {
    if (vehicle === 'motorcycle') {
      // Standard motorcycle parking in SG is usually $0.65 per session or $0.20/hr
      estimatedCost = currentCarpark.agency === 'HDB' ? 0.65 : 1.50;
      calculationNote = 'Standard per-session motorcycle rate applies.';
    } else if (vehicle === 'heavyVehicle') {
      estimatedCost = Math.ceil(totalParkedMinutes / 30) * 1.5;
      calculationNote = 'Heavy vehicle half-hourly tariff rate applied.';
    } else {
      // Car rate
      if (currentCarpark.agency === 'HDB') {
        const isCentral = currentCarpark.address.includes('Emerald Hill') || currentCarpark.carparkNo === 'ACB';
        const halfHourRate = isCentral ? 1.20 : 0.60;
        const halfHourUnits = Math.ceil(totalParkedMinutes / 30);
        estimatedCost = halfHourUnits * halfHourRate;
        calculationNote = `${halfHourUnits} x 30-min block(s) @ $${halfHourRate.toFixed(2)}/half-hr.`;
      } else {
        // Commercial mall rate estimation
        const hourlyRate = currentCarpark.rates.hourlyEstimated;
        estimatedCost = Number(((totalParkedMinutes / 60) * hourlyRate).toFixed(2));
        calculationNote = `Based on published commercial schedule (~$${hourlyRate.toFixed(2)}/hr).`;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Singapore Parking Fee Calculator</h2>
              <p className="text-xs text-slate-400">Estimate charges before you arrive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4">
          {/* Carpark Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Selected Carpark</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.name} ({cp.agency} · {cp.carparkNo})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Car (C)', value: 'car' as VehicleType },
                { label: 'Motorcycle (Y)', value: 'motorcycle' as VehicleType },
                { label: 'Heavy (H)', value: 'heavyVehicle' as VehicleType },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVehicle(v.value)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
                    vehicle === v.value
                      ? 'bg-slate-800 text-sky-400 border-sky-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Parking Day</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Weekday', value: 'weekday' },
                { label: 'Saturday', value: 'saturday' },
                { label: 'Sunday / PH', value: 'sunday' },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDayType(d.value as any)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
                    dayType === d.value
                      ? 'bg-slate-800 text-sky-400 border-sky-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Entry Time</label>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={entryHour}
                  onChange={(e) => setEntryHour(Number(e.target.value))}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i} className="bg-slate-900">
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Duration</label>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="bg-transparent text-white focus:outline-none cursor-pointer p-1"
                >
                  {[0, 1, 2, 3, 4, 5, 8, 12].map((h) => (
                    <option key={h} value={h} className="bg-slate-900">
                      {h} hr
                    </option>
                  ))}
                </select>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="bg-transparent text-white focus:outline-none cursor-pointer p-1"
                >
                  {[0, 10, 15, 30, 45].map((m) => (
                    <option key={m} value={m} className="bg-slate-900">
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Estimated Parking Fee</span>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  ${estimatedCost.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 block">SGD</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <p>{calculationNote}</p>
              <div className="mt-2 text-[11px] text-slate-500">
                Published rate: <span className="text-slate-300">{currentCarpark.rates.weekdayPeak}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
