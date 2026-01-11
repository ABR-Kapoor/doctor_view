// AuraSutra - Supabase Client Configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Real-time subscription helper
export function subscribeToTable<T>(
    table: string,
    callback: (payload: any) => void,
    filter?: { column: string; value: any }
) {
    let channel = supabase.channel(`${table}-changes`);

    if (filter) {
        channel = channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: `${filter.column}=eq.${filter.value}`,
                },
                callback
            );
    } else {
        channel = channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                },
                callback
            );
    }

    channel.subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Error handler
export function handleSupabaseError(error: any): string {
    console.error('Supabase error:', error);

    if (error.message) {
        return error.message;
    }

    if (error.error_description) {
        return error.error_description;
    }

    return 'An unexpected error occurred. Please try again.';
}

// Type-safe query builder helpers
export async function executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const { data, error } = await queryFn();

        if (error) {
            return { data: null, error: handleSupabaseError(error) };
        }

        return { data, error: null };
    } catch (err) {
        return { data: null, error: handleSupabaseError(err) };
    }
}
