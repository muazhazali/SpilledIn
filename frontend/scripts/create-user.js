import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = 'https://zgccqwtffzzlehrjjedl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY2Nxd3RmZnp6bGVocmpqZWRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkxOTgxMCwiZXhwIjoyMDY1NDk1ODEwfQ.xNCoyofS2uh0f6Gvz7YiNj0yjgGBUdsrOy72FcdWuKc'

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

const createUser = async () => {
  try {
    console.log('🚀 Supabase User Creation Script')
    console.log('================================\n')

    // Get user input
    const email = await question('Enter email: ')
    const password = await question('Enter password: ')
    const inviteCode = await question('Enter company invite code: ')

    console.log('\n⏳ Creating user...')

    // First, verify the invite code exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('invite_code', inviteCode)
      .single()

    if (companyError || !company) {
      throw new Error(`Invalid invite code: ${inviteCode}`)
    }

    console.log(`✅ Found company: ${company.name}`)

    // Create the auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email for admin-created users
    })

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`)
    }

    console.log(`✅ Auth user created with ID: ${authData.user.id}`)

    // Generate anonymous username
    const { data: usernameData, error: usernameError } = await supabase
      .rpc('generate_anonymous_username')

    if (usernameError) {
      throw new Error(`Username generation failed: ${usernameError.message}`)
    }

    console.log(`✅ Generated username: ${usernameData}`)

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        company_id: company.id,
        anonymous_username: usernameData,
        toxicity_score: 0,
        total_upvotes: 0,
        total_downvotes: 0
      })

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    console.log('✅ User profile created')
    console.log('\n🎉 User created successfully!')
    console.log(`📧 Email: ${email}`)
    console.log(`👤 Username: ${usernameData}`)
    console.log(`🏢 Company: ${company.name}`)

  } catch (error) {
    console.error('\n❌ Error creating user:', error.message)
  } finally {
    rl.close()
  }
}

const listCompanies = async () => {
  try {
    console.log('\n📋 Available Companies:')
    console.log('======================')

    const { data: companies, error } = await supabase
      .from('companies')
      .select('name, invite_code')
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }

    if (companies.length === 0) {
      console.log('No companies found.')
      return
    }

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (Code: ${company.invite_code})`)
    })

  } catch (error) {
    console.error('❌ Error fetching companies:', error.message)
  }
}

const main = async () => {
  console.log('What would you like to do?')
  console.log('1. Create a new user')
  console.log('2. List available companies')
  console.log('3. Exit')

  const choice = await question('\nEnter your choice (1-3): ')

  switch (choice) {
    case '1':
      await createUser()
      break
    case '2':
      await listCompanies()
      // Ask if they want to create a user after seeing companies
      const createAfter = await question('\nWould you like to create a user now? (y/n): ')
      if (createAfter.toLowerCase() === 'y' || createAfter.toLowerCase() === 'yes') {
        await createUser()
      } else {
        rl.close()
      }
      break
    case '3':
      console.log('👋 Goodbye!')
      rl.close()
      break
    default:
      console.log('Invalid choice. Please run the script again.')
      rl.close()
  }
}

// Check if required environment variables are set
if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
  console.error('❌ Please set NEXT_PUBLIC_SUPABASE_URL environment variable')
  process.exit(1)
}

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

main().catch(console.error) 