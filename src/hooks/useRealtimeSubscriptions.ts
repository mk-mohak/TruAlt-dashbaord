import { useEffect, useCallback } from 'react';
import { DatabaseService } from '../services/databaseService';
import { TABLES } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

export function useRealtimeSubscriptions() {
  const { dispatch } = useApp();

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time update received:', payload);
    
    // Trigger a data refresh when any table changes
    // This ensures the dashboard stays in sync with database changes
    window.dispatchEvent(new CustomEvent('supabase-data-changed', {
      detail: {
        table: payload.table,
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old
      }
    }));
  }, []);

  useEffect(() => {
    const subscriptions: any[] = [];

    // Subscribe to all tables
    Object.values(TABLES).forEach(tableName => {
      const subscription = DatabaseService.subscribeToTable(tableName, handleRealtimeUpdate);
      subscriptions.push(subscription);
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
    };
  }, [handleRealtimeUpdate]);

  return {
    // Could expose subscription status or other real-time related state here
  };
}