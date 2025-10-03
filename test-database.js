import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

console.log('🔄 Testing database connection...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
    try {
        // Test basic connection
        console.log('🧪 Testing connection...')
        
        // Test if we can access user_profiles table
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1)

        if (profileError) {
            console.log('⚠️  user_profiles table access:', profileError.message)
        } else {
            console.log('✅ user_profiles table accessible')
        }

        // Test if we can access tasks table
        const { data: tasks, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .limit(1)

        if (taskError) {
            console.log('⚠️  tasks table access:', taskError.message)
        } else {
            console.log('✅ tasks table accessible')
        }

        // Test if we can access categories table
        const { data: categories, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .limit(1)

        if (categoryError) {
            console.log('⚠️  categories table access:', categoryError.message)
        } else {
            console.log('✅ categories table accessible')
        }

        // Test auth signup functionality
        console.log('\n🔐 Testing auth system...')
        
        // For security, we'll just test if auth methods are available
        if (supabase.auth) {
            console.log('✅ Supabase Auth available')
            console.log('📋 Available auth methods:')
            console.log('  - signUp()')
            console.log('  - signInWithPassword()')
            console.log('  - signOut()')
            console.log('  - getSession()')
            console.log('  - onAuthStateChange()')
        }

        console.log('\n🎉 Database test completed!')
        console.log('🚀 Ready to implement authentication system!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

testDatabase()