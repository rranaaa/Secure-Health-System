const apiBaseUrl = 'http://localhost:3000/api';

const showError = (formId, message) => {
  const errorElement = document.querySelector(`#${formId} + #error`);
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
};

const clearError = (formId) => {
  const errorElement = document.querySelector(`#${formId} + #error`);
  errorElement.textContent = '';
  errorElement.classList.add('hidden');
};

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('loginForm');

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const twoFAToken = document.getElementById('twoFAToken')?.value;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, twoFAToken }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    alert('Login successful! Token stored.');
    const role = data.user.role;
    window.location.href = role === 'ADMIN' ? '/admin.html' : role === 'DOCTOR' ? '/doctor.html' : '/patient.html';
  } catch (error) {
    showError('loginForm', error.message);

    const checkResponse = await fetch(`${apiBaseUrl}/auth/check-2fa?email=${encodeURIComponent(email)}`);
    const checkData = await checkResponse.json();
    if (checkData.is2FAEnabled) {
      document.getElementById('twoFAField').classList.remove('hidden');
    }
  }
});

document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('signupForm');

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    alert('Signup successful! Please log in.');
    window.location.href = '/login.html';
  } catch (error) {
    showError('signupForm', error.message);
  }
});

document.getElementById('logoutButton')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  alert('Logged out successfully.');
  window.location.href = '/signup.html';
});
