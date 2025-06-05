import { createClient } from '@supabase/supabase-js';

// Define a custom type for StorageError since it's not exported from the package
type StorageError = Error & {
  statusCode?: number;
  error?: string;
  message: string;
};

type StorageApiResponse = {
  data: any;
  error: StorageError | null;
};

// Detailed debug function for environment variables
const debugEnvironmentVariables = () => {
  // Check if we're in browser or server environment
  const isServer = typeof window === 'undefined';
  console.log('Environment:', isServer ? 'Server-side' : 'Client-side');
  
  // Get all environment variables relevant to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase Environment Variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing', 
              supabaseUrl ? `(${supabaseUrl.substring(0, 10)}...)` : '');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing',
              supabaseAnonKey ? '(starts with: ' + supabaseAnonKey.substring(0, 10) + '...)' : '');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing',
              serviceRoleKey ? '(starts with: ' + serviceRoleKey.substring(0, 10) + '...)' : '');
              
  // Print source of environment variables
  console.log('Environment variables source:');
  console.log('- From next.config.mjs?', process.env.NEXT_CONFIG_LOADED === 'true' ? 'Yes' : 'Unknown');
  console.log('- From .env.local?', process.env.ENV_LOCAL_LOADED === 'true' ? 'Yes' : 'Unknown');
  
  return {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!serviceRoleKey
  };
};

// Run debug immediately
const envStatus = debugEnvironmentVariables();

// Handle case where URL is empty but still create client for type safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client with simple, working configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth',
  }
});

// Helper to verify user is authenticated before performing operations
export const ensureAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      return { authenticated: false, error };
    }
    
    if (!data.session) {
      console.log("No active session found");
      return { authenticated: false, error: new Error("No active session") };
    }
    
    // Check if token will expire soon (within 5 minutes)
    const expiresAt = data.session.expires_at;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const fiveMinutesInSeconds = 5 * 60;
    
    if (expiresAt && expiresAt < nowInSeconds + fiveMinutesInSeconds) {
      console.log("Session expiring soon, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        return { authenticated: false, error: refreshError };
      }
      
      return { 
        authenticated: !!refreshData.session, 
        session: refreshData.session,
        refreshed: true
      };
    }
    
    return { authenticated: true, session: data.session };
  } catch (error) {
    console.error("Error checking authentication:", error);
    return { authenticated: false, error };
  }
};

// More detailed test connection function
export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  if (!envStatus.hasUrl || !envStatus.hasAnonKey) {
    console.error('Cannot test connection: Missing required environment variables');
    return { 
      success: false, 
      error: 'Missing Supabase credentials in environment variables',
      envStatus
    };
  }
  
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Directly test with the syllabi table
    const { data, error } = await supabase
      .from('syllabi')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing syllabi table:', error);
      
      // Check if this is a table not found error
      const isTableMissing = error.message?.includes('does not exist') || error.code === '42P01';
      
      if (isTableMissing) {
        console.log('Connection successful but syllabi table does not exist');
        return { 
          success: true, 
          message: 'Successfully connected to Supabase (syllabi table not found)',
          tableMissing: true,
          envStatus
        };
      }
      
      // If we get here, there was a real connection error
      return { 
        success: false, 
        error,
        message: 'Failed to connect to Supabase API',
        envStatus
      };
    }
    
    console.log('Successfully connected to Supabase and accessed syllabi table');
    return { 
      success: true, 
      data,
      message: 'Successfully connected to Supabase',
      envStatus
    };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return { 
      success: false, 
      error,
      message: 'Exception during connection test',
      envStatus
    };
  }
};

