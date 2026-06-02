import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Set to true to run the project locally without needing a real Supabase database.
// Set to false when you want to connect to the real Supabase database with the credentials below.
const USE_MOCK_DATABASE = true;

const SUPABASE_URL = "https://uftjmqpevuxgimpmqmen.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x0cRA-3ovP1sY8kzKMDKyw_7M4s-lRw";

// -------------------------------------------------------------
// LOCAL MOCK DATABASE IMPLEMENTATION
// -------------------------------------------------------------

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Local storage helpers
const getUsers = () => JSON.parse(localStorage.getItem('docuflow_users') || '[]');
const saveUsers = (users: any[]) => localStorage.setItem('docuflow_users', JSON.stringify(users));
const getCurrentUser = () => JSON.parse(localStorage.getItem('docuflow_current_user') || 'null');
const getDocs = () => JSON.parse(localStorage.getItem('docuflow_documents') || '[]');
const saveDocs = (docs: any[]) => localStorage.setItem('docuflow_documents', JSON.stringify(docs));
const getCollaborators = () => JSON.parse(localStorage.getItem('docuflow_collaborators') || '[]');
const saveCollaborators = (collabs: any[]) => localStorage.setItem('docuflow_collaborators', JSON.stringify(collabs));

// Broadcast channels for real-time synchronization between tabs
const dbBroadcastChannel = new BroadcastChannel('docuflow_db_channel');
const authBroadcastChannel = new BroadcastChannel('docuflow_auth_channel');

const authListeners: Array<(event: string, session: any) => void> = [];
const activeChannels: MockChannel[] = [];

// Handle cross-tab database updates
dbBroadcastChannel.onmessage = (event) => {
  const { event: dbEvent, table, type, new: newRecord, old: oldRecord } = event.data;

  activeChannels.forEach(channel => {
    channel.listeners.forEach(listener => {
      if (listener.filter.table === table && (listener.filter.event === '*' || listener.filter.event === type)) {
        if (listener.filter.filter) {
          const [field, rest] = listener.filter.filter.split('=');
          const [op, value] = rest.split('.');
          if (op === 'eq') {
            const recordToCheck = type === 'DELETE' ? oldRecord : newRecord;
            if (recordToCheck && recordToCheck[field] !== value) {
              return;
            }
          }
        }

        listener.callback({
          schema: 'public',
          table: table,
          commit_timestamp: new Date().toISOString(),
          eventType: type,
          new: newRecord || {},
          old: oldRecord || {},
          errors: null
        });
      }
    });
  });
};

// Handle cross-tab auth state changes
authBroadcastChannel.onmessage = (event) => {
  const { event: authEvent, session } = event.data;
  if (authEvent === 'SIGNED_IN') {
    localStorage.setItem('docuflow_current_user', JSON.stringify(session.user));
    authListeners.forEach(listener => listener('SIGNED_IN', session));
  } else if (authEvent === 'SIGNED_OUT') {
    localStorage.removeItem('docuflow_current_user');
    authListeners.forEach(listener => listener('SIGNED_OUT', null));
  }
};

class MockChannel {
  name: string;
  listeners: Array<{ event: string; filter: any; callback: (payload: any) => void }> = [];

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, filter: any, callback: (payload: any) => void) {
    this.listeners.push({ event, filter, callback });
    return this;
  }

  subscribe(statusCallback?: (status: string) => void) {
    activeChannels.push(this);
    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 50);
    }
    return this;
  }
}

