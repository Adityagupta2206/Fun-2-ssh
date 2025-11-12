const token = localStorage.getItem('adminToken');
if (!token) window.location.href = 'admin-login.html';

let bookingsData = [];  // Store fetched data
let sortDirection = 'asc'; // 'asc' or 'desc'

async function fetchBookings() {
    try {
        const response = await fetch('http://localhost:2206/admin/bookings', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Unauthorized or session expired');

        bookingsData = await response.json();
        renderTable(bookingsData);
    } catch (error) {
        alert(error.message);
        logout();
    }
}

function renderTable(data) {
    const table = document.getElementById('bookingTable');
    table.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Package</th>
            <th style="cursor:pointer;" onclick="sortByDate()">
                Date 📅 <span id="dateSortArrow">${sortDirection === 'asc' ? '↑' : '↓'}</span>
            </th>
            <th>Guest</th>
            <th>Slot</th>
            <th>Send Confirmation</th>
        </tr>
    `;

    data.forEach(booking => {
        const approvedText = booking.approved
            ? '✅ Approved'
            : `<button onclick="approveBooking('${booking._id}')">OK</button>`;
        const row = `
            <tr>
                <td>${booking.name}</td>
                <td>${booking.email}</td>
                <td>${booking.phone}</td>
                <td>${booking.package}</td>
                <td>${new Date(booking.date).toLocaleDateString()}</td>
                <td>${booking.guest}</td>
                <td>${booking.slot || 'N/A'}</td>
                <td>${approvedText}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

function sortByDate() {
    bookingsData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'; // toggle sort direction
    renderTable(bookingsData);
}

async function approveBooking(id) {
    try {
        const response = await fetch(`http://localhost:2206/admin/bookings/${id}/approve`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ approved: true })
        });

        if (!response.ok) throw new Error('Failed to approve booking');
        fetchBookings();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteBooking(id) {
    try {
        const response = await fetch(`http://localhost:2206/admin/bookings/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete booking');
        fetchBookings();
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

fetchBookings();
