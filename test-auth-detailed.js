import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

console.log('🔐 Detailed Authentication Test...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthDetailed() {
    try {
        console.log('\n1️⃣ Testing with existing user first...')
        
        // Let's try a different approach - check if we can create a user without triggering the profile creation
        const testEmail = 'testuser001@example.com'
        const testPassword = 'testpassword123'
        
        console.log('📧 Test credentials:')
        console.log('   Email:', testEmail)
        console.log('   Password:', testPassword)

        console.log('\n2️⃣ Attempting signup with detailed error tracking...')
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    username: 'testuser001',
                    full_name: 'Test User 001'
                }
            }
        })

        if (signupError) {
            console.log('❌ Signup Error Details:')
            console.log('   Message:', signupError.message)
            console.log('   Status:', signupError.status)
            console.log('   Details:', signupError)
            
            // If user already exists, try to login
            if (signupError.message.includes('already registered') || signupError.message.includes('User already registered')) {
                console.log('\n3️⃣ User exists, trying login...')
                
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: testPassword
                })

                if (loginError) {
                    console.log('❌ Login Error:', loginError.message)
                    
                    // Try with simpler password reset approach
                    console.log('\n🔄 Let\'s try with a fresh user...')
                    const freshEmail = `test${Date.now()}@example.com`
                    console.log('📧 Trying with fresh email:', freshEmail)
                    
                    const { data: freshSignup, error: freshError } = await supabase.auth.signUp({
                        email: freshEmail,
                        password: testPassword,
                        options: {
                            data: {
                                username: `user${Date.now()}`,
                                full_name: 'Fresh Test User'
                            }
                        }
                    })
                    
                    if (freshError) {
                        console.log('❌ Fresh signup also failed:', freshError.message)
                        console.log('🔍 Let\'s check auth settings...')
                        
                        // Check if email confirmation is required
                        if (freshError.message.includes('confirmation') || freshError.message.includes('confirm')) {
                            console.log('📧 Email confirmation might be required')
                            console.log('🛠️  Solution: Disable email confirmation in Supabase Auth settings')
                        }
                        
                        return
                    } else {
                        console.log('✅ Fresh signup successful!')
                        console.log('👤 New user ID:', freshSignup.user?.id)
                        
                        if (freshSignup.user && freshSignup.session) {
                            console.log('🎫 Session created successfully')
                            
                            // Test profile creation
                            setTimeout(async () => {
                                console.log('\n4️⃣ Checking profile creation...')
                                const { data: profile, error: profileError } = await supabase
                                    .rpc('get_user_profile', { user_uuid: freshSignup.user.id })
                                
                                if (profileError) {
                                    console.log('❌ Profile check error:', profileError.message)
                                } else {
                                    console.log('✅ Profile found!')
                                    if (profile && profile.length > 0) {
                                        console.log('📋 Profile data:', {
                                            username: profile[0].username,
                                            email: profile[0].email,
                                            role: profile[0].role
                                        })
                                    }
                                }
                                
                                // Logout
                                await supabase.auth.signOut()
                                console.log('✅ Logout successful')
                                console.log('🎉 Auth test completed successfully!')
                            }, 2000) // Wait 2 seconds for trigger to process
                            
                        } else if (freshSignup.user && !freshSignup.session) {
                            console.log('📧 User created but needs email confirmation')
                            console.log('✅ This is normal if email confirmation is enabled')
                        }
                    }
                } else {
                    console.log('✅ Login successful!')
                    console.log('👤 User:', loginData.user?.email)
                    console.log('🎫 Session active')
                    
                    // Test profile
                    const { data: profile, error: profileError } = await supabase
                        .rpc('get_user_profile', { user_uuid: loginData.user.id })
                    
                    if (profileError) {
                        console.log('⚠️  Profile error:', profileError.message)
                    } else {
                        console.log('✅ Profile loaded successfully!')
                    }
                }
            }
        } else {
            console.log('✅ Signup successful!')
            console.log('👤 User ID:', signupData.user?.id)
            console.log('🎫 Session:', signupData.session ? 'Created' : 'Pending confirmation')
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message)
        console.error('🔍 Stack:', error.stack)
    }
}

testAuthDetailed()