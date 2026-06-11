const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://event-management-backend-x0dp.onrender.com';

export const authService = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data; // { user, token }
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data; // { user, token }
  },

  googleRegister: async (credential, role) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, role }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Google registration failed');
    }
    return data; // { user, token }
  },

  googleLogin: async (credential) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Google sign-in failed');
    }
    return data; // { user, token }
  },

  logout: async () => {
    // If you later add a backend logout/blacklist, call it here
    return true;
  },

  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem('eventpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  forgotPassword: async () => {
    throw new Error('Password reset not implemented yet');
  },

  updateProfile: async (profileData) => {
    const token = localStorage.getItem('eventpro_token');
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data; // { user }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const token = localStorage.getItem('eventpro_token');
    const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to change password');
    return data; // { message }
  },

  uploadAvatar: async (file) => {
    const token = localStorage.getItem('eventpro_token');
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to upload avatar');
    return data; // { url, user }
  },
};

export default authService;
