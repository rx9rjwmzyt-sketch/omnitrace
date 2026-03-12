import Dexie, { type EntityTable } from 'dexie';

// 1. On définit la forme de notre donnée (Le Contrat)
interface LogisticsEvent {
  id: string;
  pallet_id: string;
  event_type: string;
  timestamp_local: number;
  status: 'pending' | 'synced'; // 'pending' veut dire : en attente de réseau
}

// 2. On crée la base de données "OmniTraceDB"
const db = new Dexie('OmniTraceDB') as Dexie & {
  events: EntityTable<LogisticsEvent, 'id'>;
};

// 3. On crée la table "events" (id est la clé principale, et on indexe le timestamp)
db.version(2).stores({
    events: 'id, pallet_id, status, timestamp_local' 
  });

export { db };