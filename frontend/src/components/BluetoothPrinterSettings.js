/**
 * Bluetooth Printer Settings Component — modernised UI
 *
 * - Modern glass/gradient styling with strong CTA hierarchy
 * - Uses the unified BluetoothPrinterContext (persistent across pages)
 * - Android-aware RawBT guidance for TWA / Chrome users
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Printer,
  RefreshCw,
  Trash2,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useBluetoothPrinter } from '../contexts/BluetoothPrinterContext';
import { isAndroid, getAndroidPrintingHelpText } from '../utils/androidPrint';

const StatusChip = ({ tone = 'idle', children }) => {
  const tones = {
    idle: 'bg-slate-800/50 text-slate-300 border-slate-700',
    ok: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    busy: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded-full border ${tones[tone]}`}
      data-testid="printer-status-chip"
    >
      {children}
    </span>
  );
};

const FeatureRow = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur">
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-400/10 ring-1 ring-orange-400/30">
      <Icon className="h-4 w-4 text-orange-300" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const BluetoothPrinterSettings = () => {
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempts,
    deviceInfo,
    connectionQuality,
    printQueue,
    connectPrinter,
    disconnectPrinter,
    testPrint,
  } = useBluetoothPrinter();

  const [testing, setTesting] = useState(false);
  const [onAndroid, setOnAndroid] = useState(false);
  const helpText = getAndroidPrintingHelpText();

  useEffect(() => {
    setOnAndroid(isAndroid());
  }, []);

  const bluetoothSupported =
    typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleConnect = async () => {
    try {
      await connectPrinter();
    } catch (error) {
      // Context already surfaces the toast; keep quiet here.
      console.error(error);
    }
  };

  const handleForget = () => {
    disconnectPrinter();
    try {
      localStorage.removeItem('bluetooth_printer');
      localStorage.removeItem('bluetooth_printer_v2');
    } catch (e) {
      /* noop */
    }
    toast.success('Printer removed');
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      await testPrint();
    } catch (error) {
      /* handled by context */
    } finally {
      setTesting(false);
    }
  };

  // ----- Fallback when Web Bluetooth is unavailable (older iOS / old browsers) -----
  if (!bluetoothSupported && !onAndroid) {
    return (
      <Card
        className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 shadow-xl"
        data-testid="bt-printer-unsupported-card"
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/40">
              <BluetoothOff className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Direct printing unavailable</h3>
              <p className="text-xs text-slate-400">
                Your browser can't open a Bluetooth connection
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="mb-2 font-semibold text-slate-100">Use instead:</p>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Open BillByteKOT on an Android phone using Chrome</li>
              <li>• Or install the Windows / macOS desktop app</li>
              <li>• Or install RawBT from Play Store (one-tap printing)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasQueue = printQueue && printQueue.length > 0;

  return (
    <Card
      className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 shadow-2xl"
      data-testid="bt-printer-settings-card"
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-20 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

      <CardContent className="relative p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-xl ring-1 transition-all ${
                isConnected
                  ? 'bg-emerald-500/15 ring-emerald-400/40'
                  : 'bg-slate-500/15 ring-slate-500/30'
              }`}
            >
              {isConnected ? (
                <BluetoothConnected className="h-5 w-5 text-emerald-300" />
              ) : (
                <Bluetooth className="h-5 w-5 text-slate-300" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Thermal Printer</h3>
              <p className="text-xs text-slate-400">
                Bluetooth · ESC/POS · 58mm / 80mm
              </p>
            </div>
          </div>

          {isReconnecting ? (
            <StatusChip tone="busy">
              <RefreshCw className="h-3 w-3 animate-spin" /> Reconnecting {reconnectAttempts || ''}
            </StatusChip>
          ) : isConnected ? (
            <StatusChip tone="ok">
              <CheckCircle className="h-3 w-3" /> Connected
            </StatusChip>
          ) : (
            <StatusChip tone="idle">Offline</StatusChip>
          )}
        </div>

        {/* Device card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100" data-testid="printer-device-name">
                {deviceInfo?.deviceName || 'No printer paired yet'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {deviceInfo
                  ? `Last connected ${new Date(
                      deviceInfo.lastConnected || Date.now()
                    ).toLocaleString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}`
                  : 'Tap "Pair printer" to scan nearby devices'}
              </p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-300">
                  ● {connectionQuality?.successfulPrints ?? 0}
                </span>
                <span className="flex items-center gap-1 text-rose-300">
                  ● {connectionQuality?.failedPrints ?? 0}
                </span>
              </div>
            )}
          </div>

          {hasQueue && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <Zap className="h-3.5 w-3.5" />
              {printQueue.length} print job{printQueue.length > 1 ? 's' : ''} queued — they'll auto-send on reconnect.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid gap-2 sm:grid-cols-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isReconnecting}
              className="col-span-full h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-base font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:brightness-110 active:scale-[0.99]"
              data-testid="bt-printer-connect-btn"
            >
              {isConnecting || isReconnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning nearby printers…
                </>
              ) : (
                <>
                  <Bluetooth className="mr-2 h-5 w-5" />
                  {deviceInfo ? 'Reconnect printer' : 'Pair printer'}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTestPrint}
                disabled={testing}
                className="h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.99]"
                data-testid="bt-printer-test-btn"
              >
                {testing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Printing…
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" /> Test print
                  </>
                )}
              </Button>
              <Button
                onClick={disconnectPrinter}
                variant="outline"
                className="h-12 rounded-xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
                data-testid="bt-printer-disconnect-btn"
              >
                <BluetoothOff className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            </>
          )}

          {deviceInfo && (
            <Button
              onClick={handleForget}
              variant="ghost"
              className="col-span-full h-10 rounded-xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              data-testid="bt-printer-forget-btn"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Forget this printer
            </Button>
          )}
        </div>

        {/* Android RawBT helper */}
        {onAndroid && helpText && (
          <div
            className="flex gap-3 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-4"
            data-testid="rawbt-help-card"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-500/20 ring-1 ring-orange-400/40">
              <Smartphone className="h-4 w-4 text-orange-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-orange-100">
                Tip for Android / TWA users
              </p>
              <p className="mt-1 text-xs leading-relaxed text-orange-200/80">
                {helpText.primary}
              </p>
              <a
                href={helpText.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300 hover:text-orange-200"
                data-testid="rawbt-playstore-link"
              >
                Install RawBT <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Feature rows */}
        <div className="grid gap-2 sm:grid-cols-2">
          <FeatureRow
            icon={ShieldCheck}
            title="Auto-reconnect"
            desc="Printer re-pairs itself up to 5× if it drops during service."
          />
          <FeatureRow
            icon={Zap}
            title="Queue on offline"
            desc="Bills saved while offline will auto-print once reconnected."
          />
        </div>

        {/* Tiny hint */}
        <p className="text-center text-[11px] text-slate-500">
          Works with most 58mm & 80mm Bluetooth ESC/POS thermal printers.
        </p>
      </CardContent>
    </Card>
  );
};

export default BluetoothPrinterSettings;
