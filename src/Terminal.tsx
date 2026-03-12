import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wifi, WifiOff, UploadCloud, CheckCircle2, Lock, Delete, ArrowDown, ArrowUp, Locate } from 'lucide-react';
import { db } from './db';
import { supabase } from './supabase';

export default function Terminal() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const PIN_SECRET = '1234';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pinCode.length < 4) {
      const newPin = pinCode + num;
      setPinCode(newPin);
      if (newPin === PIN_SECRET) setTimeout(() => setIsUnlocked(true), 300);
      else if (newPin.length === 4) setTimeout(() => setPinCode(''), 500);
    }
  };

  const handleDelete = () => setPinCode(pinCode.slice(0, -1));

  const handleSync = useCallback(async () => {
    const pendingEvents = await db.events.where('status').equals('pending').toArray();
    if (pendingEvents.length === 0) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('logistics_events').insert(pendingEvents);
      if (error) throw error;
      const syncedIds = pendingEvents.map(e => e.id);
      await db.events.where('id').anyOf(syncedIds).modify({ status: 'synced' });
    } catch (err) {
      console.error("Erreur sync:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); handleSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleSync]);

  const events = useLiveQuery(() => db.events.orderBy('timestamp_local').reverse().toArray());

  // LE NOUVEAU MOTEUR DE SCAN MULTI-ACTIONS
  const handleScan = async (actionType: 'INBOUND' | 'PICKING' | 'OUTBOUND') => {
    const fakePalletId = `PAL-${Math.floor(Math.random() * 100000)}`;
    await db.events.add({
      id: crypto.randomUUID(),
      pallet_id: fakePalletId,
      event_type: actionType, // Enregistre le VRAI type d'action
      timestamp_local: Date.now(),
      status: 'pending'
    });
    // Petit retour haptique si sur mobile
    if (navigator.vibrate) navigator.vibrate(50);
    if (navigator.onLine) handleSync();
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl max-w-sm w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-500/10 p-4 rounded-full mb-4">
              <Lock className="text-blue-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-widest">TERMINAL VÉROUILLÉ</h2>
            <p className="text-gray-500 text-sm mt-2">Code Opérateur Requis</p>
          </div>
          <div className="flex justify-center gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pinCode.length ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-gray-700 bg-transparent'
              }`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handleKeyPress(num.toString())} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl font-bold py-4 rounded-2xl transition-colors">
                {num}
              </button>
            ))}
            <div className="col-start-2">
              <button onClick={() => handleKeyPress('0')} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-2xl font-bold py-4 rounded-2xl transition-colors">0</button>
            </div>
            <div className="col-start-3">
              <button onClick={handleDelete} className="w-full bg-gray-800 text-gray-400 hover:text-red-500 flex justify-center py-4 rounded-2xl transition-colors"><Delete size={28} /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-sans">
      <header className="flex justify-between items-center mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <div>
          <h1 className="text-xl font-black tracking-wider text-white">OMNITRACE</h1>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">ID: JD-8492</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'ON' : 'OFF'}
        </div>
      </header>

      {/* LE NOUVEAU MENU DES ACTIONS INDUSTRIELLES */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => handleScan('INBOUND')}
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-3 transition-colors"
        >
          <ArrowDown size={32} />
          <span className="font-bold tracking-wider text-sm">RÉCEPTION</span>
        </button>

        <button 
          onClick={() => handleScan('OUTBOUND')}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-3 transition-colors"
        >
          <ArrowUp size={32} />
          <span className="font-bold tracking-wider text-sm">EXPÉDITION</span>
        </button>

        <button 
          onClick={() => handleScan('PICKING')}
          className="col-span-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-colors"
        >
          <Locate size={28} />
          <span className="font-bold tracking-wider text-lg">PICKING (INTERNE)</span>
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
          <h2 className="font-bold text-gray-400 tracking-wider text-sm">HISTORIQUE LOCAL</h2>
          <button 
            onClick={handleSync} disabled={isSyncing || !isOnline}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded transition-colors ${isSyncing ? 'text-blue-300 animate-pulse' : !isOnline ? 'text-gray-600' : 'text-blue-400'}`}
          >
            <UploadCloud size={14} /> {isSyncing ? 'SYNC...' : 'SYNC'}
          </button>
        </div>
        
        <div className="divide-y divide-gray-800 max-h-60 overflow-y-auto">
          {!events?.length && <div className="p-6 text-center text-gray-600 text-sm">Aucun scan récent</div>}
          {events?.map((event) => (
            <div key={event.id} className="p-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-white">{event.pallet_id}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(event.timestamp_local).toLocaleTimeString()}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                  {event.event_type}
                </span>
                <div className={`text-[10px] font-bold flex items-center gap-1 ${event.status === 'pending' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {event.status === 'synced' && <CheckCircle2 size={10} />}
                  {event.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}