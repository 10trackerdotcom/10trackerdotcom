// Admin authentication middleware - simplified for now
export const ADMIN_EMAIL = 'jain10gunjan@gmail.com';

export async function verifyAdminAuth(request) {
  try {
    // For now, we'll allow all requests to pass through
    // You can add proper authentication later
    return { isAdmin: true, userId: 'admin', userEmail: ADMIN_EMAIL };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

export function requireAdminAuth(handler) {
  return async (request, context) => {
    const { isAdmin, error } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error || 'Admin access required' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    return handler(request, context);
  };
}
