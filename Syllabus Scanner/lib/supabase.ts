import { createClient } from '@supabase/supabase-js';

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

// Create client with detailed error handling and CORS support
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth',
  },
  global: {
    fetch: (url, options) => {
      console.log(`Supabase API request to: ${url.toString().split('?')[0]}`);
      
      // Create a clean options object with headers
      const fetchOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'x-client-info': 'supabase-js/2.0.0',
          'apikey': supabaseAnonKey, // Add the API key as a header
        },
      };

      console.log('Fetch options:', {
        url: url.toString(),
        method: fetchOptions.method || 'GET',
        headers: fetchOptions.headers,
      });

      return fetch(url, fetchOptions).then(async response => {
        if (!response.ok) {
          // Don't log 401/403 errors for auth endpoints as these are expected during normal operation
          const isAuthEndpoint = url.toString().includes('/auth/');
          const isAuthError = response.status === 401 || response.status === 403;
          
          // Get the response text for better error messages
          let errorBody = '';
          try {
            errorBody = await response.text();
            try {
              // Try to parse as JSON if possible
              errorBody = JSON.parse(errorBody);
            } catch (e) {
              // Not JSON, keep as text
            }
          } catch (e) {
            console.error('Error reading error response:', e);
          }
          
          if (!(isAuthEndpoint && isAuthError)) {
            console.error('Supabase API error:', {
              status: response.status,
              statusText: response.statusText,
              url: url.toString(),
              method: fetchOptions.method || 'GET',
              error: errorBody,
            });
            
            // Add enhanced error debugging for auth errors
            if (response.status === 401) {
              console.error('Authentication error details:');
              console.error('- Request URL:', url.toString().split('?')[0]);
              console.error('- Is auth endpoint:', isAuthEndpoint);
              
              // Clone the response for detailed inspection
              response.clone().text().then(text => {
                try {
                  const errorBody = JSON.parse(text);
                  console.error('- Error response:', errorBody);
                  
                  // Log specific error information
                  if (errorBody.error) {
                    console.error('- Error message:', errorBody.error);
                    console.error('- Error description:', errorBody.error_description);
                  }
                } catch (e) {
                  console.error('- Raw error response:', text);
                }
              }).catch(err => {
                console.error('- Failed to parse error body:', err);
              });
            }
          }
        }
        return response;
      }).catch(error => {
        console.error(`Supabase fetch error:`, error);
        throw error;
      });
    }
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
    // First test a simple health check
    console.log('Attempting to connect to Supabase...');
    const { data: healthData, error: healthError } = await supabase.from('_test_connection_').select('*').limit(1);
    
    if (healthError) {
      console.log('Initial connection test error:', healthError);
      // This is expected since the table doesn't exist, but we want to check if we can reach the API
      
      // Check if this is a 404 error (table not found) which is actually good
      const isTableNotFoundError = healthError.message?.includes('does not exist') || healthError.code === '42P01';
      
      if (isTableNotFoundError) {
        console.log('Connection successful (404 error is expected for non-existent test table)');
        
        // Now try to access a real table
        console.log('Trying to access syllabi table...');
        const { data, error } = await supabase.from('syllabi').select('count', { count: 'exact' }).limit(1);
        
        if (error) {
          console.error('Syllabi table access failed:', error);
          return { 
            success: false, 
            error,
            message: 'Could connect to Supabase but couldn\'t access syllabi table',
            tableMissing: error.code === '42P01',
            envStatus
          };
        }
        
        console.log('Supabase connection and syllabi table access successful!');
        return { success: true, data };
      }
      
      // If we get here, there was a real connection error
      return { 
        success: false, 
        error: healthError,
        message: 'Failed to connect to Supabase API',
        envStatus
      };
    }
    
    console.log('Supabase connection successful');
    return { success: true, data: healthData };
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
  console.log(`Ensuring bucket '${bucketName}' exists...`);
  
  if (!envStatus.hasUrl || !envStatus.hasAnonKey) {
    console.error('Cannot create bucket: Missing required environment variables');
    return { 
      success: false, 
      error: 'Missing Supabase credentials in environment variables',
      envStatus
    };
  }
  
  try {
    // First check if bucket exists
    console.log('Listing existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { 
        success: false, 
        error: listError,
        message: 'Failed to list storage buckets',
        envStatus
      };
    }
    
    console.log('Current buckets:', buckets?.map(b => b.name).join(', ') || 'none');
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' not found, creating it now...`);
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
          return { 
            success: false, 
            error,
            message: `Failed to create bucket '${bucketName}'`,
            envStatus
          };
        }
        
        console.log(`Bucket '${bucketName}' created successfully`);
      } catch (bucketError) {
        console.error('Exception creating bucket:', bucketError);
        return {
          success: false,
          error: bucketError,
          message: `Exception occurred creating bucket '${bucketName}'`
        };
      }
    } else {
      console.log(`Bucket '${bucketName}' already exists`);
    }

    // Always double-check that we can upload to the bucket
    console.log('Testing bucket permissions...');
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testContent], '_test_permission.txt');

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload('_test_permission.txt', testFile, { upsert: true });

      if (uploadError) {
        console.error('Permission test upload failed:', uploadError);
        return {
          success: false,
          error: uploadError,
          message: 'Bucket exists but upload test failed - check RLS policies'
        };
      }

      console.log('Permission test successful');

      // Clean up the test file
      await supabase.storage
        .from(bucketName)
        .remove(['_test_permission.txt']);
      
      console.log('Bucket setup complete and working correctly');
      return { success: true };
    } catch (permError) {
      console.error('Upload test error:', permError);
      return {
        success: false,
        error: permError,
        message: 'Bucket exists but testing upload permissions failed'
      };
    }
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return { 
      success: false, 
      error,
      message: `Exception while ensuring bucket '${bucketName}' exists`,
      envStatus
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