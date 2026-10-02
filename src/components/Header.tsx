import React from 'react';
import { RefreshCw, SlidersHorizontal, MapPin, Bookmark, KeyRound, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'explore' | 'near-me' | 'saved' | 'calculator';
  setActiveTab: (tab: 'explore' | 'near-me' | 'saved' | 'calculator') => void;
  savedCount: number;
  onOpenApiModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  dataSource: 'live_datagov' | 'live_lta' | 'simulated';
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenApiModal,
  onRefresh,
  isRefreshing,
  dataSource,
  lastUpdated,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark (Brand Zone) */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('explore');
            }}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-mono font-black text-slate-950 text-sm shadow-sm shadow-emerald-500/30">
              P
            </div>
            <span>ParkSG</span>
          </a>

          {/* Quiet live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dataSource === 'simulated' ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dataSource === 'simulated' ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {dataSource === 'simulated' ? 'Simulated SG Feed' : 'Live Data.gov.sg'}
            </span>
          </div>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'explore'
                ? 'text-white bg-slate-800/90'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('near-me')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'near-me'
                ? 'text-white bg-slate-800/90'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Near Me</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'text-white bg-slate-800/90'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved ({savedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`hidden md:inline-flex px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'text-white bg-slate-800/90'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Rates
          </button>
        </nav>

        {/* Zone 3: Primary action & configuration */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={`Last updated: ${lastUpdated}. Click to refresh.`}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh lots data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">API Setup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