class MockQueryBuilder {
  tableName: string;
  filters: Array<{ field: string; op: string; value: any }> = [];
  sortField: string | null = null;
  sortAscending: boolean = true;
  insertedData: any = null;
  updatedData: any = null;
  isDelete: boolean = false;
  isSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string) {
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortField = field;
    this.sortAscending = options?.ascending !== false;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  limit(n: number) {
    return this;
  }

  insert(data: any) {
    this.insertedData = data;
    return this;
  }

  update(data: any) {
    this.updatedData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      resolve({ data: null, error: err });
    }
  }

  async execute() {
    if (this.tableName === 'documents') {
      let docs = getDocs();

      if (this.insertedData) {
        const dataToInsert = Array.isArray(this.insertedData) ? this.insertedData : [this.insertedData];
        const inserted = dataToInsert.map(item => ({
          id: item.id || generateUUID(),
          title: item.title || 'Untitled Document',
          content: item.content || { html: '<p>Start writing here...</p>' },
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          created_by: item.created_by || getCurrentUser()?.id || 'mock-user-id',
          is_public: item.is_public ?? false
        }));

        docs.push(...inserted);
        saveDocs(docs);

        inserted.forEach(doc => {
          dbBroadcastChannel.postMessage({
            event: 'postgres_changes',
            table: 'documents',
            type: 'INSERT',
            new: doc
          });
        });

        return { data: this.isSingle ? inserted[0] : inserted, error: null };
      }

      if (this.updatedData) {
        const updated: any[] = [];
        docs = docs.map(doc => {
          const matches = this.filters.every(f => doc[f.field as keyof typeof doc] === f.value);
          if (matches) {
            const updatedDoc = {
              ...doc,
              ...this.updatedData,
              updated_at: new Date().toISOString()
            };
            updated.push(updatedDoc);
            
            dbBroadcastChannel.postMessage({
              event: 'postgres_changes',
              table: 'documents',
              type: 'UPDATE',
              new: updatedDoc,
              old: doc
            });

            return updatedDoc;
          }
          return doc;
        });
        saveDocs(docs);
        return { data: this.isSingle ? updated[0] : updated, error: null };
      }

      if (this.isDelete) {
        const remaining = docs.filter(doc => {
          const matches = this.filters.every(f => doc[f.field as keyof typeof doc] === f.value);
          if (matches) {
            dbBroadcastChannel.postMessage({
              event: 'postgres_changes',
              table: 'documents',
              type: 'DELETE',
              old: doc
            });
            return false;
          }
          return true;
        });
        saveDocs(remaining);
        return { data: null, error: null };
      }

      let data = [...docs];
      this.filters.forEach(f => {
        data = data.filter(doc => doc[f.field as keyof typeof doc] === f.value);
      });
      if (this.sortField) {
        data.sort((a, b) => {
          const valA = a[this.sortField as keyof typeof a];
          const valB = b[this.sortField as keyof typeof b];
          if (typeof valA === 'string' && typeof valB === 'string') {
            return this.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return this.sortAscending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
      }

      return { data: this.isSingle ? (data[0] || null) : data, error: null };
    }

    if (this.tableName === 'document_collaborators') {
      let collabs = getCollaborators();

      if (this.insertedData) {
        const dataToInsert = Array.isArray(this.insertedData) ? this.insertedData : [this.insertedData];
        const inserted = dataToInsert.map(item => ({
          id: item.id || generateUUID(),
          document_id: item.document_id,
          user_id: item.user_id,
          permission: item.permission || 'view',
          created_at: item.created_at || new Date().toISOString()
        }));

        collabs.push(...inserted);
        saveCollaborators(collabs);

        inserted.forEach(c => {
          dbBroadcastChannel.postMessage({
            event: 'postgres_changes',
            table: 'document_collaborators',
            type: 'INSERT',
            new: c
          });
        });

        return { data: this.isSingle ? inserted[0] : inserted, error: null };
      }

      if (this.updatedData) {
        const updated: any[] = [];
        collabs = collabs.map(collab => {
          const matches = this.filters.every(f => collab[f.field as keyof typeof collab] === f.value);
          if (matches) {
            const updatedCollab = {
              ...collab,
              ...this.updatedData
            };
            updated.push(updatedCollab);

            dbBroadcastChannel.postMessage({
              event: 'postgres_changes',
              table: 'document_collaborators',
              type: 'UPDATE',
              new: updatedCollab,
              old: collab
            });

            return updatedCollab;
          }
          return collab;
        });
        saveCollaborators(collabs);
        return { data: this.isSingle ? updated[0] : updated, error: null };
      }

      if (this.isDelete) {
        const remaining = collabs.filter(collab => {
          const matches = this.filters.every(f => collab[f.field as keyof typeof collab] === f.value);
          if (matches) {
            dbBroadcastChannel.postMessage({
              event: 'postgres_changes',
              table: 'document_collaborators',
              type: 'DELETE',
              old: collab
            });
            return false;
          }
          return true;
        });
        saveCollaborators(remaining);
        return { data: null, error: null };
      }

      let data = [...collabs];
      this.filters.forEach(f => {
        data = data.filter(c => c[f.field as keyof typeof c] === f.value);
      });
      return { data: this.isSingle ? (data[0] || null) : data, error: null };
    }

    return { data: [], error: null };
  }
}

const mockSupabase = {
  auth: {
    async getSession() {
      const user = getCurrentUser();
      if (!user) return { data: { session: null }, error: null };
      return { data: { session: { user } }, error: null };
    },
    
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.push(callback);
      const user = getCurrentUser();
      if (user) {
        callback('INITIAL_SESSION', { user });
      } else {
        callback('INITIAL_SESSION', null);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(callback);
              if (index !== -1) {
                authListeners.splice(index, 1);
              }
            }
          }
        }
      };
    },

    async signInWithPassword({ email, password }: any) {
      const users = getUsers();
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return { data: { user: null, session: null }, error: new Error('Invalid email or password. Feel free to use the Sign Up tab to create an account first!') };
      }
      
      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.fullName
          }
        }
      };
      
      localStorage.setItem('docuflow_current_user', JSON.stringify(session.user));
      authListeners.forEach(listener => listener('SIGNED_IN', session));
      authBroadcastChannel.postMessage({ event: 'SIGNED_IN', session });
      
      return { data: { user: session.user, session }, error: null };
    },

    async signUp({ email, password, options }: any) {
      const users = getUsers();
      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null, session: null }, error: new Error('User already exists') };
      }

      const fullName = options?.data?.full_name || email.split('@')[0];
      const newUser = {
        id: generateUUID(),
        email,
        password,
        fullName
      };

      users.push(newUser);
      saveUsers(users);

      const session = {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: {
            full_name: newUser.fullName
          }
        }
      };

      localStorage.setItem('docuflow_current_user', JSON.stringify(session.user));
      authListeners.forEach(listener => listener('SIGNED_IN', session));
      authBroadcastChannel.postMessage({ event: 'SIGNED_IN', session });

      return { data: { user: session.user, session }, error: null };
    },

    async signOut() {
      localStorage.removeItem('docuflow_current_user');
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
      authBroadcastChannel.postMessage({ event: 'SIGNED_OUT', session: null });
      return { error: null };
    }
  },

  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },

  channel(name: string) {
    return new MockChannel(name);
  },

  removeChannel(channel: MockChannel) {
    const index = activeChannels.indexOf(channel);
    if (index !== -1) {
      activeChannels.splice(index, 1);
    }
  }
};

// -------------------------------------------------------------
// CLIENT EXPORT
// -------------------------------------------------------------

export const supabase = (USE_MOCK_DATABASE 
  ? mockSupabase 
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
) as any;