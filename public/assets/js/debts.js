let editingId = null;
let payingId = null;

const openModal = () => document.getElementById('modal').classList.remove('hidden');
const closeModal = () => { document.getElementById('modal').classList.add('hidden'); editingId = null; };
const openPaymentModal = () => document.getElementById('payment-modal').classList.remove('hidden');
const closePaymentModal = () => { document.getElementById('payment-modal').classList.add('hidden'); payingId = null; };

async function loadDebts(search = '') {
    try {
        // Load shops for the dropdown
        const shops = await apiFetch('/shops'); 
        document.getElementById('debt-shop').innerHTML = shops.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        
        // Fetch debts (Using the route we created in server.js)
        const debts = await apiFetch(`/all-debts?search=${search}`);
        const list = document.getElementById('debts-list');
        
        list.innerHTML = debts.map(debt => `
            <li class="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                    <span class="block font-bold text-gray-800">${debt.customer_name || 'No Name'} (${debt.customer_phone || 'Phone Number'})</span>
                    <span class="text-sm text-gray-500">${debt.description} • Shop: ${debt.shop_name}</span>
                    <span class="block text-xs text-gray-400 mt-1">${new Date(debt.created_at).toLocaleDateString()}</span>
                </div>
                <div class="text-right">
                    <span class="block text-lg font-bold text-red-600">${Number(debt.amount).toLocaleString()} TZS</span>
                    <div class="mt-2 flex gap-2">
                        <button class="text-xs font-bold text-indigo-600 edit-debt" data-id="${debt.id}">Edit</button>
                        <button class="text-xs font-bold text-emerald-600 pay-debt" data-id="${debt.id}">Pay</button>
                        <button class="text-xs font-bold text-red-400 delete-debt" data-id="${debt.id}">Delete</button>
                    </div>
                </div>
            </li>
        `).join('');
        
        attachEventListeners(debts);
    } catch (err) {
        console.error('Error: ' + err.message);
    }
}

function attachEventListeners(debts) {
    document.querySelectorAll('.edit-debt').forEach(btn => {
        btn.onclick = (e) => {
            editingId = e.target.dataset.id;
            const debt = debts.find(d => d.id == editingId);
            document.getElementById('debt-shop').value = debt.shop_id;
            document.getElementById('debt-phone').value = debt.customer_phone || '';
            document.getElementById('debt-name').value = debt.customer_name || '';
            document.getElementById('debt-desc').value = debt.description;
            document.getElementById('debt-amount').value = debt.amount;
            openModal();
        };
    });

    document.querySelectorAll('.pay-debt').forEach(btn => {
        btn.onclick = (e) => {
            payingId = e.target.dataset.id;
            openPaymentModal();
        };
    });

    document.querySelectorAll('.delete-debt').forEach(btn => {
        btn.onclick = async (e) => {
            if (confirm('Permanently delete this record?')) {
                await apiFetch(`/debts/${e.target.dataset.id}`, 'DELETE');
                loadDebts();
            }
        };
    });
}

document.getElementById('add-debt').onclick = () => {
    editingId = null;
    document.getElementById('modal-form').reset();
    document.getElementById('debt-date').value = new Date().toISOString().split('T')[0];
    openModal();
};

document.getElementById('modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        shop_id: document.getElementById('debt-shop').value,
        customer_phone: document.getElementById('debt-phone').value,
        customer_name: document.getElementById('debt-name').value,
        description: document.getElementById('debt-desc').value,
        amount: parseFloat(document.getElementById('debt-amount').value)
    };
    const method = editingId ? 'PUT' : 'POST';
    const endpoint = editingId ? `/debts/${editingId}` : '/debts';
    await apiFetch(endpoint, method, data);
    closeModal();
    loadDebts();
};

document.getElementById('payment-form').onsubmit = async (e) => {
    e.preventDefault();
    const amountPaid = parseFloat(document.getElementById('payment-amount').value);
    await apiFetch(`/debts/${payingId}/pay`, 'PUT', { amount: amountPaid });
    closePaymentModal();
    loadDebts();
};

document.getElementById('close-modal').onclick = closeModal;
document.getElementById('close-payment').onclick = closePaymentModal;
document.getElementById('debt-search').oninput = (e) => loadDebts(e.target.value);

loadDebts();