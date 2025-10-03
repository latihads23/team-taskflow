import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

console.log('🔐 Simple Authentication Test (Without Auto Profile Creation)...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSimpleAuth() {
    try {
        console.log('\n1️⃣ Test 1: Basic signup without triggers...')
        
        const testEmail = `simple${Date.now()}@example.com`
        const testPassword = 'simpletest123'
        
        console.log('📧 Testing with:', testEmail)
        
        // Try simple signup without metadata first
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        })

        if (signupError) {
            console.log('❌ Basic signup failed:', signupError.message)
            
            // If it's still a database error, the issue is not with our trigger
            if (signupError.message.includes('Database error saving new user')) {
                console.log('🔍 Database error persists even without metadata')
                console.log('💡 This suggests issue is in Supabase Auth configuration or constraints')
                
                console.log('\n🛠️  Suggested fixes:')
                console.log('1. Check Supabase Auth settings (Email confirmation, etc.)')
                console.log('2. Check if there are other triggers on auth.users')
                console.log('3. Check database constraints')
                console.log('4. Run debug-auth-trigger.sql to disable problematic triggers')
                
                return
            }
        } else {
            console.log('✅ Basic signup successful!')
            console.log('👤 User ID:', signupData.user?.id)
            console.log('✉️  Email:', signupData.user?.email)
            console.log('🎫 Session:', signupData.session ? 'Active' : 'Pending')
            
            if (signupData.user) {
                console.log('\n2️⃣ Test 2: Manual profile creation...')
                
                // Try to manually create profile using our function
                const { data: profileResult, error: profileError } = await supabase
                    .rpc('manual_create_user_profile', {
                        user_uuid: signupData.user.id,
                        user_email: signupData.user.email,
                        display_name: 'Test User'
                    })
                
                if (profileError) {
                    console.log('⚠️  Manual profile creation failed:', profileError.message)
                    
                    // Try direct insert
                    console.log('\n3️⃣ Test 3: Direct profile insert...')
                    const { data: insertResult, error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            user_id: signupData.user.id,
                            email: signupData.user.email,
                            username: signupData.user.email.split('@')[0],
                            full_name: 'Test User Direct'
                        })
                    
                    if (insertError) {
                        console.log('❌ Direct insert failed:', insertError.message)
                        console.log('🔍 This indicates RLS policy or constraint issues')
                    } else {
                        console.log('✅ Direct profile insert successful!')
                    }
                } else {
                    console.log('✅ Manual profile creation successful!')
                }
                
                console.log('\n4️⃣ Test 4: Login test...')
                
                // Try login
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: testPassword
                })
                
                if (loginError) {
                    console.log('❌ Login failed:', loginError.message)
                } else {
                    console.log('✅ Login successful!')
                    console.log('🎫 Session active:', !!loginData.session)
                    
                    // Test profile retrieval
                    const { data: profile, error: getProfileError } = await supabase
                        .rpc('get_user_profile', { user_uuid: loginData.user.id })
                    
                    if (getProfileError) {
                        console.log('⚠️  Profile retrieval failed:', getProfileError.message)
                    } else {
                        console.log('✅ Profile retrieved!')
                        console.log('📋 Profile data:')
                        if (profile && profile.length > 0) {
                            console.log('   Username:', profile[0].username)
                            console.log('   Full name:', profile[0].full_name)
                            console.log('   Role:', profile[0].role)
                        }
                    }
                    
                    // Logout
                    await supabase.auth.signOut()
                    console.log('✅ Logout successful')
                }
            }
        }
        
        console.log('\n🎉 Simple auth test completed!')

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }
}

testSimpleAuth()