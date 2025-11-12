document.getElementById('bookingForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        package: formData.get('package'),
        date: formData.get('date'),
        guest: formData.get('guest'),
        slot: formData.get('slot')
    };

    try {
        const response = await fetch('http://localhost:2206/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            document.getElementById('bookingForm').reset();
            showMessage('Booking successful! 🎉', false, () => {
                window.location.href = 'book.html'; // Redirect to the About page
            });
        } else {
            const errorText = await response.text();
            showMessage(`${errorText}`, true);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('An error occurred while making the request.', true);
    }
});

function showMessage(message, isError = false, callback = null) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.padding = '20px';
    messageDiv.style.fontSize = '20px';
    messageDiv.style.fontWeight = 'bold';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.backgroundColor = isError ? 'red' : 'green';
    messageDiv.style.color = 'white';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.zIndex = '1000';

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
        if (callback) callback(); // Execute callback after message disappears
    }, 3000);
}