// Create storage bucket if it doesn't exist with better error handling
export const ensureBucketExists = async (bucketName = 'syllabi') => {
  console.log(`[ensureBucketExists] Starting bucket check for '${bucketName}'`);
  
  if (!envStatus.hasUrl || !envStatus.hasAnonKey) {
    const errorMsg = 'Missing required Supabase environment variables';
    console.error(errorMsg);
    return { 
      success: false, 
      error: new Error(errorMsg),
      message: errorMsg,
      envStatus
    };
  }

  // First, try to interact with the bucket directly
  try {
    console.log(`[ensureBucketExists] Attempting to access bucket '${bucketName}'`);
    
    // Try to list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();
    
    // If we get here, the bucket exists and we can access it
    if (!listError) {
      console.log(`[ensureBucketExists] Successfully accessed bucket '${bucketName}'`);
      return { 
        success: true, 
        message: `Bucket '${bucketName}' is accessible`,
        bucketExists: true
      };
    }

    // If we get a 404 or similar error, the bucket doesn't exist yet
    if (listError.message.includes('not found') || listError.message.includes('404') || listError.message.includes('does not exist')) {
      console.log(`[ensureBucketExists] Bucket '${bucketName}' not found, creating...`);
      
      try {
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'text/plain'
          ],
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) throw createError;
        
        console.log(`[ensureBucketExists] Successfully created bucket '${bucketName}'`);
        return { 
          success: true, 
          message: `Created and accessed bucket '${bucketName}'`,
          bucketCreated: true
        };
      } catch (createError) {
        const error = createError as Error;
        console.error(`[ensureBucketExists] Error creating bucket '${bucketName}':`, error);
        return {
          success: false,
          error,
          message: `Failed to create bucket: ${error.message}`
        };
      }
    }

    // If we get here, there was some other error
    console.error(`[ensureBucketExists] Error accessing bucket '${bucketName}':`, listError);
    return {
      success: false,
      error: listError,
      message: `Error accessing bucket: ${listError.message}`
    };
    
  } catch (error) {
    const err = error as Error;
    console.error(`[ensureBucketExists] Unexpected error with bucket '${bucketName}':`, err);
    return {
      success: false,
      error: err,
      message: `Unexpected error: ${err.message}`
    };
  }
};

// Handle Google Auth with Supabase
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      },
    });

    if (error) {
      throw error;
    }

    return { success: true, url: data?.url };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error };
  }
};

// Get current user session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null };
  }
};

// Sign out user
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

/**
 * Check if a bucket exists and is accessible
 */
export const checkBucketAccess = async (bucketName = 'syllabi') => {
  try {
    console.log(`[checkBucketAccess] Checking access to bucket '${bucketName}'`);
    
    // Try to get the bucket info directly
    const { data: bucketInfo, error: bucketError } = await supabase
      .storage
      .getBucket(bucketName);

    // If we get here and no error, the bucket exists
    if (!bucketError && bucketInfo) {
      console.log(`[checkBucketAccess] Bucket '${bucketName}' is accessible`);
      return { 
        success: true, 
        exists: true,
        message: `Bucket '${bucketName}' is accessible`
      };
    }

    // If we get a 404 or similar, the bucket doesn't exist
    const statusCode = (bucketError as any)?.statusCode;
    if (statusCode === 404 || bucketError?.message?.includes('not found')) {
      console.log(`[checkBucketAccess] Bucket '${bucketName}' does not exist`);
      return { 
        success: true, 
        exists: false,
        message: `Bucket '${bucketName}' does not exist`
      };
    }

    // For any other error, throw it
    throw bucketError;
  } catch (error) {
    const err = error as Error;
    console.error(`[checkBucketAccess] Error checking bucket '${bucketName}':`, err);
    return { 
      success: false, 
      error: err,
      message: `Error checking bucket access: ${err.message}`,
      exists: false
    };
  }
};

/**
 * Create the syllabi bucket with appropriate settings
 */
