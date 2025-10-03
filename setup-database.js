import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_KEY')
    process.exit(1)
}

console.log('🔄 Connecting to Supabase...')
console.log('📍 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
    try {
        // Test connection first
        console.log('🧪 Testing connection...')
        const { data, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1)

        if (testError) {
            console.error('❌ Connection failed:', testError.message)
            return
        }

        console.log('✅ Connection successful!')

        // Read and execute schema
        console.log('📖 Reading schema file...')
        const schemaSQL = readFileSync('./supabase-complete-auth-schema.sql', 'utf8')

        console.log('🚀 Executing schema...')
        
        // Split the SQL into individual statements and execute them
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))

        console.log(`📝 Found ${statements.length} SQL statements to execute`)

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim()
            if (!statement) continue

            console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`)
            
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: statement + ';'
            })

            if (error) {
                console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
                // Continue with next statement even if there's an error (might be duplicate tables)
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`)
            }
        }

        console.log('🎉 Database schema setup completed!')
        
        // Verify some key tables were created
        console.log('🔍 Verifying tables...')
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', [
                'user_profiles', 
                'user_sessions', 
                'tasks', 
                'categories', 
                'pomodoro_sessions',
                'frog_tasks'
            ])

        if (tableError) {
            console.error('❌ Error checking tables:', tableError.message)
        } else {
            console.log('📋 Created tables:', tables.map(t => t.table_name))
            
            if (tables.length >= 6) {
                console.log('✅ All main tables created successfully!')
            } else {
                console.log('⚠️  Some tables might be missing')
            }
        }

    } catch (error) {
        console.error('❌ Setup failed:', error.message)
    }
}

// Alternative approach using direct SQL execution
async function setupDatabaseDirect() {
    try {
        console.log('🔄 Using direct SQL execution approach...')
        
        const schemaSQL = readFileSync('./supabase-complete-auth-schema.sql', 'utf8')
        
        // Execute the entire schema as one query
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: schemaSQL
        })

        if (error) {
            console.error('❌ Schema execution failed:', error.message)
            
            // Try the statement-by-statement approach
            console.log('🔄 Falling back to statement-by-statement execution...')
            await setupDatabase()
        } else {
            console.log('✅ Schema executed successfully!')
        }

    } catch (error) {
        console.error('❌ Direct setup failed:', error.message)
        console.log('🔄 Trying alternative approach...')
        await setupDatabase()
    }
}

// Run the setup
setupDatabaseDirect()