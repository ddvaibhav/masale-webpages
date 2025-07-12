
        document.addEventListener("DOMContentLoaded", () => {
            const galleryItems = document.querySelectorAll(".production-gallery__item");
            const navButtons = document.querySelectorAll(".production-gallery__nav-btn");
            
            // Initial animation for gallery items
            anime({
                targets: galleryItems,
                opacity: [0, 1],
                translateY: [30, 0],
                scale: [0.95, 1],
                duration: 800,
                delay: anime.stagger(100),
                easing: "easeOutExpo"
            });
            
            // Filter functionality
            navButtons.forEach(button => {
                button.addEventListener("click", () => {
                    // Update active button
                    navButtons.forEach(btn => btn.classList.remove("production-gallery__nav-btn--active"));
                    button.classList.add("production-gallery__nav-btn--active");
                    
                    const filter = button.getAttribute("data-filter");
                    
                    galleryItems.forEach(item => {
                        if (filter === "all" || item.getAttribute("data-category") === filter) {
                            item.style.display = "block";
                            // Add subtle animation when showing
                            anime({
                                targets: item,
                                scale: [0.98, 1],
                                opacity: [0, 1],
                                duration: 400,
                                easing: "easeOutExpo"
                            });
                        } else {
                            item.style.display = "none";
                        }
                    });
                });
            });
            
            // Hover animation for gallery items
            galleryItems.forEach(item => {
                item.addEventListener("mouseenter", () => {
                    anime({
                        targets: item,
                        scale: 1.02,
                        duration: 300,
                        easing: "easeOutQuad"
                    });
                });
                
                item.addEventListener("mouseleave", () => {
                    anime({
                        targets: item,
                        scale: 1,
                        duration: 400,
                        easing: "easeOutQuad"
                    });
                });
            });
        });
    