import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

/**
 * Seed script – run with:
 *   pnpm ts-node scripts/seed-data.ts
 * Requires two environment variables:
 *   - SUPABASE_SERVICE_KEY (service_role)
 *   - SUPABASE_URL
 */

const serviceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseUrl = process.env.SUPABASE_URL!

if (!serviceKey || !supabaseUrl) {
  console.error('Missing SUPABASE_SERVICE_KEY or SUPABASE_URL environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

async function main() {
  /* ---------------------------------------------------------------------- */
  /* 1. Company                                                             */
  /* ---------------------------------------------------------------------- */
  const companyInvite = 'SEED2025'
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .insert({ id: randomUUID(), name: 'Seeded Corp', invite_code: companyInvite })
    .select('*')
    .single()

  if (companyErr) throw companyErr

  /* ---------------------------------------------------------------------- */
  /* 2. Auth user + profile                                                 */
  /* ---------------------------------------------------------------------- */
  const userEmail = `seeduser+${Date.now()}@spilledin.dev`
  const userPassword = 'Password123!'

  // Create auth user via admin API
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: userEmail,
    password: userPassword,
    email_confirm: true
  })
  if (authErr || !authUser.user) throw authErr

  // Generate username using DB function
  const { data: usernameData, error: usernameErr } = await supabase.rpc('generate_anonymous_username')
  if (usernameErr) throw usernameErr

  const profilePayload = {
    id: authUser.user.id,
    company_id: company.id,
    anonymous_username: usernameData,
    toxicity_score: 0
  }
  const { error: profileErr } = await supabase.from('user_profiles').insert(profilePayload)
  if (profileErr) throw profileErr

  /* ---------------------------------------------------------------------- */
  /* 3. Confessions                                                         */
  /* ---------------------------------------------------------------------- */
  const sampleConfessions = [
    'I sometimes push directly to main and blame the CI.',
    'Tabs over spaces. Fight me.',
    'I once spent 3 days debugging only to realise I was on the wrong branch.'
  ]

  const confessionRows = sampleConfessions.map((content) => ({
    user_id: authUser.user.id,
    company_id: company.id,
    content
  }))

  const { error: confessErr } = await supabase.from('confessions').insert(confessionRows)
  if (confessErr) throw confessErr

  /* ---------------------------------------------------------------------- */
  /* 4. Awards                                                              */
  /* ---------------------------------------------------------------------- */
  const { error: awardErr } = await supabase.from('awards').insert({
    user_id: authUser.user.id,
    award_type: 'First Confession',
    award_title: 'First Confession 🥇',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  if (awardErr) throw awardErr

  console.log('\n✅ Seed complete!')
  console.log(`  Email: ${userEmail}`)
  console.log(`  Password: ${userPassword}`)
  console.log(`  Invite Code: ${companyInvite}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 