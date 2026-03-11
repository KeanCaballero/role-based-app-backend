async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Save token in sessionStorage (persists on page refresh)
      sessionStorage.setItem('authToken', data.token);
      showDashboard(data.user); // Your existing function
    } else {
      alert('Login failed: ' + data.error);
    }
  } catch (err) {
    alert('Network error');
  }
}
