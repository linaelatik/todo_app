document.addEventListener('DOMContentLoaded', () => {
    // Add loading states
    const addLoadingState = (element) => {
        element.classList.add('loading');
        element.style.pointerEvents = 'none';
    };

    const removeLoadingState = (element) => {
        element.classList.remove('loading');
        element.style.pointerEvents = 'auto';
    };

    // Add animation to new items
    const addNewItemAnimation = (element) => {
        element.classList.add('new-item-animation');
        setTimeout(() => {
            element.classList.remove('new-item-animation');
        }, 500);
    };

    // Animate completed items
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const item = e.target.closest('.item');
            if (e.target.checked) {
                item.style.transform = 'translateX(10px)';
                setTimeout(() => {
                    item.style.transform = 'translateX(0)';
                }, 300);
            }
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            button.appendChild(ripple);

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;

            const x = e.clientX - rect.left - size/2;
            const y = e.clientY - rect.top - size/2;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add smooth collapse/expand animation for nested items
    document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subitems = btn.closest('.item').querySelector('.subitems');
            if (subitems) {
                if (subitems.style.maxHeight) {
                    subitems.style.maxHeight = null;
                } else {
                    subitems.style.maxHeight = subitems.scrollHeight + "px";
                }
            }
        });
    });

    // Add hover effect for list cards
    document.querySelectorAll('.list-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--box-shadow)';
        });
    });

    // Feature hover effects
    document.querySelectorAll('.feature').forEach(feature => {
        feature.addEventListener('mouseenter', () => {
            feature.style.transform = 'translateY(-5px)';
        });
        
        feature.addEventListener('mouseleave', () => {
            feature.style.transform = 'translateY(0)';
        });
    });

    // Flash message animations
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
});