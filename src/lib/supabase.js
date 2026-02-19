import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bagetbpwlknyxeyjwcsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2V0YnB3bGtueXhleWp3Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTUwMjksImV4cCI6MjA4NzAzMTAyOX0.8hOThurWMmpQ7NCf4YERZ3kPGiTH8RxxqR_TFKvQnEs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const ROLE_HIERARCHY = { owner: 7, admin: 6, manager: 5, finance: 4, bdc: 3, salesperson: 2, viewer: 1 };
export const hasRole = (userRole, requiredRole) => (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
export const isManagerOrAbove = (role) => hasRole(role, 'manager');
export const isAdminOrAbove = (role) => hasRole(role, 'admin');
