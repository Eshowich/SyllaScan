// Simple script to check if environment variables are set
console.log('Checking environment variables...\n');

const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allSet = true;

envVars.forEach(varName => {
  const value = process.env[varName] || '';
  const isSet = value.length > 0;
  
  if (isSet) {
    const maskedValue = varName.includes('KEY') 
      ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}`
      : value;
    console.log(`✅ ${varName} is set: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName} is NOT SET`);
    allSet = false;
  }
});

console.log('\n---\n');

if (allSet) {
  console.log('✅ All required environment variables are set!');
  console.log('You can now run the development server and visit http://localhost:3000/test-supabase to test the connection.');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('Please add them to your .env.local file and restart your development server.');
  console.log('\nExample .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('\nYou can find these values in your Supabase project settings under Project Settings > API');
}
