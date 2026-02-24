async function loadCustomerData() {
    try {
        // Get the phone number of the logged-in customer
        const phone = localStorage.getItem('username');
        
        // Fetch debts specifically for this customer
        const debts = await apiFetch(`/customer/debts?phone=${phone}`);
        
        const total = debts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        document.getElementById('total-balance').textContent = `${total.toLocaleString()} TZS`;
        document.getElementById('record-count').textContent = debts.length;
        
        const historyList = document.getElementById('debt-history');
        
        if (debts.length === 0) {
            historyList.innerHTML = `<li class="p-8 text-center bg-white rounded-xl text-gray-400">No debt records found for your account.</li>`;
            return;
        }

        historyList.innerHTML = debts.map(debt => `
            <li class="p-5 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                    <p class="font-bold text-gray-800 text-lg">${debt.shop_name}</p>
                    <p class="text-sm text-gray-500">${debt.description}</p>
                    <p class="text-xs text-gray-400 mt-1">${new Date(debt.created_at).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold ${debt.amount > 0 ? 'text-red-600' : 'text-emerald-600'}">
                        ${Number(debt.amount).toLocaleString()} TZS
                    </p>
                    <span class="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded ${debt.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}">
                        ${debt.status}
                    </span>
                </div>
            </li>
        `).join('');
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('total-balance').textContent = "Error loading";
    }
}

document.getElementById('print-proof').addEventListener('click', () => {
    window.print();
});

document.addEventListener('DOMContentLoaded', loadCustomerData);