export const createSyllabiBucket = async () => {
  const bucketName = 'syllabi';
  try {
    console.log(`[createSyllabiBucket] Attempting to create bucket '${bucketName}'`);
    
    // First check if bucket exists
    const { data: bucketExists } = await supabase.storage.getBucket(bucketName);
    if (bucketExists) {
      console.log(`[createSyllabiBucket] Bucket '${bucketName}' already exists`);
      return { 
        success: true, 
        message: `Bucket '${bucketName}' already exists`,
        bucketCreated: false
      };
    }

    // Create the bucket with all required options
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      fileSizeLimit: '10MB'
    });

    if (error) {
      // If the error is that the bucket already exists (race condition), that's fine
      if (error.message.includes('already exists')) {
        console.log(`[createSyllabiBucket] Bucket '${bucketName}' already exists (race condition)`);
        return { 
          success: true, 
          message: `Bucket '${bucketName}' already exists`,
          bucketCreated: false
        };
      }
      throw error;
    }

    console.log(`[createSyllabiBucket] Successfully created bucket '${bucketName}'`);
    return { 
      success: true, 
      message: `Created bucket '${bucketName}'`,
      bucketCreated: true
    };
  } catch (error) {
    const err = error as Error;
    console.error(`[createSyllabiBucket] Error creating bucket '${bucketName}':`, err);
    return { 
      success: false, 
      error: err,
      message: `Failed to create bucket: ${err.message}`,
      bucketCreated: false
    };
  }
};

/**
 * Simplified function to ensure the bucket exists
 */
export const ensureSyllabiBucket = async () => {
  const bucketName = 'syllabi';
  try {
    // First ensure user is authenticated
    const authCheck = await ensureAuthenticated();
    if (!authCheck.authenticated) {
      console.error('User not authenticated for bucket operations');
      return { 
        success: false, 
        message: 'Authentication required for storage operations',
        error: new Error('Not authenticated')
      };
    }

    console.log(`[ensureSyllabiBucket] Checking if bucket '${bucketName}' exists`);
    
    // Try to test bucket access by attempting to list files (this doesn't require bucket creation permissions)
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (!listError) {
      console.log(`[ensureSyllabiBucket] Bucket '${bucketName}' exists and is accessible`);
      return { 
        success: true, 
        bucketExists: true, 
        message: `Bucket '${bucketName}' exists and is accessible`,
        bucketCreated: false
      };
    }
    
    // If we get a "not found" error, the bucket doesn't exist
    if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
      console.error(`[ensureSyllabiBucket] Bucket '${bucketName}' does not exist. Please create it in the Supabase Dashboard.`);
      return { 
        success: false, 
        error: listError,
        message: `Bucket '${bucketName}' does not exist. Please create it manually in the Supabase Dashboard under Storage > Create new bucket.`
      };
    }
    
    // For any other error, log it and return failure
    console.error(`[ensureSyllabiBucket] Error accessing bucket:`, listError);
    return { 
      success: false, 
      error: listError,
      message: `Error accessing bucket: ${listError.message}`
    };
    
  } catch (error) {
    const err = error as Error;
    console.error('Error in ensureSyllabiBucket:', err);
    return { 
      success: false, 
      error: err,
      message: `Failed to check bucket: ${err.message}`
    };
  }
};

/**
 * Initialize the database schema and RLS policies
 * This should be called once during app initialization
 */
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database schema...');
    
    // Create syllabi table if it doesn't exist
    const { data: tableData, error: tableError } = await supabase.rpc('create_schema_if_not_exists');
    
    if (tableError) {
      console.error('Error creating schema:', tableError);
      throw tableError;
    }
    
    console.log('Database schema initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to initialize database') 
    };
  }
};

// Store syllabus data
export const storeSyllabusData = async (userId: string, syllabusData: any) => {
  try {
    const { data, error } = await supabase
      .from('syllabi')
      .insert([
        { user_id: userId, data: syllabusData, created_at: new Date() }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error storing syllabus data:', error);
    return { success: false, error };
  }
};

// Get user syllabi
export const getUserSyllabi = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('syllabi')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, syllabi: data };
  } catch (error) {
    console.error('Error getting user syllabi:', error);
    return { success: false, syllabi: [], error };
  }
}; 