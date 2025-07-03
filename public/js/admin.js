async function fetchUsers() {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const users = await response.json();
    console.log('Fetched users:', users); // Debugging
    const userList = document.getElementById('user-list');
    if (userList) {
      userList.innerHTML = users.length ? users.map(u => {
        // Defensive checks
        const id = u.id || 'Unknown';
        const email = u.email || 'Unknown';
        const name = u.name || 'Unknown';
        const role = u.role || 'Unknown';
        const isActive = u.isActive === true || u.isActive === 'true';

        return `
          <li class="user-item">
            <div><strong>ID:</strong> ${id}</div>
            <div><strong>Email:</strong> ${email}</div>
            <div><strong>Name:</strong> ${name}</div>
            <div><strong>Role:</strong> ${role}</div>
            <div><strong>Active:</strong> ${isActive ? 'Yes' : 'No'}</div>
            ${id !== 1 ? `
              <div class="mt-3 flex flex-wrap gap-2">
                ${!isActive ? `<button class="action-button activate-button activate-btn" data-userid="${id}"><i class="fas fa-check"></i> Activate</button>` : ''}
                ${isActive ? `<button class="action-button deactivate-button deactivate-btn" data-userid="${id}"><i class="fas fa-ban"></i> Deactivate</button>` : ''}
                <button class="action-button admin-role-button set-role-btn" data-userid="${id}" data-role="ADMIN"><i class="fas fa-user-shield"></i> Set Admin</button>
                <button class="action-button doctor-role-button set-role-btn" data-userid="${id}" data-role="DOCTOR"><i class="fas fa-user-md"></i> Set Doctor</button>
                <button class="action-button patient-role-button set-role-btn" data-userid="${id}" data-role="PATIENT"><i class="fas fa-user"></i> Set Patient</button>
              </div>
            ` : ''}
          </li>
        `;
      }).join('') : '<li class="user-item">No users found</li>';
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    showNotification('Failed to load users');
    document.getElementById('error').textContent = 'Failed to load users: ' + error.message;
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

async function fetchLogs() {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const response = await fetch('/api/admin/logs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const logs = await response.json();
    console.log('Fetched logs:', logs); // Debugging
    const logList = document.getElementById('log-list');
    if (logList) {
      logList.innerHTML = logs.length ? logs.map(l => `
        <li class="log-item">
          <div><strong>User:</strong> ${l.user?.email || 'Unknown'}</div>
          <div><strong>Action:</strong> ${l.action || 'Unknown'}</div>
          <div><strong>Timestamp:</strong> ${l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Unknown'}</div>
          <div><strong>IP:</strong> ${l.ipAddress || 'Unknown'}</div>
          <div><strong>Details:</strong> ${l.details || 'None'}</div>
        </li>
      `).join('') : '<li class="log-item">No logs found</li>';
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    showNotification('Failed to load logs');
    document.getElementById('error').textContent = 'Failed to load logs: ' + error.message;
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

async function fetchAppointments() {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const response = await fetch('/api/admin/appointments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const appointments = await response.json();
    console.log('Fetched appointments:', appointments); // Debugging
    const appointmentList = document.getElementById('appointment-list');
    if (appointmentList) {
      appointmentList.innerHTML = appointments.length ? appointments.map(a => `
        <li class="appointment-item">
          <div><strong>ID:</strong> ${a.id || 'Unknown'}</div>
          <div><strong>Patient:</strong> ${a.patient?.name || 'Unknown'}</div>
          <div><strong>Doctor:</strong> ${a.doctor?.name || 'Unknown'}</div>
          <div><strong>Date:</strong> ${a.date ? new Date(a.date).toLocaleString() : 'Unknown'}</div>
          <div><strong>Status:</strong> ${a.status || 'Unknown'}</div>
        </li>
      `).join('') : '<li class="appointment-item">No appointments found</li>';
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    showNotification('Failed to load appointments');
    document.getElementById('error').textContent = 'Failed to load appointments: ' + error.message;
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

async function fetchPrescriptions() {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const response = await fetch('/api/admin/prescriptions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const prescriptions = await response.json();
    console.log('Fetched prescriptions:', prescriptions); // Debugging
    const prescriptionList = document.getElementById('prescription-list');

    if (prescriptionList) {
      prescriptionList.innerHTML = prescriptions.length ? prescriptions.map(p => {
        const patientName = p.patient?.name || 'Unknown';
        const doctorName = p.doctor?.name || 'Unknown';
        const date = p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Unknown';

        return `
          <li class="prescription-item">
            <div><strong>ID:</strong> ${p.id || 'Unknown'}</div>
            <div><strong>Patient:</strong> ${patientName}</div>
            <div><strong>Doctor:</strong> ${doctorName}</div>
            <div><strong>Date:</strong> ${date}</div>
          </li>
        `;
      }).join('') : '<li class="prescription-item">No prescriptions found</li>';
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    showNotification('Failed to load prescriptions');
    document.getElementById('error').textContent = 'Failed to load prescriptions: ' + error.message;
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

async function updateUserRole(userId, role) {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    const response = await fetch('/api/admin/users/role', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, role })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const user = await response.json();
    showNotification('User role updated successfully');
    fetchUsers();
  } catch (error) {
    console.error('Error updating user role:', error);
    showNotification('Failed to update user role');
    document.getElementById('error').textContent = 'Failed to update user role: ' + error.message;
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

function downloadLogs(format) {
  window.open(`/api/admin/logs/export/${format}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
  fetchLogs();
  fetchAppointments();
  fetchPrescriptions();
});

document.getElementById('user-list').addEventListener('click', async (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  const userId = target.dataset.userid;

  if (target.classList.contains('activate-btn') || target.classList.contains('deactivate-btn')) {
    const activate = target.classList.contains('activate-btn');
    try {
      document.getElementById('loadingSpinner').style.display = 'block';
      const url = activate ? '/api/admin/users/activate' : '/api/admin/users/deactivate';
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      showNotification(data.message || (activate ? 'User activated' : 'User deactivated'));
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user active status:', error);
      showNotification('Failed to update user status');
      document.getElementById('error').textContent = 'Failed to update user status: ' + error.message;
      document.getElementById('error').classList.remove('hidden');
    } finally {
      document.getElementById('loadingSpinner').style.display = 'none';
    }
  } else if (target.classList.contains('set-role-btn')) {
    const role = target.dataset.role;
    updateUserRole(userId, role);
  }
});