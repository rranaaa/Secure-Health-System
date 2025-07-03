const apiBaseUrl = 'http://localhost:3000/api';

const showError = (message) => {
  const errorElement = document.getElementById('error');
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
};

const clearError = () => {
  const errorElement = document.getElementById('error');
  errorElement.textContent = '';
  errorElement.classList.add('hidden');
};

document.getElementById('editNameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const name = document.getElementById('name').value;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${apiBaseUrl}/profile/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update name');
    alert('Name updated successfully!');
    document.getElementById('editNameForm').reset();
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${apiBaseUrl}/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to change password');
    alert('Password changed successfully!');
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    showError(error.message);
  }
});