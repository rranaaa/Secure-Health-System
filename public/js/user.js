function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  window.location.href = '/login';
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const twoFAToken = document.getElementById('twoFAToken').value;

      // Add regex validation for email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFAToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const { user, token } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('role', user.role);
      window.location.href = user.role === 'PATIENT' ? '/patient' : user.role === 'DOCTOR' ? '/doctor' : '/admin';
    } catch (error) {
      console.error('Error logging in:', error.message);
      alert(`Failed to login: ${error.message}`);
    }
  });
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('name')?.value?.trim();
      const email = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value?.trim();

      console.log('Signup form data:', { name, email, password });

      if (!name) throw new Error('Full name is required');
      if (!email) throw new Error('Email is required');
      if (!password) throw new Error('Password is required');

      // Add regex validation for email and password
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 8 characters, include uppercase, lowercase, and a number');
      }

      // Sanitize name
      const sanitizedName = DOMPurify.sanitize(name);
      if (!sanitizedName) throw new Error('Invalid name after sanitization');

      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: sanitizedName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const { user, token } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('role', user.role);
      alert('Signup successful! You are registered as a Patient. An admin can update your role if needed.');
      window.location.href = '/patient';
    } catch (error) {
      console.error('Error signing up:', error.message);
      alert(`Failed to signup: ${error.message}`);
    }
  });
}

const nameForm = document.getElementById('name-form');
if (nameForm) {
  nameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('name').value;

      // Sanitize name
      const sanitizedName = DOMPurify.sanitize(name);
      if (!sanitizedName) throw new Error('Invalid name after sanitization');

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: sanitizedName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const user = await response.json();
      alert('Profile updated successfully');
      nameForm.reset();
    } catch (error) {
      console.error('Error updating profile:', error.message);
      alert(`Failed to update profile: ${error.message}`);
    }
  });
}

const passwordForm = document.getElementById('password-form');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;

      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      alert('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error.message);
      alert(`Failed to change password: ${error.message}`);
    }
  });
}

const verify2FAForm = document.getElementById('verify-2fa-form');
if (verify2FAForm) {
  verify2FAForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const twoFAToken = document.getElementById('twoFAToken').value;
      // Add regex validation for twoFAToken
      if (!/^\d{6}$/.test(twoFAToken)) {
        throw new Error('2FA Token must be 6 digits');
      }

      const response = await fetch('/api/users/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: twoFAToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      alert(result.message);
      window.location.href = '/';
    } catch (error) {
      console.error('Error verifying 2FA:', error.message);
      alert(`Failed to verify 2FA: ${error.message}`);
    }
  });
}

const logoutButton = document.getElementById('logout');
if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}