// Landing Page Scripts
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSmoothScroll();
    initBackToTop();
    initCounterAnimation();
});

function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        btn.style.opacity = window.scrollY > 500 ? '1' : '0';
        btn.style.visibility = window.scrollY > 500 ? 'visible' : 'hidden';
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-counter]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-counter'));
        let count = 0;
        const duration = 2000;
        const step = target / (duration / 16);
        
        const update = () => {
            count += step;
            if (count < target) {
                counter.textContent = Math.floor(count) + '+';
                requestAnimationFrame(update);
            } else {
                counter.textContent = target >= 1000000 ? (target/1000000).toFixed(1) + 'M+' : target + '+';
            }
        };
        
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                update();
                observer.disconnect();
            }
        });
        
        observer.observe(counter);
    });
}
