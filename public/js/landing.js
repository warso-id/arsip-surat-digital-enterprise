// ============================================
// Landing Page JavaScript - Fixed
// ============================================

(function() {
    'use strict';

    // Hide loading screen after page loads
    window.addEventListener('load', function() {
        setTimeout(function() {
            var loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(function() {
                    if (loadingScreen.parentNode) {
                        loadingScreen.parentNode.removeChild(loadingScreen);
                    }
                }, 500);
            }
        }, 800);
    });

    // Initialize after DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initNavbar();
        initAOS();
        initCountAnimation();
        initBackToTop();
        initSmoothScroll();
        console.log('Landing page initialized successfully!');
    });

    // Navbar scroll effect
    function initNavbar() {
        var navbar = document.getElementById('mainNav');
        if (!navbar) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
                navbar.classList.remove('navbar-transparent');
            } else {
                navbar.classList.remove('navbar-scrolled');
                navbar.classList.add('navbar-transparent');
            }
        });
    }

    // Initialize AOS
    function initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                mirror: false
            });
        }
    }

    // Count animation
    function initCountAnimation() {
        var statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length === 0) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var target = entry.target;
                    var countTo = parseInt(target.getAttribute('data-count')) || 0;
                    animateCount(target, 0, countTo, 2000);
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function(number) {
            observer.observe(number);
        });
    }

    function animateCount(element, start, end, duration) {
        var range = end - start;
        var increment = range / (duration / 16);
        var current = start;

        function animate() {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end.toLocaleString('id-ID');
                return;
            }
            element.textContent = Math.floor(current).toLocaleString('id-ID');
            requestAnimationFrame(animate);
        }

        animate();
    }

    // Back to top
    function initBackToTop() {
        var backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTop.style.display = 'block';
            } else {
                backToTop.style.display = 'none';
            }
        });

        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Smooth scroll
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                var target = document.querySelector(href);
                if (target) {
                    var offset = 80;
                    var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            });
        });
    }

    // Contact form
    window.submitContactForm = function(event) {
        event.preventDefault();
        var btn = event.target.querySelector('button[type="submit"]');
        var originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';

        setTimeout(function() {
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Terkirim!';
            btn.classList.add('btn-success');
            event.target.reset();
            setTimeout(function() {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
            }, 3000);
        }, 2000);

        return false;
    };

})();
