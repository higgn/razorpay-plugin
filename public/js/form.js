document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('submission-form');
    const categoryTitle = document.getElementById('category-title');
    const categoryInput = document.getElementById('category');
    const proceedToPayBtn = document.getElementById('proceed-to-pay-btn');
    const formErrorDiv = document.getElementById('form-error');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- Get Category from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        categoryTitle.textContent = category;
        categoryInput.value = category;
    } else {
        // Handle case where category is missing (e.g., redirect back or show error)
        categoryTitle.textContent = 'Unknown Category';
        formErrorDiv.textContent = 'Error: Category not specified. Please select a category first.';
        formErrorDiv.style.display = 'block';
        proceedToPayBtn.disabled = true;
    }

    // --- Form Validation (Basic Client-Side) ---
    function validateForm() {
        clearErrors();
        let isValid = true;
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const number = document.getElementById('number').value.trim();
        const address = document.getElementById('address').value.trim();
        const fileInput = document.getElementById('submissionFile');

        if (!name) {
            showError('name-error', 'Name is required.');
            isValid = false;
        }
        if (!email) {
            showError('email-error', 'Email is required.');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format check
            showError('email-error', 'Please enter a valid email address.');
            isValid = false;
        }
        if (!number) {
            showError('number-error', 'Phone number is required.');
            isValid = false;
        } else if (!/^\d{10}$/.test(number)) { // Basic 10-digit check
             showError('number-error', 'Please enter a valid 10-digit phone number.');
             isValid = false;
        }
        if (!address) {
            showError('address-error', 'Address is required.');
            isValid = false;
        }
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('file-error', 'Submission file is required.');
            isValid = false;
        } else {
            // Optional: Add file size check here (e.g., fileInput.files[0].size > MAX_SIZE)
             const maxSize = 100 * 1024 * 1024; // 100MB
             if (fileInput.files[0].size > maxSize) {
                 showError('file-error', `File size exceeds the limit of ${maxSize / 1024 / 1024} MB.`);
                 isValid = false;
             }
        }

        return isValid;
    }

    function showError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function clearErrors() {
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
             el.textContent = '';
             el.style.display = 'none';
        });
        formErrorDiv.textContent = '';
        formErrorDiv.style.display = 'none';
    }

    // --- Handle "Proceed to Payment" Button Click ---
    proceedToPayBtn.addEventListener('click', async () => {
        if (!validateForm()) {
            showError('form-error', 'Please fix the errors above before proceeding.');
            formErrorDiv.style.display = 'block';
            return;
        }

        // Disable button, show loading
        proceedToPayBtn.disabled = true;
        loadingIndicator.style.display = 'block';
        formErrorDiv.style.display = 'none'; // Hide previous global errors

        try {
            // 1. Create Razorpay Order on the backend
            const orderResponse = await fetch('/api/submissions/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // No body needed if amount is fixed on backend
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.message || `Failed to create payment order (Status: ${orderResponse.status})`);
            }

            const orderData = await orderResponse.json();

            // 2. Initialize Razorpay Checkout
            const options = {
                key: orderData.keyId, // Your Razorpay Key ID
                amount: orderData.amount, // Amount in paise
                currency: orderData.currency,
                name: "National Talent Competition", // Name of your business
                description: `Entry Fee for ${category}`,
                order_id: orderData.orderId, // From backend response
                handler: async function (response) {
                     // 3. Payment Successful: Send all data (form + payment details) to backend for verification and saving
                    console.log("Razorpay success response:", response);
                    await handleFormSubmission(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
                },
                prefill: {
                    // Pre-fill user details if available (improves user experience)
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    contact: document.getElementById('number').value
                },
                notes: {
                    address: document.getElementById('address').value,
                    category: category
                },
                theme: {
                    color: "#243b55" // Theme color (match your site)
                },
                 modal: {
                    ondismiss: function() {
                        console.log('Checkout form closed');
                        // Re-enable button if user closes modal without paying
                        proceedToPayBtn.disabled = false;
                         loadingIndicator.style.display = 'none';
                         showError('form-error', 'Payment was cancelled.');
                         formErrorDiv.style.display = 'block';
                    }
                }
            };

            const rzp = new Razorpay(options);

            // Handle payment errors during checkout process itself
             rzp.on('payment.failed', function (response){
                    console.error("Razorpay payment failed:", response);
                    showError('form-error', `Payment Failed: ${response.error.description} (Code: ${response.error.code})`);
                    formErrorDiv.style.display = 'block';
                     // Keep button disabled? Or allow retry? Decide UX.
                     proceedToPayBtn.disabled = false; // Allow retry for now
                     loadingIndicator.style.display = 'none';
             });


            loadingIndicator.style.display = 'none'; // Hide loading before showing modal
            rzp.open(); // Open the Razorpay checkout modal

        } catch (error) {
            console.error('Error during payment initiation:', error);
            showError('form-error', `Error: ${error.message}`);
            formErrorDiv.style.display = 'block';
            proceedToPayBtn.disabled = false; // Re-enable button on error
            loadingIndicator.style.display = 'none';
        }
    });

    // --- Function to Handle Actual Form Submission After Payment Success ---
    async function handleFormSubmission(paymentId, orderId, signature) {
         loadingIndicator.style.display = 'block'; // Show loading again
         proceedToPayBtn.textContent = 'Processing Submission...'; // Update button text
         proceedToPayBtn.disabled = true;

        const formData = new FormData(form); // Gathers all form fields including the file

        // Append payment details to the FormData
        formData.append('razorpay_payment_id', paymentId);
        formData.append('razorpay_order_id', orderId);
        formData.append('razorpay_signature', signature);

        // Log FormData contents (for debugging - files won't show directly)
        // for (let [key, value] of formData.entries()) {
        //    console.log(`${key}:`, value);
        // }

        try {
            const response = await fetch('/api/submissions/submit', {
                method: 'POST',
                body: formData // Send as FormData (required for file uploads)
                // No 'Content-Type' header needed when sending FormData; browser sets it with boundary
            });

            const result = await response.json();

            if (!response.ok) {
                 throw new Error(result.message || `Submission failed (Status: ${response.status})`);
            }

            console.log('Submission successful:', result);
             // Redirect to thank you page on success
             if(result.redirectUrl) {
                 window.location.href = result.redirectUrl;
             } else {
                  // Fallback if redirectUrl isn't provided
                  window.location.href = '/thank_you.html';
             }


        } catch (error) {
            console.error('Error submitting form data:', error);
            showError('form-error', `Submission Error: ${error.message}`);
            formErrorDiv.style.display = 'block';
            proceedToPayBtn.disabled = false; // Allow retry on submission error
            proceedToPayBtn.textContent = 'Proceed to Payment'; // Reset button text
             loadingIndicator.style.display = 'none';
        }
    }
});