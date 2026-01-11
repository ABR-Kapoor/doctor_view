// AuraSutra - Authentication Helpers
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getUserByAuthId, createUser } from './db-queries';
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
        const { data: existingUser } = await getUserByAuthId(kindeUser.id);

        if (existingUser) {
            return existingUser;
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

        const { data: createdUser } = await createUser(newUser);
        return createdUser;
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

    const { data: user } = await getUserByAuthId(kindeUser.id);

    if (!user) {
        return { error: 'User not found in database', user: null };
    }

    if (requiredRoles && !hasRole(user, requiredRoles)) {
        return { error: 'Forbidden: Insufficient permissions', user: null };
    }

    return { error: null, user };
}
