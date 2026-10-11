// Stores a successful sign-in the same way for every way of signing in (password form, Microsoft callback).

export function saveSession(responseData) {
    const { user, accessToken, refreshToken } = responseData;

    if (accessToken)  localStorage.setItem('adminToken',        accessToken);
    if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);

    localStorage.setItem('adminUser', JSON.stringify({
        id:                   user.op_user_id || user.id,
        op_user_id:           user.op_user_id,
        first_name:           user.first_name,
        last_name:            user.last_name,
        name:                 user.name || `${user.first_name} ${user.last_name}`.trim(),
        email:                user.email,
        user_role:            user.user_role,
        department_id:        user.department_id    || null,
        is_super_admin:       user.is_super_admin   ?? false,
        must_change_password: user.must_change_password ?? false,
        has_global_access:    user.has_global_access ?? false,
    }));
    return user;
}

// Where each role lands after signing in.
export const homeRouteFor = (user) =>
    user.user_role === 'Manager' ? '/manager/dashboard'
        : user.user_role === 'Finance' ? '/finance/dashboard'
            : '/dashboard';
