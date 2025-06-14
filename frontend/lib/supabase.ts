// Mock Supabase client for demo purposes
export const supabase = {
  auth: {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      // Simulate signup delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const userId = `user_${Date.now()}`
      return {
        data: {
          user: {
            id: userId,
            email: email
          }
        },
        error: null
      }
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Simulate signin delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if it's a demo account
      if (email === "demo@spilledin.com" && password === "demo123") {
        return {
          data: {
            user: {
              id: "demo_user_123",
              email: email
            }
          },
          error: null
        }
      }

      // For other emails, create a new user
      const userId = `user_${Date.now()}`
      return {
        data: {
          user: {
            id: userId,
            email: email
          }
        },
        error: null
      }
    },

    signOut: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { error: null }
    },

    getUser: async () => {
      // Check if user is logged in (simulate session)
      const currentUser = localStorage.getItem('spilledin_user')
      if (currentUser) {
        return {
          data: {
            user: JSON.parse(currentUser)
          }
        }
      }
      return { data: { user: null } }
    }
  },

  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === "companies" && column === "invite_code") {
            const companies = [
              { id: "comp_1", name: "TechCorp Inc", invite_code: "TECH2024" },
              { id: "comp_2", name: "StartupXYZ", invite_code: "STARTUP123" },
              { id: "comp_3", name: "MegaCorp Ltd", invite_code: "MEGA456" }
            ]
            const company = companies.find(c => c.invite_code === value)
            return { data: company, error: company ? null : new Error("Invalid invite code") }
          }

          if (table === "user_profiles" && column === "id") {
            return {
              data: {
                id: value,
                company_id: "comp_1",
                anonymous_username: "SneakyPanda42",
                toxicity_score: 150,
                total_upvotes: 45,
                total_downvotes: 12,
                created_at: new Date().toISOString(),
                companies: {
                  name: "TechCorp Inc",
                  invite_code: "TECH2024"
                }
              },
              error: null
            }
          }

          return { data: null, error: null }
        }),

        order: (column: string, options?: any) => ({
          limit: (count: number) => ({
            then: async (callback: any) => {
              if (table === "user_profiles") {
                const dummyUsers = [
                  { anonymous_username: "DramaDeity99", toxicity_score: 1250, total_upvotes: 89, total_downvotes: 23 },
                  { anonymous_username: "ChaosChamp88", toxicity_score: 890, total_upvotes: 67, total_downvotes: 18 },
                  { anonymous_username: "TroubleMaker77", toxicity_score: 456, total_upvotes: 45, total_downvotes: 12 },
                  { anonymous_username: "SneakyPanda42", toxicity_score: 234, total_upvotes: 34, total_downvotes: 8 },
                  { anonymous_username: "MysteriousFox21", toxicity_score: 123, total_upvotes: 28, total_downvotes: 15 }
                ]
                return callback({ data: dummyUsers.slice(0, count), error: null })
              }
              return callback({ data: [], error: null })
            }
          })
        })
      }),

      gte: (column: string, value: any) => ({
        lte: (column2: string, value2: any) => ({
          order: (orderColumn: string, options?: any) => ({
            limit: (count: number) => ({
              then: async (callback: any) => {
                if (table === "confessions") {
                  const dummyConfessions = [
                    {
                      id: "conf_1",
                      content: "I accidentally sent a meme to the CEO instead of my friend. Now everyone thinks I'm the office comedian 😅",
                      upvotes: 45,
                      downvotes: 3,
                      net_score: 42,
                      user_profiles: {
                        anonymous_username: "SneakyPanda42",
                        toxicity_score: 234
                      }
                    },
                    {
                      id: "conf_2",
                      content: "I've been pretending to understand blockchain for 2 years. I still have no idea what it actually does.",
                      upvotes: 38,
                      downvotes: 7,
                      net_score: 31,
                      user_profiles: {
                        anonymous_username: "MysteriousFox21",
                        toxicity_score: 123
                      }
                    }
                  ]
                  return callback({ data: dummyConfessions.slice(0, count), error: null })
                }
                return callback({ data: [], error: null })
              }
            })
          })
        })
      }),

      order: (column: string, options?: any) => ({
        then: async (callback: any) => {
          if (table === "confessions") {
            const dummyConfessions = [
              {
                id: "conf_1",
                content: "I accidentally sent a meme to the CEO instead of my friend. Now everyone thinks I'm the office comedian 😅",
                image_url: null,
                upvotes: 45,
                downvotes: 3,
                net_score: 42,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                user_id: "user_123",
                user_profiles: {
                  anonymous_username: "SneakyPanda42",
                  toxicity_score: 234
                },
                user_vote: null,
                is_own: false
              },
              {
                id: "conf_2",
                content: "I've been pretending to understand blockchain for 2 years. I still have no idea what it actually does.",
                image_url: null,
                upvotes: 38,
                downvotes: 7,
                net_score: 31,
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                user_id: "user_456",
                user_profiles: {
                  anonymous_username: "MysteriousFox21",
                  toxicity_score: 123
                },
                user_vote: null,
                is_own: false
              },
              {
                id: "conf_3",
                content: "My manager asked me to 'think outside the box' so I literally moved my desk outside. HR was not amused.",
                image_url: null,
                upvotes: 67,
                downvotes: 12,
                net_score: 55,
                created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                user_id: "user_789",
                user_profiles: {
                  anonymous_username: "BoldEagle88",
                  toxicity_score: 445
                },
                user_vote: null,
                is_own: false
              },
              {
                id: "conf_4",
                content: "I told everyone I was working from home but I was actually at the beach. The tan lines gave me away during the video call.",
                image_url: null,
                upvotes: 89,
                downvotes: 15,
                net_score: 74,
                created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                user_id: "user_101",
                user_profiles: {
                  anonymous_username: "CleverWolf99",
                  toxicity_score: 678
                },
                user_vote: null,
                is_own: false
              },
              {
                id: "conf_5",
                content: "I've been using the same password for everything since 2015. It's 'password123' and I'm too scared to change it now.",
                image_url: null,
                upvotes: 23,
                downvotes: 45,
                net_score: -22,
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                user_id: "user_202",
                user_profiles: {
                  anonymous_username: "SilentOwl77",
                  toxicity_score: -45
                },
                user_vote: null,
                is_own: false
              }
            ]
            return callback({ data: dummyConfessions, error: null })
          }

          if (table === "user_profiles") {
            const dummyUsers = [
              { anonymous_username: "DramaDeity99", toxicity_score: 1250, total_upvotes: 89, total_downvotes: 23 },
              { anonymous_username: "ChaosChamp88", toxicity_score: 890, total_upvotes: 67, total_downvotes: 18 },
              { anonymous_username: "TroubleMaker77", toxicity_score: 456, total_upvotes: 45, total_downvotes: 12 },
              { anonymous_username: "SneakyPanda42", toxicity_score: 234, total_upvotes: 34, total_downvotes: 8 },
              { anonymous_username: "MysteriousFox21", toxicity_score: 123, total_upvotes: 28, total_downvotes: 15 },
              { anonymous_username: "BoldEagle88", toxicity_score: 89, total_upvotes: 22, total_downvotes: 11 },
              { anonymous_username: "CleverWolf99", toxicity_score: 67, total_upvotes: 19, total_downvotes: 9 },
              { anonymous_username: "SilentOwl77", toxicity_score: -45, total_upvotes: 12, total_downvotes: 34 }
            ]
            return callback({ data: dummyUsers, error: null })
          }

          if (table === "awards") {
            return callback({ data: [], error: null })
          }

          return callback({ data: [], error: null })
        }
      }),

      or: (condition: string) => ({
        order: (column: string, options?: any) => ({
          then: async (callback: any) => {
            // Simple search simulation
            const dummyConfessions = [
              {
                id: "conf_1",
                content: "I accidentally sent a meme to the CEO instead of my friend. Now everyone thinks I'm the office comedian 😅",
                image_url: null,
                upvotes: 45,
                downvotes: 3,
                net_score: 42,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                user_id: "user_123",
                user_profiles: {
                  anonymous_username: "SneakyPanda42",
                  toxicity_score: 234
                },
                user_vote: null,
                is_own: false
              }
            ]
            return callback({ data: dummyConfessions, error: null })
          }
        })
      })
    }),

    insert: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 500))

      if (table === "user_profiles") {
        return { data: null, error: null }
      }

      if (table === "confessions") {
        return { data: null, error: null }
      }

      return { data: null, error: null }
    },

    upsert: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { data: null, error: null }
    },

    delete: () => ({
      eq: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          then: async (callback: any) => {
            await new Promise(resolve => setTimeout(resolve, 300))
            return callback({ data: null, error: null })
          }
        }),
        then: async (callback: any) => {
          await new Promise(resolve => setTimeout(resolve, 300))
          return callback({ data: null, error: null })
        }
      })
    })
  }),

  rpc: async (functionName: string) => {
    if (functionName === "generate_anonymous_username") {
      const adjectives = ['Sneaky', 'Mysterious', 'Curious', 'Brave', 'Witty', 'Clever', 'Bold', 'Swift', 'Silent', 'Fierce']
      const nouns = ['Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk', 'Owl', 'Shark']
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
      const randomNumber = Math.floor(Math.random() * 100)

      return {
        data: `${randomAdjective}${randomNoun}${randomNumber}`,
        error: null
      }
    }

    return { data: null, error: null }
  },

  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          data: { path: path },
          error: null
        }
      },

      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `/placeholder.svg?height=300&width=400&text=Uploaded+Image`
        }
      })
    })
  }
}

// Keep the same Database type for TypeScript
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          company_id: string
          anonymous_username: string
          toxicity_score: number
          total_upvotes: number
          total_downvotes: number
          created_at: string
        }
        Insert: {
          id: string
          company_id: string
          anonymous_username: string
          toxicity_score?: number
          total_upvotes?: number
          total_downvotes?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          anonymous_username?: string
          toxicity_score?: number
          total_upvotes?: number
          total_downvotes?: number
          created_at?: string
        }
      }
      confessions: {
        Row: {
          id: string
          user_id: string
          company_id: string
          content: string
          image_url: string | null
          upvotes: number
          downvotes: number
          net_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          content: string
          image_url?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          content?: string
          image_url?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          confession_id: string
          vote_type: "upvote" | "downvote"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          confession_id: string
          vote_type: "upvote" | "downvote"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          confession_id?: string
          vote_type?: "upvote" | "downvote"
          created_at?: string
        }
      }
      awards: {
        Row: {
          id: string
          user_id: string
          award_type: string
          award_title: string
          month: number
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          award_type: string
          award_title: string
          month: number
          year: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          award_type?: string
          award_title?: string
          month?: number
          year?: number
          created_at?: string
        }
      }
    }
  }
}
