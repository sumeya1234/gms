import { registerUser, loginUser } from '../../services/authService.js';

/**
 * Creates a unique test user with the specified role directly via the auth service
 * (Bypassing the controller limits to allow creating superadmins/mechanics for testing).
 * Returns the generated JWT token and user credentials.
 */
export async function createTestUserWithToken(role = 'Customer') {
    const uniqueHash = Math.random().toString(36).substring(7);
    const email = `test-${role}-${uniqueHash}@example.com`;
    const password = "Password123!";
    
    const userResult = await registerUser({
        fullName: `Test ${role}`,
        email,
        phone: `+1234567${uniqueHash.slice(0, 4)}`,
        password,
        role
    });

    const loginResult = await loginUser(email, password);
    
    return { 
        token: loginResult.token, 
        userId: userResult.userId,
        email, 
        password 
    };
}
