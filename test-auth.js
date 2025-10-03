import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

console.log('🔐 Testing Authentication System...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
    try {
        console.log('\n1️⃣ Testing signup...')
        
        // Create test user
        const testEmail = 'test@example.com'
        const testPassword = 'test123456'
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    username: 'testuser',
                    full_name: 'Test User'
                }
            }
        })

        if (signupError) {
            if (signupError.message.includes('already registered')) {
                console.log('✅ User already exists (expected)')
            } else {
                console.log('⚠️  Signup error:', signupError.message)
            }
        } else {
            console.log('✅ Signup successful!')
            console.log('📧 User ID:', signupData.user?.id)
        }

        console.log('\n2️⃣ Testing login...')
        
        // Try to login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        })

        if (loginError) {
            console.log('❌ Login error:', loginError.message)
            return
        }

        console.log('✅ Login successful!')
        console.log('👤 User:', loginData.user?.email)
        console.log('🎫 Session:', loginData.session ? 'Active' : 'None')

        console.log('\n3️⃣ Testing user profile...')
        
        if (loginData.user) {
            // Test get user profile function
            const { data: profile, error: profileError } = await supabase
                .rpc('get_user_profile', { user_uuid: loginData.user.id })

            if (profileError) {
                console.log('⚠️  Profile error:', profileError.message)
            } else {
                console.log('✅ Profile loaded!')
                console.log('📋 Username:', profile?.[0]?.username)
                console.log('👤 Full Name:', profile?.[0]?.full_name)
                console.log('🎨 Role:', profile?.[0]?.role)
                console.log('⚙️  Preferences:', profile?.[0]?.preferences)
            }

            // Test categories
            console.log('\n4️⃣ Testing user categories...')
            const { data: categories, error: catError } = await supabase
                .rpc('get_user_categories', { user_uuid: loginData.user.id })

            if (catError) {
                console.log('⚠️  Categories error:', catError.message)
            } else {
                console.log('✅ Categories loaded!')
                console.log('📁 Categories count:', categories?.length)
                categories?.forEach(cat => {
                    console.log(`  - ${cat.name} (${cat.color}) - ${cat.task_count} tasks`)
                })
            }

            // Test tasks
            console.log('\n5️⃣ Testing user tasks...')
            const { data: tasks, error: taskError } = await supabase
                .rpc('get_user_tasks', { user_uuid: loginData.user.id })

            if (taskError) {
                console.log('⚠️  Tasks error:', taskError.message)
            } else {
                console.log('✅ Tasks loaded!')
                console.log('📝 Tasks count:', tasks?.length)
            }
        }

        console.log('\n6️⃣ Testing logout...')
        
        const { error: logoutError } = await supabase.auth.signOut()
        
        if (logoutError) {
            console.log('❌ Logout error:', logoutError.message)
        } else {
            console.log('✅ Logout successful!')
        }

        console.log('\n🎉 Authentication test completed!')
        console.log('🚀 Auth system is ready to use!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

testAuth()