interface FrontendEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL: string;
}

function validateFrontendEnv(): FrontendEnv {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
    new URL(import.meta.env.VITE_API_URL);
  } catch {
    throw new Error('Invalid URL format in environment variables');
  }

  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: import.meta.env.VITE_API_URL
  };
}

export const frontendEnv = validateFrontendEnv();

// Security helper to check if we're in production
export const isProductionFrontend = (): boolean => {
  return window.location.protocol === 'https:' && 
         !window.location.hostname.includes('localhost') &&
         !window.location.hostname.includes('127.0.0.1');
};