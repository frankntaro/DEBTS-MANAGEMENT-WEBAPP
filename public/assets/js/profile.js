document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

async function loadProfile() {
    // We get the username from localStorage because we saved it during login in auth.js
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('profile-name').value = username;
    }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('profile-password').value;

    if (!newPassword) {
        alert('Please enter a new password to update.');
        return;
    }

    const data = {
        username: localStorage.getItem('username'),
        password: newPassword
    };

    try {
        // We use the auth endpoint or a specific profile endpoint
        const response = await apiFetch('/profile/update', 'PUT', data);
        
        if (response) {
            alert('Password updated successfully!');
            document.getElementById('profile-password').value = '';
        }
    } catch (err) {
        alert('Error updating profile: ' + err.message);
    }
});