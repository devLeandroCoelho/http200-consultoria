/**
 * ============================================
 * HTTP200.TI — Scripts da Landing Page
 * ============================================
 * 
 * Funcionalidades:
 *   - Loading screen
 *   - Navbar fixa com scroll
 *   - Menu mobile responsivo
 *   - Smooth scroll entre seções
 *   - Scroll reveal (animações)
 *   - Contadores animados
 *   - Partículas no hero
 *   - Typing effect
 *   - Botão voltar ao topo
 * 
 * Autor: Leandro Coelho
 * Email: http200.ti@gmail.com
 * Versão: 1.0.0
 * Data: 2026-08-06
 * ============================================
 */

(function () {
    'use strict';

    // --- Loading ---
    const loading = document.getElementById('loading');

    window.addEventListener('load', () => {
        setTimeout(() => {
            loading?.classList.add('hidden');
            document.body.classList.remove('loading');
        }, 400);
    });

    // Fallback: hide loading after 3s regardless
    setTimeout(() => {
        loading?.classList.add('hidden');
        document.body.classList.remove('loading');
    }, 3000);

    // --- Navbar Scroll ---
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleNavbarScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = scrollY;
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // Run on init

    // --- Mobile Menu ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    let menuOpen = false;

    function toggleMenu() {
        menuOpen = !menuOpen;
        navLinks.classList.toggle('active', menuOpen);
        navToggle.classList.toggle('active', menuOpen);
        navToggle.setAttribute('aria-expanded', String(menuOpen));

        // Prevent body scroll when menu is open
        document.body.style.overflow = menuOpen ? 'hidden' : '';

        // Toggle CTA button visibility
        const navCta = document.querySelector('.navbar-cta');
        if (navCta) {
            navCta.classList.toggle('active', menuOpen);
        }
    }

    navToggle?.addEventListener('click', toggleMenu);

    // Close menu on link click
    navLinks?.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (menuOpen) toggleMenu();
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) {
            toggleMenu();
            navToggle?.focus();
        }
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const navbarHeight = navbar?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
                target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
            }
        });
    });

    // --- Active Nav Link ---
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop - 120;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const link = navLinks?.querySelector(`a[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < bottom) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });

    // --- Back to Top ---
    const backToTop = document.getElementById('backToTop');

    function toggleBackToTop() {
        if (window.scrollY > 500) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', toggleBackToTop, { passive: true });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Scroll Reveal (Intersection Observer) ---
    function initScrollReveal() {
        const revealElements = document.querySelectorAll(
            '.service-card, .stat-card, .diff-card, .about-content, .about-stats, .cta-content, .section-header'
        );

        revealElements.forEach(el => el.classList.add('reveal'));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Stagger delay based on position in parent
                        const siblings = Array.from(entry.target.parentElement.children);
                        const siblingIndex = siblings.indexOf(entry.target);
                        const delay = Math.min(siblingIndex * 100, 500);

                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay);

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        revealElements.forEach(el => observer.observe(el));
    }

    // --- Counter Animation ---
    function initCounters() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');

        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        statNumbers.forEach(el => counterObserver.observe(el));
    }

    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'), 10);
        if (isNaN(target)) return;

        // Show the number and suffix when animation starts
        element.classList.add('visible');
        const suffix = element.nextElementSibling;
        if (suffix && suffix.classList.contains('stat-suffix')) {
            suffix.classList.add('visible');
        }

        const duration = 2000; // ms
        const stepTime = 16; // ~60fps
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.floor(eased * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(step);
    }

    // --- Particle Canvas ---
    function initParticles() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];
        let mouseX = 0;
        let mouseY = 0;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.scale(dpr, dpr);
        }

        function createParticles() {
            particles = [];
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);

            // Fewer particles on mobile
            const isMobile = width < 768;
            const count = isMobile ? 30 : 60;

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.4 + 0.1
                });
            }
        }

        function drawParticles() {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);

            ctx.clearRect(0, 0, width, height);

            particles.forEach((p, i) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
                ctx.fill();

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[j].x - p.x;
                    const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(drawParticles);
        }

        // Init
        resize();
        createParticles();
        drawParticles();

        // Throttled resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resize();
                createParticles();
            }, 200);
        });

        // Pause when hero is not visible
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            const heroObserver = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        if (!animationId) drawParticles();
                    } else {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                },
                { threshold: 0 }
            );
            heroObserver.observe(heroSection);
        }
    }

    // --- Typing Effect on Hero Accent ---
    function initTypingEffect() {
        const element = document.getElementById('heroAccent');
        if (!element) return;

        const phrases = [
            'tecnologia ao resultado',
            'inovação ao negócio',
            'eficiência à operação',
            'código à estratégia'
        ];

        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let isPaused = false;

        function type() {
            const currentPhrase = phrases[phraseIndex];

            if (isPaused) {
                setTimeout(type, 50);
                return;
            }

            if (isDeleting) {
                charIndex--;
                element.textContent = currentPhrase.substring(0, charIndex);
            } else {
                charIndex++;
                element.textContent = currentPhrase.substring(0, charIndex);
            }

            let speed = isDeleting ? 40 : 80;

            if (!isDeleting && charIndex === currentPhrase.length) {
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                    isDeleting = true;
                    type();
                }, 2500);
                return;
            }

            if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                speed = 500;
            }

            setTimeout(type, speed);
        }

        // Start typing after initial load animation
        setTimeout(type, 2000);
    }

    // --- Service Card Hover Sound (optional subtle feedback) ---
    function initHoverFeedback() {
        const cards = document.querySelectorAll('.service-card, .diff-card, .stat-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }

    // --- Initialize All ---
    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initCounters();
        initParticles();
        initTypingEffect();
        initHoverFeedback();
    });

})();
