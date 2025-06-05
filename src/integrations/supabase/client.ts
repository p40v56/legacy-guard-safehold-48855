


// Mock Supabase client - completely disconnected from real Supabase
// This file now provides a mock implementation that uses localStorage

interface MockSupabaseResponse<T> {
  data: T | null;
  error: null | { message: string };
}

// Mock data storage using localStorage
const getStorageKey = (table: string, userId?: string) => {
  return userId ? `mock_${table}_${userId}` : `mock_${table}`;
};

const getMockData = <T>(table: string, userId?: string): T[] => {
  const key = getStorageKey(table, userId);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const setMockData = <T>(table: string, data: T[], userId?: string) => {
  const key = getStorageKey(table, userId);
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock query builder
class MockPostgrestFilterBuilder<T> {
  constructor(private table: string, private userId?: string) {}

  eq(column: string, value: any): MockPostgrestFilterBuilder<T> {
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): MockPostgrestFilterBuilder<T> {
    return this;
  }

  single(): Promise<MockSupabaseResponse<T>> {
    const data = getMockData<T>(this.table, this.userId);
    return Promise.resolve({
      data: data[0] || null,
      error: null
    });
  }

  then(onResolve: (value: MockSupabaseResponse<T[]>) => any) {
    const data = getMockData<T>(this.table, this.userId);
    return onResolve({
      data,
      error: null
    });
  }
}

// Mock table interface
class MockTable<T> {
  constructor(private tableName: string) {}

  select(columns: string = '*'): MockPostgrestFilterBuilder<T> {
    return new MockPostgrestFilterBuilder<T>(this.tableName);
  }

  insert(values: Partial<T> | Partial<T>[]): Promise<MockSupabaseResponse<T[]>> {
    const data = Array.isArray(values) ? values : [values];
    const existing = getMockData<T>(this.tableName);
    const newData = data.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as T[];
    setMockData(this.tableName, [...existing, ...newData]);
    
    return Promise.resolve({ data: newData, error: null });
  }

  update(values: Partial<T>) {
    return {
      eq: (column: string, value: any): Promise<MockSupabaseResponse<null>> => {
        const existing = getMockData<T>(this.tableName);
        const updated = existing.map((item: any) => 
          item[column] === value ? { ...item, ...values, updated_at: new Date().toISOString() } : item
        );
        setMockData(this.tableName, updated);
        return Promise.resolve({ data: null, error: null });
      }
    };
  }

  delete() {
    return {
      eq: (column: string, value: any): Promise<MockSupabaseResponse<null>> => {
        const existing = getMockData<T>(this.tableName);
        const filtered = existing.filter((item: any) => item[column] !== value);
        setMockData(this.tableName, filtered);
        return Promise.resolve({ data: null, error: null });
      }
    };
  }
}

// Mock Supabase client
export const supabase = {
  from: <T>(table: string) => new MockTable<T>(table),
  
  // Mock auth (not used since we have our own auth system)
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  }
};

// Export for compatibility (though not used)
export type Database = any;


