// This script checks if your Supabase environment variables are set correctly

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Checking Supabase environment variables...\n');

let allVarsSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value && value.length > 0;
  
  if (isSet) {
    const maskedValue = varName.includes('KEY') 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value;
      
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allVarsSet = false;
  }
});

console.log('\n---\n');

if (allVarsSet) {
  console.log('🎉 All required environment variables are set!');
  console.log('You can now run the development server and visit http://localhost:3000/test-supabase to test the connection.');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('Please add them to your .env.local file and restart your development server.');
  console.log('\nExample .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
}

// Check if we're running in a Next.js environment
if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('http')) {
  console.log('\n⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL should start with https://');
}

// Check if the anon key looks like a Supabase anon key
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('ey')) {
  console.log('\n⚠️  WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY should start with "ey"');
}
