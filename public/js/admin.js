document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const adminKeyInput = document.getElementById('admin-key');
    const loginErrorDiv = document.getElementById('login-error');

    const submissionsTable = document.getElementById('submissions-table');
    const submissionsTbody = document.getElementById('submissions-tbody');
    const loadingDiv = document.getElementById('loading-submissions');
    const errorDiv = document.getElementById('submissions-error');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Constants ---
    const ADMIN_KEY_STORAGE = 'adminAuthKey'; // Key for sessionStorage

    // --- Admin Login Logic ---
    if (loginForm && adminKeyInput) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            const key = adminKeyInput.value.trim();
            loginErrorDiv.style.display = 'none'; // Hide previous errors

            if (!key) {
                loginErrorDiv.textContent = 'Admin key cannot be empty.';
                loginErrorDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: key })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // --- INSECURE STORAGE ---
                    // WARNING: Storing the actual key or even a success flag in sessionStorage
                    // is NOT secure for real applications. This is just to make the simple
                    // key check work across page loads without sessions/JWT.
                    // A determined user can still bypass this.
                    sessionStorage.setItem(ADMIN_KEY_STORAGE, key); // Store the key temporarily
                    window.location.href = '/admin_dashboard.html'; // Redirect to dashboard
                } else {
                    throw new Error(result.message || 'Invalid admin key.');
                }

            } catch (error) {
                console.error('Admin login failed:', error);
                loginErrorDiv.textContent = error.message;
                loginErrorDiv.style.display = 'block';
                 sessionStorage.removeItem(ADMIN_KEY_STORAGE); // Clear any potentially stored key on failure
            }
        });
    }

    // --- Admin Dashboard Logic ---
    if (submissionsTable && submissionsTbody) {
        // Check if logged in (using the insecure method)
        const storedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
        if (!storedKey) {
             // If not "logged in", redirect back to login
             console.warn("Admin key not found in sessionStorage. Redirecting to login.");
             window.location.href = '/admin_login.html';
             return; // Stop further execution
        }

        fetchSubmissions(storedKey); // Fetch data using the stored key

         // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem(ADMIN_KEY_STORAGE); // Clear the stored key
                window.location.href = '/admin_login.html'; // Redirect to login
            });
        }
    }


    // --- Function to Fetch and Display Submissions ---
    async function fetchSubmissions(adminKey) {
         if (!loadingDiv || !errorDiv || !submissionsTable || !submissionsTbody) return;

         loadingDiv.style.display = 'block';
         errorDiv.style.display = 'none';
         submissionsTable.style.display = 'none';
         submissionsTbody.innerHTML = ''; // Clear previous entries

         try {
             const response = await fetch('/api/admin/submissions', {
                 method: 'GET',
                 headers: {
                     // Pass the stored key in the header for the backend middleware check
                     'admin-key': adminKey
                 }
             });

             if (response.status === 401) { // Unauthorized
                 // Key might be invalid or expired if using proper auth
                  sessionStorage.removeItem(ADMIN_KEY_STORAGE); // Clear invalid stored key
                  window.location.href = '/admin_login.html'; // Redirect to login
                 throw new Error('Unauthorized. Please login again.');
             }

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `Failed to fetch submissions (Status: ${response.status})`);
              }

              const submissions = await response.json();

              loadingDiv.style.display = 'none';

              if (submissions.length === 0) {
                  errorDiv.textContent = 'No submissions found.';
                  errorDiv.style.display = 'block';
              } else {
                  submissionsTable.style.display = 'table'; // Show table
                  renderSubmissions(submissions, adminKey);
              }

         } catch (error) {
              console.error('Error fetching submissions:', error);
              loadingDiv.style.display = 'none';
              errorDiv.textContent = `Error: ${error.message}`;
              errorDiv.style.display = 'block';
         }
    }

    // --- Function to Render Submissions in the Table ---
    function renderSubmissions(submissions, adminKey) {
         if (!submissionsTbody) return;
         submissionsTbody.innerHTML = ''; // Clear existing rows

         submissions.forEach(sub => {
             const row = document.createElement('tr');

             // Format date for better readability
             const submissionDate = new Date(sub.submissionDate).toLocaleString('en-IN', {
                 dateStyle: 'short',
                 timeStyle: 'short'
             });

             // Create download link - IMPORTANT: include the admin key in the download URL query parameter
             // This allows the backend `checkAdminKey` middleware to authorize the download request
             const downloadUrl = `/api/admin/download/${sub._id}?key=${encodeURIComponent(adminKey)}`;

             row.innerHTML = `
                 <td>${submissionDate}</td>
                 <td>${escapeHtml(sub.name)}</td>
                 <td>${escapeHtml(sub.email)}</td>
                 <td>${escapeHtml(sub.number)}</td>
                 <td>${escapeHtml(sub.category)}</td>
                 <td>${escapeHtml(sub.address)}</td>
                 <td><a href="${downloadUrl}" title="Download ${escapeHtml(sub.fileName)}" target="_blank">${escapeHtml(sub.fileName)}</a></td>
                 <td>${escapeHtml(sub.paymentId) || 'N/A'}</td>
                 <td><span class="status-${sub.paymentStatus.toLowerCase()}">${escapeHtml(sub.paymentStatus)}</span></td>
             `;
             submissionsTbody.appendChild(row);
         });
    }

     // Helper function to prevent XSS attacks when inserting user data into HTML
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

});