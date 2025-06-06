const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/20230604000000_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements: string[] = migrationSQL
      .split(';')
      .map((statement: string) => statement.trim())
      .filter((statement: string) => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement: string = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('pg_temp.execute_sql', {
          sql: statement
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          console.error('Failed statement:', statement);
          throw error;
        }
      } catch (error) {
        console.error('Error executing migration:', error);
        throw error;
      }
    }
    
    console.log('✅ Database migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    process.exit(1);
  }
}

// Create the execute_sql function if it doesn't exist
async function createExecuteSQLFunction() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      create or replace function pg_temp.execute_sql(sql text)
      returns json as $$
      declare
        result json;
      begin
        execute sql;
        return json_build_object('success', true);
      exception when others then
        return json_build_object(
          'success', false,
          'error', sqlstate || ': ' || sqlerrm
        );
      end;
      $$ language plpgsql;
    `
  });
  
  if (error) {
    console.error('Error creating execute_sql function:', error);
    throw error;
  }
}

// Run the migrations
async function main() {
  try {
    await createExecuteSQLFunction();
    await applyMigrations();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
