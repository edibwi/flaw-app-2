const STORAGE_KEY = 'it_assets_db';
const EXPIRY_KEY = 'it_assets_expiry';
const EXPIRY_DAYS = 365;

let assets = [];
let editingId = null;

function init() {
    loadAssets();
    renderTable();
    setupEventListeners();
}

function loadAssets() {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    const now = Date.now();

    if (expiry && now > parseInt(expiry)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        assets = [];
        return;
    }

    const data = localStorage.getItem(STORAGE_KEY);
    assets = data ? JSON.parse(data) : [];
}

function saveAssets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    const expiry = Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
}

function setupEventListeners() {
    document.getElementById('add-btn').addEventListener('click', () => openModal());
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('asset-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('status-filter').addEventListener('change', renderTable);
    document.getElementById('category-filter').addEventListener('change', renderTable);
    document.getElementById('asset-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('asset-modal')) {
            closeModal();
        }
    });
}

function openModal(editId = null) {
    editingId = editId;
    const form = document.getElementById('asset-form');
    const modal = document.getElementById('asset-modal');
    const title = document.getElementById('modal-title');

    if (editId) {
        const asset = assets.find(a => a.assetId === editId);
        title.textContent = 'Edit Asset';
        document.getElementById('asset-name').value = asset.name;
        document.getElementById('category').value = asset.category;
        document.getElementById('serial-number').value = asset.serialNumber;
        document.getElementById('owner').value = asset.owner;
        document.getElementById('status').value = asset.status;
        document.getElementById('purchase-date').value = asset.purchaseDate;
    } else {
        title.textContent = 'Add Asset';
        form.reset();
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('asset-modal').classList.remove('active');
    document.getElementById('asset-form').reset();
    editingId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();

    const asset = {
        id: editingId || Date.now(),
        name: document.getElementById('asset-name').value,
        category: document.getElementById('category').value,
        serialNumber: document.getElementById('serial-number').value,
        owner: document.getElementById('owner').value,
        status: document.getElementById('status').value,
        purchaseDate: document.getElementById('purchase-date').value,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
        const index = assets.findIndex(a => a.id === editingId);
        assets[index] = asset;
    } else {
        assets.push(asset);
    }

    saveAssets();
    renderTable();
    closeModal();
}

function deleteAsset(id) {
    if (confirm('Are you sure you want to delete this asset?')) {
        assets = assets.filter(a => a.assetId !== id);
        saveAssets();
        renderTable();
    }
}

function getFilteredAssets() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;

    return assets.filter(asset => {
        const matchesSearch = !search ||
            asset.name.toLowerCase().includes(search) ||
            asset.serialNumber.toLowerCase().includes(search) ||
            asset.owner.toLowerCase().includes(search);

        const matchesStatus = !statusFilter || asset.status === statusFilter;
        const matchesCategory = !categoryFilter || asset.category === categoryFilter;

        return matchesSearch && matchesStatus;
    });
}

function renderTable() {
    const filtered = getFilteredAssets();
    const tbody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('assets-table');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        table.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = filtered.map(asset => `
            <tr>
                <td>${asset.name}</td>
                <td>${asset.category}</td>
                <td>${asset.serialNumber}</td>
                <td>${asset.owner || '-'}</td>
                <td>
                    <span class="badge badge-${asset.status.toLowerCase()}">
                        ${asset.status}
                    </span>
                </td>
                <td>${asset.purchaseDate || '-'}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-edit" onclick="openModal('${asset.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteAsset(${asset.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStats();
}

function updateStats() {
    const total = assets.length;
    const active = assets.filter(a => a.status === 'Active').length;
    const inactive = assets.filter(a => a.status === 'Inactive').length;

    document.getElementById('total-count').textContent = total;
    document.getElementById('active-count').textContent = active;
    document.getElementById('inactive-count').textContent = inactive;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
