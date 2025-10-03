import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

console.log('🔍 Checking Database Functions and Setup...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
    try {
        console.log('\n1️⃣ Checking if auth functions exist...')
        
        // Try to call get_user_profile function
        const { data: profileTest, error: profileError } = await supabase
            .rpc('get_user_profile', { user_uuid: '00000000-0000-0000-0000-000000000000' })

        if (profileError) {
            if (profileError.message.includes('function get_user_profile')) {
                console.log('❌ get_user_profile function NOT found!')
                console.log('🛠️  Need to run: auth-functions.sql')
            } else {
                console.log('✅ get_user_profile function exists (empty result expected)')
            }
        } else {
            console.log('✅ get_user_profile function working')
        }

        console.log('\n2️⃣ Checking table structure...')
        
        // Check if user_profiles table is accessible
        const { data: profiles, error: profileTableError } = await supabase
            .from('user_profiles')
            .select('id, username, email, role')
            .limit(1)

        if (profileTableError) {
            console.log('❌ user_profiles table error:', profileTableError.message)
        } else {
            console.log('✅ user_profiles table accessible')
        }

        // Check if categories table is accessible
        const { data: categories, error: categoryError } = await supabase
            .from('categories')
            .select('id, name, color')
            .limit(1)

        if (categoryError) {
            console.log('❌ categories table error:', categoryError.message)
        } else {
            console.log('✅ categories table accessible')
        }

        console.log('\n3️⃣ Testing auth configuration...')
        
        // Check auth settings
        console.log('🔐 Testing auth methods availability...')
        if (supabase.auth) {
            console.log('✅ Supabase Auth client initialized')
            
            try {
                // Try to get current session (should return null/empty)
                const { data: session, error: sessionError } = await supabase.auth.getSession()
                
                if (sessionError) {
                    console.log('⚠️  Session check error:', sessionError.message)
                } else {
                    console.log('✅ Auth session check working')
                    console.log('🎫 Current session:', session.session ? 'Active' : 'None')
                }
            } catch (error) {
                console.log('⚠️  Auth test error:', error.message)
            }
        }

        console.log('\n4️⃣ Checking RLS policies...')
        
        // Try to insert a test record (this should fail without auth - which means RLS is working)
        const { error: rlsError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                username: 'test',
                email: 'test@test.com'
            })

        if (rlsError) {
            if (rlsError.message.includes('RLS') || rlsError.message.includes('policy')) {
                console.log('✅ RLS policies working correctly (insert blocked)')
            } else {
                console.log('⚠️  RLS test error:', rlsError.message)
            }
        } else {
            console.log('⚠️  RLS might not be working - insert succeeded without auth')
        }

        console.log('\n🎯 Diagnosis:')
        
        if (profileError && profileError.message.includes('function get_user_profile')) {
            console.log('❗ ISSUE FOUND: Missing database functions')
            console.log('🔧 SOLUTION: Run auth-functions.sql in Supabase SQL Editor')
            console.log('')
            console.log('📋 Steps:')
            console.log('1. Go to Supabase Dashboard')
            console.log('2. Open SQL Editor')
            console.log('3. Copy content from auth-functions.sql')
            console.log('4. Click Run')
            console.log('5. Try test again')
        } else {
            console.log('✅ Database setup looks good')
            console.log('ℹ️  Auth errors might be due to email confirmation or other settings')
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message)
    }
}

checkDatabase()