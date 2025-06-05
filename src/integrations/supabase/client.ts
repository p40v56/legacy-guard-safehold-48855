
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://placeholder.supabase.co'
const supabaseKey = 'placeholder-key'

// Create a mock client for development
const createMockClient = () => {
  return {
    auth: {
      signUp: async (credentials: any) => {
        console.log('Mock signUp:', credentials)
        return { 
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: credentials.email,
              user_metadata: credentials.options?.data || {}
            }, 
            session: null 
          }, 
          error: null 
        }
      },
      signInWithPassword: async (credentials: any) => {
        console.log('Mock signInWithPassword:', credentials)
        return { 
          data: { 
            user: { 
              id: 'mock-user-id', 
              email: credentials.email,
              user_metadata: { first_name: 'John', last_name: 'Doe' }
            }, 
            session: { access_token: 'mock-token' } 
          }, 
          error: null 
        }
      },
      signOut: async () => {
        console.log('Mock signOut')
        return { error: null }
      },
      getUser: async () => ({
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: 'user@example.com',
            user_metadata: { first_name: 'John', last_name: 'Doe' }
          } 
        },
        error: null
      }),
      onAuthStateChange: (callback: any) => {
        console.log('Mock onAuthStateChange')
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ 
            data: { id: 'mock-id', [column]: value }, 
            error: null 
          }),
          then: (callback: any) => callback({ 
            data: [] as any[], 
            error: null 
          })
        }),
        then: (callback: any) => callback({ 
          data: [] as any[], 
          error: null 
        })
      }),
      insert: (data: any) => ({
        select: () => Promise.resolve({ data: [data], error: null }),
        then: (callback: any) => callback({ data: [data], error: null })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: [data], error: null })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null })
      })
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          console.log('Mock storage upload:', path, file.name)
          return { data: { path }, error: null }
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://mock-storage.com/${path}` }
        })
      })
    }
  }
}

export const supabase = createMockClient() as any

