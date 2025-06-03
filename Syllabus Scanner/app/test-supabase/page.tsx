import SupabaseTest from '@/components/supabase-test';

export default function TestSupabasePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        <SupabaseTest />
      </div>
    </main>
  );
}
