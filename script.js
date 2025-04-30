document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /**
   * ===============================
   * UTILITY FUNCTIONS
   * ===============================
   */
  // Debug helper
  const debug = (message) => {
    if (window.debugMode) {
      console.log(`[Suviksan Debug]: ${message}`);
    }
  };

  // Element selector helper
  const select = (selector, parent = document) => {
    return parent.querySelector(selector);
  };

  const selectAll = (selector, parent = document) => {
    return parent.querySelectorAll(selector);
  };

  // Event delegation helper
  const delegate = (element, eventType, selector, handler) => {
    element.addEventListener(eventType, function (event) {
      const target = event.target.closest(selector);
      if (target && element.contains(target)) {
        handler.call(target, event);
      }
    });
  };

  // Check if element is in viewport
  const isInViewport = (element, offset = 0) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= window.innerHeight - offset && rect.bottom >= offset;
  };

  // Throttle function for scroll events
  const throttle = (func, delay) => {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    };
  };

  /**
   * ===============================
   * NAVIGATION & MENU HANDLING
   * ===============================
   */
  // Mobile menu toggle
  const toggleMenu = select("#toggleMenu");
  const navMenu = select("#navMenu");
  const navbar = select("#mainNav");
  const dropdowns = selectAll(".dropdown");

  if (toggleMenu && navMenu) {
    toggleMenu.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      toggleMenu.setAttribute(
        "aria-expanded",
        toggleMenu.getAttribute("aria-expanded") === "true" ? "false" : "true"
      );

      // Change icon based on menu state
      const icon = toggleMenu.querySelector("i");
      if (navMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-times");
      }
    });
  }

  // Handle dropdowns on mobile
  dropdowns.forEach((dropdown) => {
    const link = dropdown.querySelector("a");
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle("active");
        link.setAttribute(
          "aria-expanded",
          dropdown.classList.contains("active") ? "true" : "false"
        );
      }
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      navMenu &&
      navMenu.classList.contains("active") &&
      !e.target.closest("#navMenu") &&
      !e.target.closest("#toggleMenu")
    ) {
      navMenu.classList.remove("active");
      toggleMenu.setAttribute("aria-expanded", "false");
      const icon = toggleMenu.querySelector("i");
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-times");
    }
  });

  // Sticky navbar handling with throttling
  let lastScrollTop = 0;
  const scrollThreshold = 60;

  const handleNavbarScroll = throttle(() => {
    const currentScrollTop =
      window.scrollY || document.documentElement.scrollTop;

    if (currentScrollTop > scrollThreshold) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    lastScrollTop = currentScrollTop;
  }, 10); // 10ms throttle for smooth effect

  window.addEventListener("scroll", handleNavbarScroll);

  /**
   * ===============================
   * HERO CAROUSEL
   * ===============================
   */
  const heroCarousel = select("#heroCarousel");

  if (heroCarousel) {
    const track = select(".carousel-track", heroCarousel);
    const slides = selectAll(".slide", heroCarousel);
    const dotsContainer = select(".carousel-dots", heroCarousel);

    if (!slides.length) return;

    let currentIndex = 0;
    let slideInterval;
    const slideWidth = 100; // 100% width
    const slideDuration = 5000; // 5 seconds

    // Create dots
    slides.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.setAttribute("data-index", i);
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dotsContainer.appendChild(dot);
    });

    const dots = selectAll(".dot", heroCarousel);

    // Function to go to a specific slide
    const goToSlide = (index) => {
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }

      // Update active slide
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
        slide.setAttribute("aria-hidden", i !== index);
      });

      // Update transform
      track.style.transform = `translateX(-${index * slideWidth}%)`;

      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });

      currentIndex = index;

      // Reset the interval
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, slideDuration);
    };

    // Next slide function
    const nextSlide = () => {
      goToSlide(currentIndex + 1);
    };

    // Previous slide function
    const prevSlide = () => {
      goToSlide(currentIndex - 1);
    };

    // Set up click events for dots
    delegate(dotsContainer, "click", ".dot", function () {
      const index = parseInt(this.getAttribute("data-index"));
      goToSlide(index);
    });

    // Touch events for swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    heroCarousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    heroCarousel.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true }
    );

    const handleSwipe = () => {
      const threshold = 50; // Minimum swipe distance
      if (touchEndX < touchStartX - threshold) {
        nextSlide(); // Swipe left, go to next
      } else if (touchEndX > touchStartX + threshold) {
        prevSlide(); // Swipe right, go to previous
      }
    };

    // Initialize autoplay
    slideInterval = setInterval(nextSlide, slideDuration);

    // Pause on hover
    heroCarousel.addEventListener("mouseenter", () => {
      clearInterval(slideInterval);
    });

    heroCarousel.addEventListener("mouseleave", () => {
      slideInterval = setInterval(nextSlide, slideDuration);
    });

    // Handle visibility changes (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(slideInterval);
      } else {
        slideInterval = setInterval(nextSlide, slideDuration);
      }
    });

    // Initialize first slide
    goToSlide(0);

    // Handle window resize
    window.addEventListener(
      "resize",
      throttle(() => {
        // Reapply current slide position
        track.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
      }, 100)
    );
  }

  /**
   * ===============================
   * ANIMATIONS & SCROLL EFFECTS
   * ===============================
   */
  // Fade-in animations
  const fadeElements = selectAll(".fade-in");

  const handleScrollAnimations = throttle(() => {
    fadeElements.forEach((el) => {
      if (isInViewport(el, 50)) {
        el.classList.add("visible");
      }
    });

    // Show scroll-to-top button when scrolled down
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollToTopBtn = select("#scrollToTop");

    if (scrollToTopBtn) {
      if (scrollTop > 600) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    }
  }, 50);

  window.addEventListener("scroll", handleScrollAnimations);
  window.addEventListener("resize", handleScrollAnimations);

  // Initial check for animations
  setTimeout(handleScrollAnimations, 100);

  // Scroll to top button
  // Replace your existing scroll-to-top JavaScript with this enhanced version
  // Scroll to top button with progress indicator
  const scrollToTopBtn = select("#scrollToTop");

  if (scrollToTopBtn) {
    // Create progress element
    const scrollProgress = document.createElement("div");
    scrollProgress.className = "scroll-progress";
    scrollToTopBtn.appendChild(scrollProgress);

    // Update scroll progress
    const updateScrollProgress = throttle(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Calculate scroll percentage
      const scrollPercent = scrollTop / (scrollHeight - clientHeight);

      // Update progress bar
      if (scrollProgress) {
        scrollProgress.style.transform = `scale(1, ${scrollPercent})`;
      }

      // Show/hide button
      if (scrollTop > 600) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    }, 10);

    window.addEventListener("scroll", updateScrollProgress);

    // Scroll to top on click
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  /**
   * ===============================
   * STATS COUNTER ANIMATIONS
   * ===============================
   */
  const statsSection = select(".stats");
  let countersAnimated = false;

  // Stats counter animation
  function animateCounters() {
    if (countersAnimated) return;

    const counters = selectAll(".counter");
    const speed = 200; // Animation speed - lower is faster

    counters.forEach((counter, index) => {
      const target = parseInt(counter.getAttribute("data-target"));

      // Calculate increment for smooth animation
      const count = function (current) {
        let increment = Math.ceil(target / speed);

        // Smaller increment for smaller numbers
        if (target <= 10) {
          increment = 1;
        }

        current += increment;

        if (current >= target) {
          counter.innerHTML = `${target}<sup>+</sup>`;
        } else {
          counter.innerHTML = `${current}<sup>+</sup>`;
          setTimeout(() => count(current), 30);
        }
      };

      // Start counting with slight delay for each counter
      setTimeout(() => count(0), index * 200);
    });

    countersAnimated = true;
  }

  // Initialize counter animation as soon as page loads
  document.addEventListener("DOMContentLoaded", function () {
    // Start the animation after a small delay to ensure DOM is fully loaded
    setTimeout(animateCounters, 1000);
  });

  // As a fallback, also trigger on scroll near the element
  if (statsSection) {
    window.addEventListener("scroll", function () {
      // Simple check if element is in rough viewport area
      const rect = statsSection.getBoundingClientRect();
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0 && !countersAnimated) {
        animateCounters();
      }
    });
  }

  /**
   * ===============================
   * PIE CHARTS ANIMATION - FIXED
   * ===============================
   */
  const experienceSection = select(".experience");
  let chartsAnimated = false;

  // Function to animate pie charts - IMPROVED IMPLEMENTATION
  // Replace the entire animatePieCharts function in script.js (around line 270)
  // Replace the animatePieCharts function in script.js with this improved version
  // Replace the entire animatePieCharts function in script.js
  function animatePieCharts() {
    if (chartsAnimated) return;

    const progressElements = selectAll(".pie-progress");

    progressElements.forEach((progress, index) => {
      const percentage = parseFloat(progress.getAttribute("data-percentage"));
      const chartPercent = progress.parentNode.querySelector(".chart-percent");

      // Clear any existing styles
      progress.style = "";

      // Set up conic gradient
      setTimeout(() => {
        // Make progress visible
        progress.style.opacity = "1";

        // Animate the fill using CSS conic-gradient
        const startAngle = 0;
        const endAngle = (percentage / 100) * 360;

        progress.style.background = `conic-gradient(
                var(--secondary) ${endAngle}deg, 
                transparent ${endAngle}deg 360deg
            )`;

        // Animate percentage counter
        let current = 0;
        const duration = 1500; // 1.5 seconds
        const interval = 30; // Update every 30ms
        const increment = percentage / (duration / interval);

        const countInterval = setInterval(() => {
          current += increment;
          if (current >= percentage) {
            chartPercent.textContent = `${Math.round(percentage)} %`;
            clearInterval(countInterval);
          } else {
            chartPercent.textContent = `${Math.round(current)} %`;
          }
        }, interval);
      }, index * 300); // Stagger each chart
    });

    chartsAnimated = true;
  }

  // Observer for experience section
  if (experienceSection) {
    const experienceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(animatePieCharts, 300);
            experienceObserver.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    experienceObserver.observe(experienceSection);
  }

  /**
   * ===============================
   * FORM VALIDATION & SUBMISSION
   * ===============================
   */
  const contactForm = select("#contactForm");

  if (contactForm) {
    const submitBtn = select("#submitBtn");

    // Form validation
    const validateInput = (input) => {
      const value = input.value.trim();
      const type = input.type;
      const name = input.name;
      const feedbackEl = input.nextElementSibling.nextElementSibling;

      // Reset feedback
      feedbackEl.style.display = "none";
      input.classList.remove("is-invalid");

      // Required check
      if (input.hasAttribute("required") && value === "") {
        feedbackEl.textContent = "This field is required";
        feedbackEl.style.display = "block";
        input.classList.add("is-invalid");
        return false;
      }

      // Email validation
      if (type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          feedbackEl.textContent = "Please enter a valid email address";
          feedbackEl.style.display = "block";
          input.classList.add("is-invalid");
          return false;
        }
      }

      // Phone validation
      if (name === "phone" && value) {
        // Simple phone validation (allows different formats)
        const phoneRegex =
          /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(value)) {
          feedbackEl.textContent = "Please enter a valid phone number";
          feedbackEl.style.display = "block";
          input.classList.add("is-invalid");
          return false;
        }
      }

      return true;
    };

    // Validate on blur
    contactForm.addEventListener(
      "blur",
      (e) => {
        if (e.target.classList.contains("form-control")) {
          validateInput(e.target);
        }
      },
      true
    );

    // Form submission
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Validate all fields
      const inputs = selectAll(".form-control", contactForm);
      let isValid = true;

      inputs.forEach((input) => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        // Find first invalid input and focus it
        const firstInvalid = select(".is-invalid", contactForm);
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      // Show loading state
      submitBtn.classList.add("loading");

      // Simulated form submission (replace with actual AJAX request)
      setTimeout(() => {
        // Reset form
        contactForm.reset();

        // Show success message (would normally be handled by server response)
        alert("Thank you for your message! We will contact you soon.");

        // Reset button state
        submitBtn.classList.remove("loading");
      }, 2000);
    });
  }

  /**
   * ===============================
   * SMOOTH SCROLL FOR ANCHOR LINKS
   * ===============================
   */
  const scrollToSection = (e) => {
    const href = e.target.getAttribute("href");

    // Only handle internal anchor links
    if (href && href.startsWith("#") && href !== "#") {
      const targetSection = select(href);

      if (targetSection) {
        e.preventDefault();

        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          toggleMenu.setAttribute("aria-expanded", "false");
          const icon = toggleMenu.querySelector("i");
          icon.classList.add("fa-bars");
          icon.classList.remove("fa-times");
        }

        // Calculate offset with navbar height
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition =
          targetSection.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  delegate(document, "click", 'a[href^="#"]:not([href="#"])', scrollToSection);

  /**
   * ===============================
   * HANDLE WINDOW RESIZE & ORIENTATION CHANGE
   * ===============================
   */
  const handleWindowResize = throttle(() => {
    // Close mobile menu on larger screens
    if (
      window.innerWidth > 768 &&
      navMenu &&
      navMenu.classList.contains("active")
    ) {
      navMenu.classList.remove("active");
      toggleMenu.setAttribute("aria-expanded", "false");
      const icon = toggleMenu.querySelector("i");
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-times");
    }
  }, 100);

  // Replace any previous services scrolling code with this
  // Add this to your script.js file inside the DOMContentLoaded event
  const servicesContainer = select(".services-container");
  if (servicesContainer) {
    const grid = select(".services-grid", servicesContainer);
    const cards = selectAll(".service-card", grid);

    // Clone cards for infinite scrolling
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      grid.appendChild(clone);
    });

    // Set up seamless infinite scrolling with CSS animation
    const totalWidth = Array.from(cards).reduce((width, card) => {
      const style = window.getComputedStyle(card);
      const marginRight = parseInt(style.marginRight) || 0;
      return width + card.offsetWidth + marginRight + 30; // card width + margin + gap
    }, 0);

    // Create and inject animation style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes scrollServices {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${totalWidth}px); }
        }
        
        .services-grid {
            animation: scrollServices ${totalWidth / 50}s linear infinite;
        }
        
        .services-grid:hover {
            animation-play-state: paused;
        }
    `;
    document.head.appendChild(styleSheet);

    // Pause on touch for mobile
    grid.addEventListener(
      "touchstart",
      () => {
        grid.style.animationPlayState = "paused";
      },
      { passive: true }
    );

    grid.addEventListener(
      "touchend",
      () => {
        setTimeout(() => {
          grid.style.animationPlayState = "running";
        }, 3000);
      },
      { passive: true }
    );
  }

  // Automatic client logo hover
  const logoGrid = select(".logo-grid");
  if (logoGrid) {
    const logos = selectAll("li", logoGrid);
    let currentIndex = 0;
    let autoHoverInterval;
    let isManuallyHovering = false;

    // Function to simulate hover effect
    const simulateHover = (index) => {
      // Remove any existing hover effects
      logos.forEach((logo) => {
        logo.classList.remove("auto-hover");
      });

      // Add hover to current logo
      logos[index].classList.add("auto-hover");
    };

    // Function to move to next logo
    const moveToNextLogo = () => {
      currentIndex = (currentIndex + 1) % logos.length;
      simulateHover(currentIndex);
    };

    // Start auto hover
    const startAutoHover = () => {
      // Clear any existing interval
      if (autoHoverInterval) {
        clearInterval(autoHoverInterval);
      }

      // Start from the first logo
      currentIndex = 0;
      simulateHover(currentIndex);

      // Start the interval
      autoHoverInterval = setInterval(moveToNextLogo, 2000); // Change every 2 seconds
    };

    // Stop auto hover
    const stopAutoHover = () => {
      if (autoHoverInterval) {
        clearInterval(autoHoverInterval);
        autoHoverInterval = null;
      }
    };

    // Initialize
    startAutoHover();

    // Pause on manual hover
    logos.forEach((logo, index) => {
      logo.addEventListener("mouseenter", () => {
        isManuallyHovering = true;
        stopAutoHover();

        // Apply hover only to this logo
        simulateHover(index);
      });

      logo.addEventListener("mouseleave", () => {
        isManuallyHovering = false;

        // Restart the auto hover sequence after a short delay
        setTimeout(() => {
          if (!isManuallyHovering) {
            startAutoHover();
          }
        }, 500);
      });
    });
  }

  // Add this to your script.js
  // Newsletter Form
  const newsletterForm = select("#newsletterForm");
  const newsletterMessage = select("#newsletterMessage");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get email
      const emailInput = select("#newsletterEmail");
      const email = emailInput.value.trim();

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNewsletterMessage("Please enter a valid email address", "error");
        return;
      }

      // Check consent
      const consentCheckbox = select("#privacyConsent");
      if (!consentCheckbox.checked) {
        showNewsletterMessage("Please accept the privacy policy", "error");
        return;
      }

      // Simulate form submission
      const submitButton = newsletterForm.querySelector(
        'button[type="submit"]'
      );
      submitButton.disabled = true;
      submitButton.innerHTML = "<span>Processing...</span>";

      setTimeout(() => {
        // Reset form
        newsletterForm.reset();

        // Show success message
        showNewsletterMessage(
          "Thank you for subscribing! Please check your email to confirm.",
          "success"
        );

        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<span>Subscribe</span><i class="fas fa-paper-plane"></i>';
      }, 1500);
    });

    // Helper function to show message
    function showNewsletterMessage(message, type) {
      if (newsletterMessage) {
        newsletterMessage.textContent = message;
        newsletterMessage.className = "newsletter-message";
        newsletterMessage.classList.add(type);

        // Clear message after 5 seconds
        setTimeout(() => {
          newsletterMessage.textContent = "";
          newsletterMessage.className = "newsletter-message";
        }, 5000);
      }
    }
  }

  // Add this to your script.js file
  // Live Chat Widget
  // Replace the existing chat widget JavaScript with this MCQ approach
  // Live Chat Widget with MCQ
  const chatWidget = select("#chatWidget");
  const chatButton = select("#chatButton");
  const chatToggle = select("#chatToggle");
  const chatMessages = select("#chatMessages");

  if (chatWidget && chatButton) {
    chatButton.addEventListener("click", () => {
      chatWidget.classList.toggle("open");

      // If opening chat for first time, show initial message with options
      if (chatWidget.classList.contains("open") && !chatWidget.dataset.opened) {
        chatWidget.dataset.opened = "true";

        // Show welcome message with initial options
        setTimeout(() => {
          addSystemMessage(
            "Welcome to Suviksan Technologies! How can we help you today?"
          );
          addOptionsButtons([
            { text: "Learn about services", value: "services" },
            { text: "Request a quote", value: "quote" },
            { text: "Contact information", value: "contact" },
            { text: "Speak with a representative", value: "representative" },
          ]);
        }, 500);
      }
    });

    if (chatToggle) {
      chatToggle.addEventListener("click", () => {
        chatWidget.classList.remove("open");
      });
    }

    // Helper function to add system message
    function addSystemMessage(text) {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const messageHTML = `
            <div class="message system">
                <div class="message-content">
                    <p>${text.replace(/\n/g, "<br>")}</p>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

      chatMessages.insertAdjacentHTML("beforeend", messageHTML);
      scrollToBottom();
    }

    // Helper function to add user message
    function addUserMessage(text) {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const messageHTML = `
            <div class="message user">
                <div class="message-content">
                    <p>${text.replace(/\n/g, "<br>")}</p>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

      chatMessages.insertAdjacentHTML("beforeend", messageHTML);
      scrollToBottom();
    }

    // Helper function to add option buttons
    function addOptionsButtons(options) {
      const optionsContainer = document.createElement("div");
      optionsContainer.className = "chat-options";

      options.forEach((option) => {
        const button = document.createElement("button");
        button.textContent = option.text;
        button.className = "chat-option-btn";
        button.addEventListener("click", () => handleOptionSelect(option));
        optionsContainer.appendChild(button);
      });

      chatMessages.appendChild(optionsContainer);
      scrollToBottom();
    }

    // Handle option selection
    function handleOptionSelect(option) {
      // First, remove all option buttons
      const optionsContainers = chatMessages.querySelectorAll(".chat-options");
      optionsContainers.forEach((container) => container.remove());

      // Show user's selection as a message
      addUserMessage(option.text);

      // Show typing indicator
      showTypingIndicator();

      // Process based on selected option
      setTimeout(() => {
        removeTypingIndicator();

        switch (option.value) {
          case "services":
            addSystemMessage(
              "Suviksan Technologies offers a wide range of IT services. Which one are you interested in?"
            );
            addOptionsButtons([
              { text: "IT Solutions & Consulting", value: "it-solutions" },
              { text: "Cybersecurity", value: "cybersecurity" },
              { text: "Data Analytics", value: "data-analytics" },
              { text: "Cloud Services", value: "cloud" },
            ]);
            break;

          case "quote":
            addSystemMessage(
              "We'd be happy to provide you with a quote. What type of service do you need?"
            );
            addOptionsButtons([
              { text: "Website Development", value: "website" },
              { text: "Software Development", value: "software" },
              { text: "IT Support Services", value: "support" },
              { text: "Other Services", value: "other-services" },
            ]);
            break;

          case "contact":
            addSystemMessage(
              "You can contact us through the following channels:\n\n📞 Phone: +91 7992281130\n📧 Email: info@suviksan.com\n🏢 Office: Unit No.: 1006, ATS Bouquet NOIDA – 201305"
            );
            addOptionsButtons([
              { text: "Request callback", value: "callback" },
              { text: "Back to main menu", value: "main-menu" },
            ]);
            break;

          case "representative":
            addSystemMessage(
              "Would you like to schedule a call with our representative or leave your contact details for us to reach you?"
            );
            addOptionsButtons([
              { text: "Schedule a call", value: "schedule-call" },
              { text: "Leave contact details", value: "leave-details" },
              { text: "Back to main menu", value: "main-menu" },
            ]);
            break;

          case "it-solutions":
          case "cybersecurity":
          case "data-analytics":
          case "cloud":
            addSystemMessage(
              `Our ${option.text} services are tailored to meet your business needs. Would you like more information or to speak with a specialist?`
            );
            addOptionsButtons([
              { text: "More information", value: `more-info-${option.value}` },
              { text: "Speak with specialist", value: "specialist" },
              { text: "Back to services", value: "services" },
            ]);
            break;

          case "website":
          case "software":
          case "support":
          case "other-services":
            addSystemMessage(
              "To provide an accurate quote, we'll need to gather some details about your project. How would you like to proceed?"
            );
            addOptionsButtons([
              { text: "Fill out quote form", value: "quote-form" },
              { text: "Schedule consultation", value: "consultation" },
              { text: "Back to quote options", value: "quote" },
            ]);
            break;

          case "callback":
            addSystemMessage(
              "Please fill out the contact form on our website with your phone number, and our team will call you back within 24 hours."
            );
            addOptionsButtons([
              { text: "Go to contact form", value: "go-to-contact" },
              { text: "Back to main menu", value: "main-menu" },
            ]);
            break;

          case "main-menu":
            addSystemMessage("How else can we help you today?");
            addOptionsButtons([
              { text: "Learn about services", value: "services" },
              { text: "Request a quote", value: "quote" },
              { text: "Contact information", value: "contact" },
              { text: "Speak with a representative", value: "representative" },
            ]);
            break;

          case "schedule-call":
          case "leave-details":
          case "specialist":
          case "quote-form":
          case "consultation":
            addSystemMessage(
              "Please fill out the form below and our team will get back to you shortly:"
            );
            addContactForm();
            break;

          case "go-to-contact":
            addSystemMessage("Redirecting you to our contact form...");
            setTimeout(() => {
              // Scroll to contact section
              const contactSection = document.getElementById("contact");
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" });
                // Close chat after a moment
                setTimeout(() => {
                  chatWidget.classList.remove("open");
                }, 2000);
              }
            }, 1000);
            break;

          default:
            // For any other option, return to main menu
            addSystemMessage(
              "I'm not sure how to help with that. Let's try something else."
            );
            addOptionsButtons([
              { text: "Learn about services", value: "services" },
              { text: "Request a quote", value: "quote" },
              { text: "Contact information", value: "contact" },
              { text: "Speak with a representative", value: "representative" },
            ]);
        }
      }, 1000);
    }

    // Add contact form to chat
    function addContactForm() {
      const formHTML = `
            <div class="chat-form">
                <div class="chat-form-group">
                    <input type="text" placeholder="Your Name" id="chatName" class="chat-form-input">
                </div>
                <div class="chat-form-group">
                    <input type="email" placeholder="Your Email" id="chatEmail" class="chat-form-input">
                </div>
                <div class="chat-form-group">
                    <input type="tel" placeholder="Phone Number" id="chatPhone" class="chat-form-input">
                </div>
                <div class="chat-form-group">
                    <textarea placeholder="Your Message" id="chatMessage" class="chat-form-input" rows="2"></textarea>
                </div>
                <button class="chat-form-submit" id="chatFormSubmit">Submit Request</button>
            </div>
        `;

      chatMessages.insertAdjacentHTML("beforeend", formHTML);

      // Handle form submission
      const submitBtn = select("#chatFormSubmit");
      if (submitBtn) {
        submitBtn.addEventListener("click", () => {
          // Simple validation
          const name = select("#chatName").value;
          const email = select("#chatEmail").value;

          if (!name || !email) {
            alert("Please provide your name and email");
            return;
          }

          // Remove form
          const form = select(".chat-form");
          if (form) form.remove();

          // Show success message
          addSystemMessage(
            "Thank you! Your request has been submitted successfully. Our team will contact you within 24 hours."
          );
          addOptionsButtons([
            { text: "Back to main menu", value: "main-menu" },
            { text: "End chat", value: "end-chat" },
          ]);
        });
      }

      scrollToBottom();
    }

    // Show typing indicator
    function showTypingIndicator() {
      const typingHTML = `
            <div class="message system typing-indicator">
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

      chatMessages.insertAdjacentHTML("beforeend", typingHTML);
      scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
      const indicator = chatMessages.querySelector(".typing-indicator");
      if (indicator) {
        indicator.remove();
      }
    }

    // Scroll chat to bottom
    function scrollToBottom() {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Add this to your script.js
  // Cookie Consent Banner
  const cookieBanner = select("#cookieBanner");
  const cookieAccept = select("#cookieAccept");
  const cookieSettings = select("#cookieSettings");

  if (cookieBanner) {
    // Check if user has already made a choice
    const cookieChoiceMade = localStorage.getItem("cookieChoiceMade");

    // If no choice made yet, show the banner
    if (!cookieChoiceMade) {
      setTimeout(() => {
        cookieBanner.classList.add("show");
      }, 2000); // Show after 2 seconds
    }

    // Handle accept button
    if (cookieAccept) {
      cookieAccept.addEventListener("click", () => {
        localStorage.setItem("cookieChoiceMade", "accepted");
        cookieBanner.classList.remove("show");
      });
    }

    // Handle settings button
    if (cookieSettings) {
      cookieSettings.addEventListener("click", () => {
        // Here you would typically show a modal with cookie settings
        // For this example, we'll just accept all
        localStorage.setItem("cookieChoiceMade", "settings_viewed");
        cookieBanner.classList.remove("show");
        alert(
          "Cookie preferences saved. You can update these settings anytime in the Privacy Policy section."
        );
      });
    }
  }

  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("orientationchange", handleWindowResize);

  // Initial setup
  handleScrollAnimations();
});

// Add this to your script.js
// Cookie Consent Banner
const cookieBanner = select("#cookieBanner");
const cookieAccept = select("#cookieAccept");
const cookieSettings = select("#cookieSettings");

if (cookieBanner) {
  // Check if user has already made a choice
  const cookieChoiceMade = localStorage.getItem("cookieChoiceMade");

  // If no choice made yet, show the banner
  if (!cookieChoiceMade) {
    setTimeout(() => {
      cookieBanner.classList.add("show");
    }, 2000); // Show after 2 seconds
  }

  // Handle accept button
  if (cookieAccept) {
    cookieAccept.addEventListener("click", () => {
      localStorage.setItem("cookieChoiceMade", "accepted");
      cookieBanner.classList.remove("show");
    });
  }

  // Handle settings button
  if (cookieSettings) {
    cookieSettings.addEventListener("click", () => {
      // Here you would typically show a modal with cookie settings
      // For this example, we'll just accept all
      localStorage.setItem("cookieChoiceMade", "settings_viewed");
      cookieBanner.classList.remove("show");
      alert(
        "Cookie preferences saved. You can update these settings anytime in the Privacy Policy section."
      );
    });
  }
}
