import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Carpark,
  VehicleType,
  CarparkAgency,
  SortOption,
  LocationPreset,
  ApiConfig,
} from './types/carpark';
import {
  INITIAL_CARPARKS,
  SINGAPORE_DEFAULT_COORDINATES,
  POPULAR_LOCATIONS,
  calculateDistanceKm,
} from './data/singaporeCarparks';
import {
  getSavedApiConfig,
  saveApiConfig,
  getSavedCarparkIds,
  toggleSavedCarparkId,
  fetchCarparkAvailability,
  updateCarparkDistances,
} from './services/carparkService';
import { Header } from './components/Header';
import { LocationSelector } from './components/LocationSelector';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkMap } from './components/CarparkMap';
import { ApiConfigModal } from './components/ApiConfigModal';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import {
  MapPin,
  List,
  Map as MapIcon,
  Bookmark,
  Calculator,
  Compass,
  Zap,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  // State
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [userLocation, setUserLocation] = useState(SINGAPORE_DEFAULT_COORDINATES);
  const [currentLocationName, setCurrentLocationName] = useState('Orchard Road');
  const [isLocating, setIsLocating] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'explore' | 'near-me' | 'saved' | 'calculator'>('explore');
  // Mobile view toggle (list vs map)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [agencyFilter, setAgencyFilter] = useState<CarparkAgency | 'ALL'>('ALL');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [sortOption, setSortOption] = useState<SortOption>('distance');
  const [evOnly, setEvOnly] = useState(false);
  const [freeSundayOnly, setFreeSundayOnly] = useState(false);
  const [highClearanceOnly, setHighClearanceOnly] = useState(false);

  // Saved / Bookmarks
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Modals
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);

  // Data & API status
  const [apiConfig, setApiConfig] = useState<ApiConfig>(getSavedApiConfig());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'live_datagov' | 'live_lta' | 'simulated'>('simulated');
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Load saved bookmarks on mount
  useEffect(() => {
    setSavedIds(getSavedCarparkIds());
  }, []);

  // Update distances whenever user location changes
  useEffect(() => {
    setCarparks((prev) => updateCarparkDistances(prev, userLocation));
  }, [userLocation]);

  // Handle GPS location request
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Verify if within Singapore rough bounds (lat 1.15 to 1.48, lng 103.6 to 104.05)
        const isWithinSG =
          latitude >= 1.15 && latitude <= 1.48 && longitude >= 103.6 && longitude <= 104.05;

        const newCoords = isWithinSG
          ? { lat: latitude, lng: longitude }
          : SINGAPORE_DEFAULT_COORDINATES;

        setUserLocation(newCoords);
        setCurrentLocationName(isWithinSG ? 'My Current GPS' : 'Orchard Road (GPS outside SG fallback)');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        // Default to popular Singapore hub
        setUserLocation(SINGAPORE_DEFAULT_COORDINATES);
        setCurrentLocationName('Orchard Road (Default)');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Preset location select
  const handleSelectPreset = (preset: LocationPreset) => {
    setUserLocation({ lat: preset.lat, lng: preset.lng });
    setCurrentLocationName(preset.name);
    if (activeTab === 'saved') {
      setActiveTab('explore');
    }
  };

  // Toggle Carpark Save
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleSavedCarparkId(id);
    setSavedIds(updated);
  };

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchCarparkAvailability(carparks, apiConfig);
      setCarparks(updateCarparkDistances(result.carparks, userLocation));
      setDataSource(result.source);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [carparks, apiConfig, userLocation]);

  // Auto-refresh interval
  useEffect(() => {
    if (!apiConfig.autoRefresh) return;
    const intervalMs = Math.max(10, apiConfig.refreshIntervalSeconds || 30) * 1000;
    const interval = setInterval(() => {
      handleRefresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [apiConfig.autoRefresh, apiConfig.refreshIntervalSeconds, handleRefresh]);

  // Handle Tab Switch Actions
  useEffect(() => {
    if (activeTab === 'near-me') {
      setRadiusKm(1.5);
      setSortOption('distance');
      handleLocateUser();
    } else if (activeTab === 'calculator') {
      setCalculatorModalOpen(true);
      setActiveTab('explore');
    }
  }, [activeTab, handleLocateUser]);

  // Save updated API config
  const handleSaveApiConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    saveApiConfig(newConfig);
    // trigger immediate refresh with new config
    setTimeout(handleRefresh, 200);
  };

  // Filtered & Sorted Carparks List
  const displayedCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Tab filter (Saved tab)
        if (activeTab === 'saved' && !savedIds.includes(cp.id)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchNo = cp.carparkNo.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchAgency = cp.agency.toLowerCase().includes(q);
          if (!matchName && !matchNo && !matchAddress && !matchAgency) {
            return false;
          }
        }

        // Agency
        if (agencyFilter !== 'ALL' && cp.agency !== agencyFilter) {
          return false;
        }

        // Radius (only apply if activeTab is not explicitly browsing saved)
        if (activeTab !== 'saved' && radiusKm < 50) {
          if (cp.distanceKm !== undefined && cp.distanceKm > radiusKm) {
            return false;
          }
        }

        // EV toggle
        if (evOnly && (!cp.evCharging || (cp.evChargersAvailable ?? 0) === 0)) {
          return false;
        }

        // Free Sunday toggle
        if (freeSundayOnly && !cp.hasFreeSundayParking) {
          return false;
        }

        // High clearance toggle (>= 2.0m)
        if (highClearanceOnly && cp.gantryHeight < 2.0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'distance') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (sortOption === 'available') {
          const availA =
            vehicleType === 'motorcycle'
              ? a.lots.motorcycle?.available ?? 0
              : vehicleType === 'heavyVehicle'
              ? a.lots.heavyVehicle?.available ?? 0
              : a.lots.car.available;
          const availB =
            vehicleType === 'motorcycle'
              ? b.lots.motorcycle?.available ?? 0
              : vehicleType === 'heavyVehicle'
              ? b.lots.heavyVehicle?.available ?? 0
              : b.lots.car.available;
          return availB - availA;
        }
        if (sortOption === 'cheapest') {
          return a.rates.hourlyEstimated - b.rates.hourlyEstimated;
        }
        if (sortOption === 'occupancy') {
          const ratioA = a.lots.car.total > 0 ? a.lots.car.available / a.lots.car.total : 0;
          const ratioB = b.lots.car.total > 0 ? b.lots.car.available / b.lots.car.total : 0;
          return ratioB - ratioA;
        }
        return 0;
      });
  }, [
    carparks,
    activeTab,
    savedIds,
    searchQuery,
    agencyFilter,
    radiusKm,
    evOnly,
    freeSundayOnly,
    highClearanceOnly,
    sortOption,
    vehicleType,
  ]);

  // Overall SG status summary stats
  const aggregateStats = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let totalEv = 0;
    let availableEv = 0;

    carparks.forEach((c) => {
      totalLots += c.lots.car.total;
      availableLots += c.lots.car.available;
      if (c.evCharging) {
        totalEv += c.evChargersCount ?? 0;
        availableEv += c.evChargersAvailable ?? 0;
      }
    });

    return { totalLots, availableLots, totalEv, availableEv };
  }, [carparks]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/20 selection:text-sky-300">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedIds.length}
        onOpenApiModal={() => setApiModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        dataSource={dataSource}
        lastUpdated={lastUpdated}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 lg:pb-6 gap-4">
        {/* Search & Location Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <LocationSelector
            currentLocationName={currentLocationName}
            isLocating={isLocating}
            onLocateUser={handleLocateUser}
            onSelectPreset={handleSelectPreset}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            totalCarparksFound={displayedCarparks.length}
          />

          <FilterBar
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            agencyFilter={agencyFilter}
            setAgencyFilter={setAgencyFilter}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            evOnly={evOnly}
            setEvOnly={setEvOnly}
            freeSundayOnly={freeSundayOnly}
            setFreeSundayOnly={setFreeSundayOnly}
            highClearanceOnly={highClearanceOnly}
            setHighClearanceOnly={setHighClearanceOnly}
          />
        </div>

        {/* Mobile View Switcher (List vs Map) */}
        <div className="flex lg:hidden items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              mobileView === 'list'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Carpark List ({displayedCarparks.length})</span>
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              mobileView === 'map'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Interactive Map</span>
          </button>
        </div>

        {/* Content Layout: Responsive Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[550px]">
          {/* Left Column: Carpark Feed / List */}
          <div
            className={`lg:col-span-6 xl:col-span-5 flex flex-col gap-3 h-[680px] overflow-y-auto pr-1 ${
              mobileView === 'map' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {displayedCarparks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
                <Compass className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No carparks match your filter</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Try expanding your search radius (e.g. 5km or All SG) or clearing specific EV / Free Sunday filters.
                </p>
                <button
                  onClick={() => {
                    setRadiusKm(50);
                    setAgencyFilter('ALL');
                    setEvOnly(false);
                    setFreeSundayOnly(false);
                    setHighClearanceOnly(false);
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-1.5 text-xs font-medium text-sky-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              displayedCarparks.map((cp) => (
                <CarparkCard
                  key={cp.id}
                  carpark={cp}
                  isSelected={selectedCarpark?.id === cp.id}
                  isSaved={savedIds.includes(cp.id)}
                  vehicleType={vehicleType}
                  onSelect={() => setSelectedCarpark(cp)}
                  onToggleSave={(e) => handleToggleSave(cp.id, e)}
                  onOpenCalculator={(e) => {
                    e.stopPropagation();
                    setSelectedCarpark(cp);
                    setCalculatorModalOpen(true);
                  }}
                  onOpenDetails={(e) => {
                    e.stopPropagation();
                    setSelectedCarpark(cp);
                    setDetailModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* Right Column: Leaflet Map */}
          <div
            className={`lg:col-span-6 xl:col-span-7 h-[680px] rounded-2xl overflow-hidden shadow-sm ${
              mobileView === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <CarparkMap
              carparks={displayedCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => {
                setSelectedCarpark(cp);
              }}
              userLocation={userLocation}
              searchRadiusKm={radiusKm}
              vehicleType={vehicleType}
            />
          </div>
        </div>

        {/* Footer info bar */}
        <footer className="mt-auto pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>ParkSG Live Availability</span>
            <span aria-hidden="true">·</span>
            <span>Accurate WGS84 Singapore Coordinates</span>
            <span aria-hidden="true">·</span>
            <span>Data.gov.sg & LTA Compatible</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setApiModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Configure API Keys
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCalculatorModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Rate Calculator
            </button>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Navigation for Mobile (Touch-First PWA design) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center h-14 pb-safe">
        <button
          onClick={() => {
            setActiveTab('explore');
            setMobileView('list');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'explore' && mobileView === 'list' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => {
            setMobileView('map');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            mobileView === 'map' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Map</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('near-me');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'near-me' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Near Me</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            setMobileView('list');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'saved' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Saved ({savedIds.length})</span>
        </button>
      </div>

      {/* Modals */}
      <ApiConfigModal
        isOpen={apiModalOpen}
        onClose={() => setApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />

      <RateCalculatorModal
        isOpen={calculatorModalOpen}
        onClose={() => setCalculatorModalOpen(false)}
        carparks={carparks}
        initialCarparkId={selectedCarpark?.id}
      />

      <CarparkDetailModal
        carpark={selectedCarpark}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        isSaved={selectedCarpark ? savedIds.includes(selectedCarpark.id) : false}
        onToggleSave={() => {
          if (selectedCarpark) handleToggleSave(selectedCarpark.id);
        }}
        onOpenCalculator={() => setCalculatorModalOpen(true)}
        vehicleType={vehicleType}
      />
    </div>
  );
}
