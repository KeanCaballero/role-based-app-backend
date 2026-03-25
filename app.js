
function getAuthHeader() {
  const token = sessionStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Example: fetch the admin dashboard (will 403 if user is not admin).
 */
async function loadAdminDashboard() {
  const res = await fetch('http://localhost:3000/api/admin/dashboard', {
    headers: getAuthHeader()
  });
  if (res.ok) {
    const data = await res.json();
    console.log(data.message); // "Welcome to the admin dashboard!"
  } else {
    console.warn('Access denied!');
  }
}