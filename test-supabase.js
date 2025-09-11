import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqqruphhynqinioklsax.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcXJ1cGhoeW5xaW5pb2tsc2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDIyODMsImV4cCI6MjA3MzE3ODI4M30.p8O7k2CtCR6_QgoVbReYoWI36ymucb1lb35DT0XT-ao'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('tasks')
      .select('count', { count: 'exact' })
    
    if (error) {
      console.error('❌ Connection error:', error.message)
      console.log('💡 You may need to create the tasks table first')
      console.log('💡 Run the SQL from supabase-schema.sql in your Supabase dashboard')
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log(`📊 Found ${data.length > 0 ? data[0].count : 0} tasks in database`)
    
    // Test inserting a sample task
    console.log('🔄 Testing insert operation...')
    const { data: insertData, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task from Node.js',
        description: 'This is a test task created from our connection script',
        assignee_id: '00000000-0000-0000-0000-000000000001', // UUID for Alex Johnson
        due_date: '2025-09-12',
        priority: 'Low',
        status: 'To Do'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message)
      return false
    }
    
    console.log('✅ Insert successful!')
    console.log('📝 Created task:', insertData)
    
    return true
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

// Run the test
testConnection().then((success) => {
  if (success) {
    console.log('🎉 All tests passed! Supabase is ready to use.')
  } else {
    console.log('💥 Tests failed. Please check your configuration.')
  }
  process.exit(success ? 0 : 1)
})
