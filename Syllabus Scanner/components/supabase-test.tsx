"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState('Connecting to Supabase...');
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test database connection by fetching tables
        const { data, error: dbError } = await supabase
          .from('syllabi')
          .select('*')
          .limit(1);

        if (dbError) throw dbError;

        // If we get here, connection is successful
        setConnectionStatus('✅ Connected to Supabase!');
        
        // Get list of tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
          
        if (tablesError) throw tablesError;
        
        setTables(tablesData.map((t: any) => t.tablename));
      } catch (err) {
        console.error('Supabase connection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConnectionStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="font-medium">Connection Status:</p>
        <p className={connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
          {connectionStatus}
        </p>
        
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
            <p className="font-medium">Error:</p>
            <code className="text-sm">{error}</code>
          </div>
        )}
      </div>
      
      {tables.length > 0 && (
        <div className="mt-4">
          <p className="font-medium">Database Tables:</p>
          <ul className="list-disc pl-5 mt-2">
            {tables.map((table) => (
              <li key={table} className="text-sm">{table}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          If you're having connection issues, please ensure your environment variables are set correctly in <code>.env.local</code>
        </p>
      </div>
    </div>
  );
}
