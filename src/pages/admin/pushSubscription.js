import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showConfirmModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

export async function pushSubscriptionAdminPage() {
  const mainContent = document.getElementById("mainContent");

  mainContent.innerHTML = `
    <div class="container-fluid">
      <h2 class="text-success mb-4">Push Subscription</h2>

      <div class="card border-success">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Subscription Aktif</h5>
        </div>
        <div class="card-body" id="subTableContainer">
          <div class="spinner-border text-success"></div>
        </div>
      </div>
    </div>
  `;

  loadSubscriptions();
}

async function loadSubscriptions() {
  try {
    const res = await fetchAPI(API.pushSubscriptions, {
      headers: getAuthHeaders(),
    });

    const list = res.results || res.data || res;
    renderSubscriptionTable(list);
  } catch (err) {
    document.getElementById("subTableContainer").innerHTML =
      `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderSubscriptionTable(list) {
  const container = document.getElementById("subTableContainer");

  if (!list.length) {
    container.innerHTML = `<div class="alert alert-info">Belum ada subscription</div>`;
    return;
  }

  container.innerHTML = `
    <table class="table table-hover">
      <thead class="table-success">
        <tr>
          <th>No</th>
          <th>ID</th>
          <th>User</th>
          <th>Endpoint</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((s, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${s.id}</td>
            <td class="text-truncate" style="max-width:300px">${s.user_username}</td>
            <td class="text-truncate" style="max-width:300px">${s.endpoint}</td>
            <td>
              <button class="btn btn-sm btn-danger"
                onclick="deleteSub(${s.id})">
                Hapus
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  window.deleteSub = deleteSub;
}


async function deleteSub(id) {
  showConfirmModal(
    "Yakin ingin menghapus subscription ini?",
    async () => {
      await fetchAPI(`${API.pushSubscriptions}${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      showToast("Subscription dihapus", "success");
      loadSubscriptions();
    }
  );
}

