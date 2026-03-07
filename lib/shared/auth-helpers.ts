// AuraSutra - Authentication Helpers
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import sql from '@/lib/db';
import type { User, UserRole } from './types';

// Get current authenticated user from Kinde
export async function getAuthUser() {
    try {
        const { getUser, isAuthenticated } = getKindeServerSession();

        if (!(await isAuthenticated())) {
            return null;
        }

        const kindeUser = await getUser();

        if (!kindeUser || !kindeUser.id) {
            return null;
        }

        return kindeUser;
    } catch (error) {
        console.error('Error getting auth user:', error);
        return null;
    }
}

// Get or create user in Supabase from Kinde session
export async function syncUser(role: UserRole = 'patient'): Promise<User | null> {
    try {
        const kindeUser = await getAuthUser();

        if (!kindeUser) {
            return null;
        }

        // Try to get existing user
        const [existingUser] = await sql`
            SELECT * FROM users WHERE auth_id = ${kindeUser.id}
        `;

        if (existingUser) {
            return existingUser as unknown as User;
        }

        // Create new user if doesn't exist
        const newUser: Partial<User> = {
            auth_id: kindeUser.id,
            email: kindeUser.email || '',
            name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || 'User',
            role: role,
            profile_image_url: kindeUser.picture || undefined,
            is_verified: false,
            is_active: true,
        };

        const [createdUser] = await sql`
            INSERT INTO users (auth_id, email, name, role, profile_image_url, is_verified, is_active)
            VALUES (
                ${newUser.auth_id || null}, 
                ${newUser.email || null}, 
                ${newUser.name || null}, 
                ${newUser.role || null}, 
                ${newUser.profile_image_url || null}, 
                ${newUser.is_verified || false}, 
                ${newUser.is_active || true}
            )
            RETURNING *
        `;
        return createdUser as unknown as User;
    } catch (error) {
        console.error('Error syncing user:', error);
        return null;
    }
}

// Check if user has specific role
export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
    if (!user) return false;
    return allowedRoles.includes(user.role);
}

// Middleware helper for protected routes
export async function requireAuth(requiredRoles?: UserRole[]) {
    const kindeUser = await getAuthUser();

    if (!kindeUser) {
        return { error: 'Unauthorized', user: null };
    }

    const [user] = await sql`
        SELECT * FROM users WHERE auth_id = ${kindeUser.id}
    `;

    if (!user) {
        return { error: 'User not found in database', user: null };
    }

    if (requiredRoles && !hasRole(user as User, requiredRoles)) {
        return { error: 'Forbidden: Insufficient permissions', user: null };
    }

    return { error: null, user: user as User };
}
