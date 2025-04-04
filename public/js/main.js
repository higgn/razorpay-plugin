document.addEventListener('DOMContentLoaded', () => {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            if (category) {
                // Redirect to the form page, passing the category as a URL parameter
                window.location.href = `/form.html?category=${encodeURIComponent(category)}`;
            }
        });

        // Make the button inside the card also trigger the navigation
        const button = card.querySelector('button');
        if (button) {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent card click from firing twice
                const category = card.getAttribute('data-category');
                 if (category) {
                    window.location.href = `/form.html?category=${encodeURIComponent(category)}`;
                }
            });
        }
    });
});