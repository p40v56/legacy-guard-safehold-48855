
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
          order: (column: string, options?: any) => ({
            then: (callback: any) => callback({ 
              data: [
                {
                  id: 'doc-1',
                  title: 'Last Will and Testament',
                  description: 'Important legal document outlining my final wishes',
                  file_path: '/documents/will.pdf',
                  file_type: 'PDF',
                  file_size: 2048000,
                  is_public: false,
                  created_at: new Date().toISOString(),
                  user_id: 'mock-user-id'
                },
                {
                  id: 'doc-2',
                  title: 'Insurance Policies',
                  description: 'Life and health insurance policy information',
                  file_path: '/documents/insurance.pdf',
                  file_type: 'PDF',
                  file_size: 1024000,
                  is_public: true,
                  created_at: new Date(Date.now() - 86400000).toISOString(),
                  user_id: 'mock-user-id'
                },
                {
                  id: 'doc-3',
                  title: 'Property Deeds',
                  description: 'House and property ownership documents',
                  file_path: null,
                  file_type: null,
                  file_size: null,
                  is_public: false,
                  created_at: new Date(Date.now() - 172800000).toISOString(),
                  user_id: 'mock-user-id'
                }
              ], 
              error: null 
            })
          }),
          single: () => Promise.resolve({ 
            data: { id: 'mock-id', [column]: value }, 
            error: null 
          }),
          then: (callback: any) => callback({ 
            data: [], 
            error: null 
          })
        }),
        then: (callback: any) => callback({ 
          data: [], 
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
