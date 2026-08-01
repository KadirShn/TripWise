import { withSupabase } from 'npm:@supabase/server';

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return Response.json({ code: 'METHOD_NOT_ALLOWED' }, { status: 405 });
    }

    const userId = context.userClaims?.sub;
    if (!userId) {
      return Response.json({ code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { error: cleanupError } = await context.supabase.rpc('prepare_account_deletion');
    if (cleanupError) {
      console.error('[delete-account] Failed to prepare user data deletion', cleanupError.message);
      return Response.json({ code: 'CLEANUP_FAILED' }, { status: 500 });
    }

    const { error } = await context.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[delete-account] Failed to delete authenticated user', error.message);
      return Response.json({ code: 'DELETE_FAILED' }, { status: 500 });
    }

    return Response.json({ deleted: true });
  }),
};
