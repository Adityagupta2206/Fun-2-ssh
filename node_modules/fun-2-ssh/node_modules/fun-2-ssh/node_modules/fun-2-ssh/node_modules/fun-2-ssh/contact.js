document.getElementById('contactForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData1 = new FormData(event.target);
    const data1 = {
        name: formData1.get('name'),
        email: formData1.get('email'),
        phone: formData1.get('phone'),
        subject: formData1.get('subject'),
        message: formData1.get('message'),
    };

    try {
        const response = await fetch('http://localhost:2206/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data1),
        });

        if (response.ok) {
            alert('Contact form sent successfully!');
        } else {
            const errorText = await response.text();
            alert(`Error: ${errorText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while making the request.');
    }
});
