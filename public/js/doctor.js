const prescriptionForm = document.getElementById('prescription-form');
if (prescriptionForm) {
  prescriptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const patientId = document.getElementById('patientId').value;
      const diagnosis = document.getElementById('diagnosis').value;
      const medication = document.getElementById('medication').value;
      const notes = document.getElementById('notes').value;

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patientId, diagnosis, medication, notes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const prescription = await response.json();
      alert('Prescription created successfully');
      prescriptionForm.reset();
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription');
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Please log in first");
    window.location.href = '/login';
    return;
  }

  fetchPatientRecords();
});

async function fetchPatientRecords() {
  const container = document.getElementById("patient-records");
  container.innerHTML = "<p>Loading patient records...</p>";

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in first');
    }

    const response = await fetch('/doctors/patient-records', {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to load records');
    }

    renderPatientRecords(result.data, container);
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = `
      <div class="error-alert">
        ${error.message} 
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", fetchPatientRecords);

function renderPatientRecords(data, container) {
  container.innerHTML = "";

  if (!data.patients.length) {
    container.innerHTML = "<p>No patient records found.</p>";
    return;
  }

  data.patients.forEach(patient => {
    const patientCard = document.createElement("div");
    patientCard.className = "border rounded-lg p-4 bg-gray-50 mb-4";

    let html = `
      <h3 class="text-lg font-semibold text-gray-800">${patient.patientName}</h3>
      <p class="text-sm text-gray-600">${patient.patientEmail} (ID: ${patient.patientId})</p>

      <h4 class="mt-3 font-medium text-gray-700">Appointments:</h4>
      <ul class="list-disc ml-5 text-sm text-gray-600 mb-4">
        ${patient.appointments.map(app =>
          `<li>${new Date(app.date).toLocaleString()} - ${app.status}</li>`
        ).join("")}
      </ul>

      <h4 class="mt-3 font-medium text-gray-700">Prescriptions:</h4>
      <ul class="list-disc ml-5 text-sm text-gray-600">
        ${patient.prescriptions.map(prescription => {
          const decrypted = prescription.decryptedData || {};
          return `
            <li class="mb-4 p-2 border rounded">
              <div class="prescription-content">
                <strong>${decrypted.medication || 'N/A'}</strong> for "${decrypted.diagnosis || 'N/A'}"
                <br><small>Notes: ${decrypted.notes || 'None'}</small>
                <br><em>${new Date(prescription.createdAt).toLocaleString()}</em>
              </div>
              <div class="mt-2 flex gap-2">
                <button onclick="showEditForm('${prescription.id}')" 
                  class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                  Edit
                </button>
                <button onclick="deletePrescription('${prescription.id}')" 
                  class="bg-red-500 text-white px-2 py-1 rounded text-xs">
                  Delete
                </button>
              </div>
              <div id="edit-form-${prescription.id}" class="edit-form hidden mt-2 p-2 bg-gray-100 rounded"></div>
            </li>
          `;
        }).join("")}
      </ul>
    `;

    patientCard.innerHTML = html;
    container.appendChild(patientCard);
  });
}


async function deletePrescription(prescriptionId) {
  if (!confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete prescription');
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete prescription');
    }

    showNotification('Prescription deleted successfully', 'success');
    
    fetchPatientRecords();

  } catch (error) {
    console.error('Error deleting prescription:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

function showEditForm(prescriptionId, currentData) {
  const editFormHtml = `
    <div id="edit-prescription-${prescriptionId}" class="edit-form p-4 bg-gray-50 rounded-lg mt-2">
      <h4 class="font-medium text-gray-700 mb-2">Edit Prescription</h4>
      <form onsubmit="handleUpdatePrescription(event, '${prescriptionId}')" class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Diagnosis</label>
          <input type="text" id="edit-diagnosis-${prescriptionId}" 
                 value="${currentData.diagnosis || ''}" 
                 class="w-full p-2 border rounded" required>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Medication</label>
          <input type="text" id="edit-medication-${prescriptionId}" 
                 value="${currentData.medication || ''}" 
                 class="w-full p-2 border rounded" required>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea id="edit-notes-${prescriptionId}" 
                    class="w-full p-2 border rounded">${currentData.notes || ''}</textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button type="button" onclick="cancelEdit('${prescriptionId}')" 
                  class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
            Cancel
          </button>
          <button type="submit" 
                  class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `;

  // Insert or update the form
  const existingForm = document.getElementById(`edit-prescription-${prescriptionId}`);
  if (existingForm) {
    existingForm.innerHTML = editFormHtml;
  } else {
    const prescriptionElement = document.querySelector(`[data-prescription-id="${prescriptionId}"]`);
    if (prescriptionElement) {
      prescriptionElement.insertAdjacentHTML('afterend', editFormHtml);
    }
  }
}

async function handleUpdatePrescription(event, prescriptionId) {
  event.preventDefault();
  
  const diagnosis = document.getElementById(`edit-diagnosis-${prescriptionId}`).value;
  const medication = document.getElementById(`edit-medication-${prescriptionId}`).value;
  const notes = document.getElementById(`edit-notes-${prescriptionId}`).value;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diagnosis, medication, notes })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update prescription');
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to update prescription');
    }

    showNotification('Prescription updated successfully', 'success');
    
    cancelEdit(prescriptionId);
    
    fetchPatientRecords();

  } catch (error) {
    console.error('Error updating prescription:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

function cancelEdit(prescriptionId) {
  const editForm = document.getElementById(`edit-prescription-${prescriptionId}`);
  if (editForm) {
    editForm.remove();
  }
}

function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 border-l-4 p-4 ${colors[type]} rounded shadow-lg`;
  notification.innerHTML = `
    <p>${message}</p>
    <button onclick="this.parentElement.remove()" class="absolute top-1 right-1 text-lg">×</button>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function renderPatientRecords(data, container) {
  container.innerHTML = "";

  if (!data.patients.length) {
    container.innerHTML = "<p>No patient records found.</p>";
    return;
  }

  data.patients.forEach(patient => {
    const patientCard = document.createElement("div");
    patientCard.className = "border rounded-lg p-4 bg-white shadow-sm mb-6";

    let html = `
      <h3 class="text-lg font-semibold text-gray-800">${patient.patientName}</h3>
      <p class="text-sm text-gray-600 mb-4">${patient.patientEmail} (ID: ${patient.patientId})</p>

      <h4 class="font-medium text-gray-700 mb-2">Appointments</h4>
      <ul class="list-disc ml-5 text-sm text-gray-600 mb-4">
        ${patient.appointments.map(app => `
          <li class="mb-1">${new Date(app.date).toLocaleString()} - ${app.status}</li>
        `).join('')}
      </ul>

      <h4 class="font-medium text-gray-700 mb-2">Prescriptions</h4>
      <div class="space-y-4">
    `;

    patient.prescriptions.forEach(prescription => {
      const decrypted = prescription.decryptedData || {};
      html += `
        <div data-prescription-id="${prescription.id}" class="border rounded p-3 bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <p><strong>${decrypted.medication || 'N/A'}</strong> for "${decrypted.diagnosis || 'N/A'}"</p>
              ${decrypted.notes ? `<p class="text-sm mt-1">Notes: ${decrypted.notes}</p>` : ''}
              <p class="text-xs text-gray-500 mt-1">
                Prescribed on ${new Date(prescription.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div class="flex space-x-2">
              <button onclick="showEditForm('${prescription.id}', ${JSON.stringify(decrypted).replace(/"/g, '&quot;')})"
                class="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                Edit
              </button>
              <button onclick="deletePrescription('${prescription.id}')"
                class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    patientCard.innerHTML = html;
    container.appendChild(patientCard);
  });
}