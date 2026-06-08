// Provide dummy env so any real config/env import passes validation in tests.
// Most tests mock config/supabase + config/redis directly, but this is a safety net.
const defaults: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service',
  MPESA_CONSUMER_KEY: 'test',
  MPESA_CONSUMER_SECRET: 'test',
  MPESA_SHORTCODE: '174379',
  MPESA_PASSKEY: 'test',
  MPESA_CALLBACK_URL: 'https://api.test/v1/payments/mpesa/callback',
  MPESA_ENV: 'sandbox',
  RESEND_API_KEY: 'test-resend',
  CLOUDINARY_CLOUD_NAME: 'test',
  CLOUDINARY_API_KEY: 'test',
  CLOUDINARY_API_SECRET: 'test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'x'.repeat(40),
  API_BASE_URL: 'https://api.test/v1',
  FRONTEND_URL: 'https://www.makazihub.co.ke',
  AT_API_KEY: 'test-at-key',
  AT_USERNAME: 'makazihub',
  AT_SENDER_ID: 'MakaziHub',
}

for (const [k, v] of Object.entries(defaults)) {
  if (!process.env[k]) process.env[k] = v
}
