'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabase, testSupabaseConnection, ensureBucketExists, ensureAuthenticated, signInWithGoogle } from '@/lib/supabase'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, LogIn, Upload } from 'lucide-react'

export function SupabaseConnectionTest() {
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success?: boolean
    message?: string
    details?: any
  }>({ tested: false })
  
  const [bucketStatus, setBucketStatus] = useState<{
    tested: boolean
    success?: boolean
    message?: string
    details?: any
  }>({ tested: false })
  
  const [authStatus, setAuthStatus] = useState<{
    tested: boolean
    success?: boolean
    message?: string
    details?: any
  }>({ tested: false })
  
  const [envVars, setEnvVars] = useState<{
    url?: string
    key?: string
    serviceKey?: string
  }>({})
  
  const testConnection = async () => {
    setLoading(true)
    setConnectionStatus({ tested: true })
    
    try {
      // First check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      setEnvVars({
        url: url ? `${url.substring(0, 10)}...` : undefined,
        key: key ? `${key.substring(0, 10)}...` : undefined,
        serviceKey: serviceKey ? `${serviceKey.substring(0, 10)}...` : undefined
      })
      
      // Test connection
      const result = await testSupabaseConnection()
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message || (result.success ? 'Connection successful' : 'Connection failed'),
        details: result
      })
      
      // If connection successful, test bucket
      if (result.success) {
        testBucket()
      }
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
    } finally {
      setLoading(false)
    }
  }
  
  const testBucket = async () => {
    setBucketStatus({ tested: true })
    
    try {
      const result = await ensureBucketExists('syllabi')
      setBucketStatus({
        tested: true,
        success: result.success,
        message: result.message || (result.success ? 'Bucket exists or was created' : 'Failed to ensure bucket exists'),
        details: result
      })
    } catch (error) {
      setBucketStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
    }
  }
  
  const testAuth = async () => {
    setAuthLoading(true)
    setAuthStatus({ tested: true })
    
    try {
      // Check if already authenticated
      const auth = await ensureAuthenticated()
      
      if (auth.authenticated) {
        setAuthStatus({
          tested: true,
          success: true,
          message: `Authenticated as ${auth.session?.user?.email || 'user'}${auth.refreshed ? ' (token refreshed)' : ''}`,
          details: auth
        })
      } else {
        setAuthStatus({
          tested: true,
          success: false,
          message: 'Not authenticated - please sign in',
          details: auth
        })
      }
    } catch (error) {
      setAuthStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
    } finally {
      setAuthLoading(false)
    }
  }
  
  const handleSignIn = async () => {
    setAuthLoading(true)
    try {
      const result = await signInWithGoogle()
      
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        setAuthStatus({
          tested: true,
          success: false,
          message: 'Sign-in failed',
          details: result
        })
      }
    } catch (error) {
      setAuthStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
    } finally {
      setAuthLoading(false)
    }
  }
  
  const testDirectUpload = async () => {
    setUploadLoading(true)
    
    try {
      // First check authentication
      const auth = await ensureAuthenticated()
      if (!auth.authenticated) {
        throw new Error('Authentication required to upload files')
      }
      
      console.log("Upload test: Authenticated with user ID:", auth.session?.user?.id)
      
      // Create a small test file
      const testBlob = new Blob(['test file content'], { type: 'text/plain' })
      const testFile = new File([testBlob], 'connection-test.txt', { type: 'text/plain' })
      
      // First ensure bucket exists
      console.log("Upload test: Checking if bucket exists...")
      const bucketResult = await ensureBucketExists('syllabi')
      if (!bucketResult.success) {
        throw new Error('Failed to access storage bucket')
      }
      
      // Check bucket policies
      console.log("Upload test: Checking bucket permissions...")
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets()
        console.log("All buckets:", buckets)
        
        if (listError) {
          console.error("Error listing buckets:", listError)
        }
        
        // List files in syllabi bucket to test read permissions
        console.log("Upload test: Checking read permissions...")
        const { data: files, error: filesError } = await supabase.storage.from('syllabi').list()
        
        if (filesError) {
          console.error("Error listing files in syllabi bucket:", filesError)
          throw new Error(`Read permission error: ${filesError.message}`)
        }
        
        console.log("Current files in syllabi bucket:", files)
      } catch (permError) {
        console.error("Permission check error:", permError)
      }
      
      // Attempt upload
      console.log("Upload test: Attempting file upload...")
      const { data, error } = await supabase.storage
        .from('syllabi')
        .upload('connection-test.txt', testFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        console.error("Upload failed with error:", error)
        console.error("Upload error details:", JSON.stringify(error, null, 2))
        
        if (error.statusCode === 401) {
          alert('Authorization error (401): Make sure you have proper storage policies in your Supabase project:\n\n' +
                '1. Go to Supabase Dashboard > Storage > Policies\n' + 
                '2. Check if "syllabi" bucket has INSERT and UPDATE policies for authenticated users')
        }
        
        throw error
      }
      
      // Try to get a public URL to verify it worked
      const publicURL = supabase.storage.from('syllabi').getPublicUrl('connection-test.txt').data.publicUrl
      
      alert(`Test upload successful! File URL: ${publicURL}`)
      return { success: true, data, url: publicURL }
    } catch (error) {
      console.error('Test upload failed:', error)
      alert(`Test upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, error }
    } finally {
      setUploadLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Diagnostics</CardTitle>
        <CardDescription>
          Test your Supabase connection and diagnose any issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Environment Variables</h3>
              <p className="text-sm text-muted-foreground">Check if Supabase credentials are available</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
                {envVars.url ? (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {envVars.url}
                  </span>
                ) : (
                  <span className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                {envVars.key ? (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {envVars.key}
                  </span>
                ) : (
                  <span className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">SUPABASE_SERVICE_ROLE_KEY:</span>
                {envVars.serviceKey ? (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {envVars.serviceKey}
                  </span>
                ) : (
                  <span className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {authStatus.tested && (
            <Alert variant={authStatus.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {authStatus.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>Authentication {authStatus.success ? 'Successful' : 'Required'}</AlertTitle>
              </div>
              <AlertDescription>{authStatus.message}</AlertDescription>
              {authStatus.details && authStatus.details.error && (
                <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(authStatus.details.error, null, 2)}
                </pre>
              )}
            </Alert>
          )}
          
          {connectionStatus.tested && (
            <Alert variant={connectionStatus.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {connectionStatus.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>Connection {connectionStatus.success ? 'Successful' : 'Failed'}</AlertTitle>
              </div>
              <AlertDescription>{connectionStatus.message}</AlertDescription>
              {connectionStatus.details && connectionStatus.details.error && (
                <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(connectionStatus.details.error, null, 2)}
                </pre>
              )}
            </Alert>
          )}
          
          {bucketStatus.tested && (
            <Alert variant={bucketStatus.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {bucketStatus.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>Storage Bucket {bucketStatus.success ? 'Ready' : 'Issue'}</AlertTitle>
              </div>
              <AlertDescription>{bucketStatus.message}</AlertDescription>
              {bucketStatus.details && bucketStatus.details.error && (
                <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(bucketStatus.details.error, null, 2)}
                </pre>
              )}
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={testAuth} disabled={authLoading}>
          {authLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Check Auth
        </Button>
        
        <Button variant="outline" onClick={handleSignIn} disabled={authLoading}>
          {authLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          <LogIn className="mr-2 h-4 w-4" />
          Sign in
        </Button>
        
        <Button variant="outline" onClick={testBucket} disabled={loading || !connectionStatus.success}>
          Test Bucket
        </Button>
        
        <Button variant="outline" onClick={testDirectUpload} disabled={uploadLoading || !authStatus.success}>
          {uploadLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          <Upload className="mr-2 h-4 w-4" />
          Test Upload
        </Button>
        
        <Button onClick={testConnection} disabled={loading}>
          {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Testing..." : "Test Connection"}
        </Button>
      </CardFooter>
    </Card>
  )
} 