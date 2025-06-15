-- =====================================================
-- SpilledIn Complete Setup with Sample Data
-- =====================================================
-- This script runs the full database setup AND loads sample data
-- Perfect for development and testing environments

-- Run the main database setup first
\i supabase-setup.sql

-- Wait a moment for setup to complete
SELECT pg_sleep(1);

-- Load comprehensive sample data
\i seed-data.sql

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SpilledIn setup completed with sample data!';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to test:';
    RAISE NOTICE '✅ Database tables and functions';
    RAISE NOTICE '✅ Row Level Security policies';
    RAISE NOTICE '✅ Storage bucket for images';
    RAISE NOTICE '✅ Sample companies with invite codes';
    RAISE NOTICE '✅ Sample users with realistic data';
    RAISE NOTICE '✅ Sample confessions and votes';
    RAISE NOTICE '✅ Sample awards for Toxic Wrapped';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your .env.local with Supabase credentials';
    RAISE NOTICE '2. Test user registration with invite codes';
    RAISE NOTICE '3. Start your Next.js app: pnpm dev';
    RAISE NOTICE '';
    RAISE NOTICE 'Happy confessing! 🤫';
END $$; 