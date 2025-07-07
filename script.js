  
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

            // Password toggle functionality
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    });

      // Password toggle functionality
    document.getElementById('toggleSignupPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('signupPassword');
        const icon = this.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    });

      AOS.init();



      // Initialize GSAP animations
      gsap.registerPlugin(ScrollTrigger);

      // Mouse move parallax effect
      document.addEventListener("mousemove", (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        // Move spice elements with mouse
        const spiceElements = document.querySelectorAll(".spice-element");
        spiceElements.forEach((el, i) => {
          const speedX = 0.03 + i * 0.01;
          const speedY = 0.02 + i * 0.01;
          const offsetX = (x - 0.5) * 100 * speedX;
          const offsetY = (y - 0.5) * 100 * speedY;

          gsap.to(el, {
            x: offsetX,
            y: offsetY,
            duration: 1.5,
            ease: "power2.out",
          });
        });

        // Create spice trail effect
        if (Math.random() > 0.7) {
          createSpiceTrail(e.clientX, e.clientY);
        }
      });

      // Create spice trail effect
      function createSpiceTrail(x, y) {
        const trail = document.createElement("div");
        trail.className = "spice-trail";

        // Random spice color
        const colors = ["#FFC72C", "#FF9933", "#FF0000", "#339900", "#8B4513"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        trail.style.backgroundColor = color;
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        trail.style.width = `${Math.random() * 12 + 4}px`;
        trail.style.height = trail.style.width;

        document.body.appendChild(trail);

        // Animate trail
        gsap.to(trail, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          opacity: 0,
          duration: 1.5,
          onComplete: () => trail.remove(),
        });
      }

      // Create spice particles for basket
      function createSpiceParticles() {
        const particlesContainer = document.querySelector(".spice-particles");
        if (!particlesContainer) return;

        for (let i = 0; i < 30; i++) {
          const particle = document.createElement("div");
          particle.classList.add("spice-particle");

          // Random position
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          particle.style.left = `${left}%`;
          particle.style.top = `${top}%`;

          // Random size
          const size = Math.random() * 10 + 5;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;

          // Random color
          const colors = [
            "#FFC72C",
            "#FF9933",
            "#FF0000",
            "#8B4513",
            "#27ae60",
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          particle.style.backgroundColor = color;

          // Animation delay and duration
          particle.style.animationDelay = `${Math.random() * 5}s`;
          particle.style.animationDuration = `${Math.random() * 3 + 2}s`;

          particlesContainer.appendChild(particle);
        }
      }

      // Create bubble animations for kadhai
      function createBubbles() {
        const kadhai = document.querySelector(".kadhai");
        for (let i = 0; i < 12; i++) {
          const bubble = document.createElement("div");
          bubble.classList.add("bubble");
          bubble.style.width = `${Math.random() * 12 + 6}px`;
          bubble.style.height = bubble.style.width;
          bubble.style.left = `${Math.random() * 120 + 15}px`;
          bubble.style.animationDelay = `${Math.random() * 3}s`;
          bubble.style.animationDuration = `${Math.random() * 2 + 2}s`;
          bubble.style.backgroundColor = `rgba(255, 255, 255, ${
            Math.random() * 0.5 + 0.3
          })`;
          kadhai.appendChild(bubble);
        }
      }

      // Initialize floating spice elements positions
      function positionSpiceElements() {
        const spiceElements = document.querySelectorAll(".spice-element");

        spiceElements.forEach((el, i) => {
          // Position randomly around the page
          const section = el.closest("section, footer");
          const rect = section.getBoundingClientRect();

          const x = Math.random() * rect.width;
          const y = Math.random() * rect.height;

          gsap.set(el, {
            x: x,
            y: y,
          });
        });
      }

      // Initialize on load
      window.addEventListener("load", () => {
        createSpiceParticles();
        positionSpiceElements();

        // Animate spice basket on scroll
        gsap.from(".spice-basket-container", {
          scrollTrigger: {
            trigger: ".hero-section",
            start: "top center",
            toggleActions: "play none none none",
          },
          opacity: 0,
          y: 100,
          duration: 1.5,
          ease: "power2.out",
        });
      });


      // Carousel scrolling
      function scrollCarousel(direction) {
        const carousel = document.getElementById("carousel");
        const scrollAmount = 340; // Width of card + gap

        if (direction === -1) {
          carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }

      // Add subtle hover effect to all post cards
      document.querySelectorAll(".post-card").forEach((card) => {
        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-10px)";
          card.style.boxShadow = "0 15px 35px rgba(139, 69, 19, 0.3)";
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "0 10px 30px rgba(139, 69, 19, 0.2)";
        });
      });

  const slider = document.getElementById("sliderWrapper");
  const cardWidth = 270; // Card width + margin

  function scrollSlider(direction) {
    slider.scrollBy({
      left: direction * cardWidth,
      behavior: 'smooth'
    });
  }

    window.onload = function () {
      const slider = document.getElementById("categorySlider");

      function scrollCategories(direction) {
        const scrollAmount = slider.offsetWidth * 0.8;
        slider.scrollBy({
          left: direction * scrollAmount,
          behavior: 'smooth'
        });
      }

      window.scrollCategories = scrollCategories;
    };


