import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabase';

export default function Terminal() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'offline'>('idle');
  const [scanType, setScanType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playBeep = (type: 'success' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type === 'success' ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(type === 'success' ? 1200 : 300, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); 
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + (type === 'success' ? 0.1 : 0.3));
    } catch (e) {
      // Silencieux
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim() || isSubmitting) return;

    if (!navigator.onLine) {
      setScanStatus('offline');
      playBeep('error');
      return;
    }

    setIsSubmitting(true);
    setScanStatus('idle');

    try {
      const { error } = await supabase
        .from('scans')
        .insert([{ 
          tracking_number: trackingNumber.trim(),
          scan_type: scanType 
        }]);

      if (error) throw error;

      setScanStatus('success');
      playBeep('success');
      setTrackingNumber('');
      
    } catch (error) {
      console.error("Erreur critique de scan:", error);
      setScanStatus('error');
      playBeep('error');
    } finally {
      setIsSubmitting(false);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setScanStatus('idle');
        inputRef.current?.focus(); 
      }, 1500);
    }
  };

  const getBackgroundColor = () => {
    if (scanStatus === 'success') return 'bg-emerald-900';
    if (scanStatus === 'error') return 'bg-red-900';
    if (scanStatus === 'offline') return 'bg-orange-900';
    return 'bg-slate-900';
  };

  const handleModeChange = (mode: 'INBOUND' | 'OUTBOUND') => {
    setScanType(mode);
    inputRef.current?.focus(); 
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${getBackgroundColor()}`}>
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-wider mb-2">
            SCAN<span className="text-blue-500">PRO</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm tracking-widest">
            {scanStatus === 'offline' ? '⚠️ MODE HORS-LIGNE' : 'TERMINAL ACTIF'}
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleModeChange('INBOUND')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
              scanType === 'INBOUND' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400' 
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            📥 RÉCEPTION
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('OUTBOUND')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
              scanType === 'OUTBOUND' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400' 
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            📤 EXPÉDITION
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              ref={inputRef}
              type="text" 
              value={trackingNumber} 
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Scannez le code-barres..."
              disabled={isSubmitting}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck="false"
              className={`w-full p-4 text-center text-2xl font-mono uppercase rounded-lg bg-slate-900 text-white border-2 outline-none transition disabled:opacity-50 placeholder-slate-500 ${
                scanType === 'INBOUND' ? 'border-emerald-600/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30' : 'border-amber-600/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30'
              }`} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || scanStatus === 'offline'}
            className={`w-full font-bold py-4 rounded-lg text-lg transition-all duration-200 transform active:scale-95 ${
              isSubmitting 
                ? 'bg-slate-600 cursor-not-allowed text-slate-300' 
                : scanStatus === 'offline'
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : scanType === 'INBOUND'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30'
            }`}
          >
            {isSubmitting ? 'TRAITEMENT...' : scanStatus === 'offline' ? 'CONNEXION PERDUE' : 'VALIDER LE SCAN'}
          </button>
        </form>

      </div>
    </div>
  );
}