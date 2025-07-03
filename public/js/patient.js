async function fetchPrescriptions() {
  try {
    const patientId = parseInt(localStorage.getItem('userId'), 10);
    if (isNaN(patientId)) {
      console.error('No valid patientId found in localStorage');
      alert('Please log in again');
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`/api/prescriptions/${patientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const prescriptions = await response.json();
    const prescriptionList = document.getElementById('prescription-list');
    if (prescriptionList) {
      prescriptionList.innerHTML = prescriptions.length ? prescriptions.map(p => `
        <li class="border p-4 rounded">
          <strong>Diagnosis:</strong> ${p.diagnosis}<br>
          <strong>Medication:</strong> ${p.medication}<br>
          <strong>Notes:</strong> ${p.notes || 'None'}<br>
          <strong>Doctor:</strong> ${p.doctor.name}<br>
          <strong>Created:</strong> ${new Date(p.createdAt).toLocaleString()}
        </li>
      `).join('') : '<li class="border p-4 rounded">No prescriptions found</li>';
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    alert('Failed to load prescriptions');
  }
}

async function fetchAppointments() {
  try {
    const response = await fetch('/api/appointments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const appointments = await response.json();
    const appointmentList = document.getElementById('appointment-list');
    if (appointmentList) {
      appointmentList.innerHTML = appointments.length ? appointments.map(a => `
        <li class="border p-4 rounded">
          <strong>Doctor:</strong> ${a.doctor.name}<br>
          <strong>Date:</strong> ${new Date(a.date).toLocaleString()}<br>
          <strong>Status:</strong> ${a.status}
          ${a.status === 'Pending' ? `<br><button onclick="cancelAppointment(${a.id})" class="bg-red-600 text-white p-1 rounded hover:bg-red-700 mt-2">Cancel</button>` : ''}
        </li>
      `).join('') : '<li class="border p-4 rounded">No appointments found</li>';
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    alert('Failed to load appointments');
  }
}

async function fetchDoctors() {
  try {
    const response = await fetch('/api/users/doctors', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const doctors = await response.json();
    const doctorSelect = document.getElementById('doctorId');
    if (doctorSelect) {
      doctorSelect.innerHTML = '<option value="">Choose a doctor</option>' + doctors.map(d => `
        <option value="${d.id}">${d.name}</option>
      `).join('');
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    alert('Failed to load doctors');
  }
}

async function bookAppointment(event) {
  event.preventDefault();
  try {
    const doctorId = document.getElementById('doctorId').value;
    const date = document.getElementById('date').value;
    if (!doctorId || !date) {
      alert('Please select a doctor and date');
      return;
    }

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ doctorId: parseInt(doctorId, 10), date })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const appointment = await response.json();
    alert('Appointment booked successfully');
    document.getElementById('appointment-form').reset();
    fetchAppointments();
  } catch (error) {
    console.error('Error booking appointment:', error);
    alert('Failed to book appointment');
  }
}

async function cancelAppointment(appointmentId) {
  try {
    if (!appointmentId || isNaN(parseInt(appointmentId, 10))) {
      throw new Error('Invalid appointment ID');
    }
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(`/api/appointments/${parseInt(appointmentId, 10)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    alert(result.message || 'Appointment cancelled successfully');
    fetchAppointments();
  } catch (error) {
    console.error('Error cancelling appointment:', error.message);
    alert(`Failed to cancel appointment: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to access the dashboard');
    window.location.href = '/login';
    return;
  }
  fetchPrescriptions();
  fetchAppointments();
  fetchDoctors();
  const appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', bookAppointment);
  }
});