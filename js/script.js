document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const response = await fetch('http://localhost:2206/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.token) {
        localStorage.setItem('adminToken', data.token);
        window.location.href = 'admindash.html';
    } else {
        alert('Invalid credentials');
    }
});
