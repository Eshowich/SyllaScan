import { SupabaseConnectionTest } from "@/components/supabase-connection-test"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">SyllaScan Debug Tools</h1>
      <div className="space-y-8">
        <SupabaseConnectionTest />
      </div>
    </div>
  )
} 