import React, { useState, useEffect } from 'react';
import { X, KeyRound, Check, RefreshCw, ExternalLink, Info, Server, Activity } from 'lucide-react';
import { ApiConfig } from '../types/carpark';
import { checkServerlessHealth } from '../services/carparkService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (updated: ApiConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [ltaApiKey, setLtaApiKey] = useState(config.ltaApiKey);
  const [useLiveDatagov, setUseLiveDatagov] = useState(config.useLiveDatagov);
  const [autoRefresh, setAutoRefresh] = useState(config.autoRefresh);
  const [refreshInterval, setRefreshInterval] = useState(config.refreshIntervalSeconds);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    hasLtaKey: boolean;
    service: string;
    note?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkServerlessHealth().then((health) => {
        setServerHealth(health);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ltaApiKey: ltaApiKey.trim(),
      useLiveDatagov,
      autoRefresh,
      refreshIntervalSeconds: Number(refreshInterval) || 30,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">API Keys & Serverless Proxy</h2>
              <p className="text-xs text-slate-400">Configure LTA DataMall & Open Data feeds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Serverless Status Card */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Serverless Proxy Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${serverHealth?.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className="font-mono text-[11px] text-slate-400 uppercase">
                {serverHealth ? serverHealth.status : 'checking...'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Live Endpoint:</span>
              <code className="text-slate-300 font-mono">/api/carparkavailability</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Health Check:</span>
              <code className="text-slate-300 font-mono">/api/health</code>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-500">Server Env Key:</span>
              <span className={serverHealth?.hasLtaKey ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {serverHealth?.hasLtaKey ? 'Configured in Environment' : 'Not set in env (use input below)'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* LTA DataMall AccountKey */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                LTA DataMall API Key (AccountKey)
              </label>
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Request Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={ltaApiKey}
              onChange={(e) => setLtaApiKey(e.target.value)}
              placeholder="Paste your LTA DataMall AccountKey here..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              You can also set <code className="text-slate-400">LTA_ACCOUNT_KEY</code> directly in your <code className="text-slate-400">.env</code> file. No keys are hardcoded.
            </p>
          </div>

          {/* Data.gov.sg Direct Feed Toggle */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white block">
                  Data.gov.sg Live Carpark API
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Live real-time HDB carpark lots across Singapore (Public, No Key Required)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveDatagov}
                  onChange={(e) => setUseLiveDatagov(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                Endpoint:{' '}
                <code className="text-slate-400">api.data.gov.sg/v1/transport/carpark-availability</code>
              </span>
            </div>
          </div>

          {/* Auto Refresh Setting */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <span className="text-xs font-medium text-slate-200 block">
                Auto-Refresh Available Lots
              </span>
              <span className="text-[11px] text-slate-500 block">
                Periodically fetch updated lot fluctuations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                disabled={!autoRefresh}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none disabled:opacity-50"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-xl transition-colors shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save API Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
