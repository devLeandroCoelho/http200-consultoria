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
            '.service-card, .product-card, .stat-card, .diff-card, .about-content, .about-stats, .cta-content, .section-header'
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
        const cards = document.querySelectorAll('.service-card, .diff-card, .stat-card, .product-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }

    // --- SVG Icons Map ---
    const SERVICE_ICONS = {
        gear: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="12" stroke-dasharray="4 4"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8"/><path d="M16 16l6 6M42 42l6 6M16 48l6-6M42 22l6-6"/><circle cx="32" cy="32" r="4" fill="currentColor"/></svg>',
        code: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="12" width="48" height="40" rx="4"/><path d="M20 24l-6 6 6 6"/><path d="M44 24l6 6-6 6"/><line x1="32" y1="20" x2="28" y2="44"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/><circle cx="12" cy="28" r="1.5" fill="currentColor"/><circle cx="12" cy="36" r="1.5" fill="currentColor"/><circle cx="12" cy="44" r="1.5" fill="currentColor"/></svg>',
        brain: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="32" cy="28" rx="18" ry="16"/><path d="M20 44c0 6 5 12 12 12s12-6 12-12"/><path d="M26 24c0-3 3-6 6-6s6 3 6 6"/><circle cx="26" cy="26" r="2" fill="currentColor"/><circle cx="38" cy="26" r="2" fill="currentColor"/><path d="M28 32c0 2 2 4 4 4s4-2 4-4"/><line x1="18" y1="16" x2="14" y2="10"/><line x1="46" y1="16" x2="50" y2="10"/><circle cx="14" cy="10" r="2" fill="currentColor"/><circle cx="50" cy="10" r="2" fill="currentColor"/><line x1="14" y1="12" x2="14" y2="28"/><line x1="50" y1="12" x2="50" y2="28"/><line x1="12" y1="28" x2="16" y2="28"/><line x1="48" y1="28" x2="52" y2="28"/></svg>',
        link: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="18" height="18" rx="4"/><rect x="38" y="8" width="18" height="18" rx="4"/><rect x="8" y="38" width="18" height="18" rx="4"/><rect x="38" y="38" width="18" height="18" rx="4"/><line x1="26" y1="17" x2="38" y2="17" stroke-dasharray="3 3"/><line x1="26" y1="47" x2="38" y2="47" stroke-dasharray="3 3"/><line x1="17" y1="26" x2="17" y2="38" stroke-dasharray="3 3"/><line x1="47" y1="26" x2="47" y2="38" stroke-dasharray="3 3"/><circle cx="32" cy="32" r="3" fill="currentColor"/></svg>',
        chart: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="48" height="48" rx="4"/><polyline points="16,44 24,32 32,38 40,24 48,28"/><circle cx="24" cy="32" r="2" fill="currentColor"/><circle cx="32" cy="38" r="2" fill="currentColor"/><circle cx="40" cy="24" r="2" fill="currentColor"/><circle cx="48" cy="28" r="2" fill="currentColor"/><line x1="16" y1="16" x2="48" y2="16"/><line x1="16" y1="52" x2="48" y2="52"/></svg>',
        default: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="20"/><path d="M24 32h16M32 24v16"/></svg>'
    };

    // --- Load Services from API ---
    async function loadServices() {
        const container = document.getElementById('services-container');
        if (!container) return;

        try {
            const res = await fetch('/api/servicos');
            const json = await res.json();

            if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#64748b;grid-column:1/-1;">Nenhum serviço encontrado.</p>';
                return;
            }

            // Store services data for modal
            window.__servicesData = json.data;

            container.innerHTML = json.data.map((s, i) => {
                const icon = SERVICE_ICONS[s.icon] || SERVICE_ICONS.default;
                return `
                    <article class="service-card" data-service-index="${i}" role="button" tabindex="0" aria-label="Ver detalhes de ${escapeHtml(s.titulo)}">
                        <div class="service-icon" aria-hidden="true">${icon}</div>
                        <h3 class="service-title">${escapeHtml(s.titulo)}</h3>
                        <p class="service-desc">${escapeHtml(s.descricao)}</p>
                        <span class="service-link">
                            Saiba mais
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </article>
                `;
            }).join('');

            // Add click handlers
            container.querySelectorAll('.service-card').forEach(card => {
                const idx = parseInt(card.dataset.serviceIndex);
                const handler = () => openServiceModal(window.__servicesData[idx]);
                card.addEventListener('click', handler);
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handler();
                    }
                });
            });

            // Re-init hover feedback for new cards
            initHoverFeedback();
        } catch (err) {
            console.error('Erro ao carregar serviços:', err);
            container.innerHTML = '<p style="text-align:center;color:#64748b;grid-column:1/-1;">Erro ao carregar serviços.</p>';
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // --- Service Detail Modal ---
    const serviceModal = document.getElementById('serviceModal');
    const serviceModalTitle = document.getElementById('serviceModalTitle');
    const serviceModalIcon = document.getElementById('serviceModalIcon');
    const serviceModalDesc = document.getElementById('serviceModalDesc');
    const serviceModalClose = document.getElementById('serviceModalClose');

    function openServiceModal(service) {
        serviceModalTitle.textContent = service.titulo;
        serviceModalIcon.innerHTML = SERVICE_ICONS[service.icon] || SERVICE_ICONS.default;
        serviceModalDesc.textContent = service.descricao;
        serviceModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        serviceModalClose.focus();
    }

    function closeServiceModal() {
        serviceModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    serviceModalClose.addEventListener('click', closeServiceModal);
    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) closeServiceModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && serviceModal.classList.contains('visible')) {
            closeServiceModal();
        }
    });

    // --- Load Content from API ---
    async function loadContent() {
        try {
            const res = await fetch('/api/conteudo');
            const json = await res.json();

            if (!json.success || !json.data) return;

            const c = json.data;

            // Hero
            if (c.hero) {
                const heroSubtitle = document.querySelector('.hero-subtitle');
                const heroCta = document.querySelector('.hero-buttons .btn-primary span');

                if (c.hero.subtitulo && heroSubtitle) {
                    heroSubtitle.textContent = c.hero.subtitulo;
                }
                if (c.hero.cta && heroCta) {
                    heroCta.textContent = c.hero.cta;
                }
            }

            // Sobre
            if (c.sobre) {
                const aboutTexts = document.querySelectorAll('.about-text');
                const statNumbers = document.querySelectorAll('.stat-card .stat-number');

                if (c.sobre.texto1 && aboutTexts[0]) {
                    aboutTexts[0].textContent = c.sobre.texto1;
                }
                if (c.sobre.texto2 && aboutTexts[1]) {
                    aboutTexts[1].textContent = c.sobre.texto2;
                }
                if (c.sobre.anos && statNumbers[0]) statNumbers[0].textContent = c.sobre.anos;
                if (c.sobre.projetos && statNumbers[1]) statNumbers[1].textContent = c.sobre.projetos;
                if (c.sobre.satisfacao && statNumbers[2]) statNumbers[2].textContent = c.sobre.satisfacao;
            }

            // Diferenciais
            if (c.diferenciais && Array.isArray(c.diferenciais)) {
                const diffCards = document.querySelectorAll('.diff-card');
                c.diferenciais.forEach((d, i) => {
                    if (diffCards[i]) {
                        const titleEl = diffCards[i].querySelector('h3');
                        const descEl = diffCards[i].querySelector('p');
                        if (d.titulo && titleEl) titleEl.textContent = d.titulo;
                        if (d.descricao && descEl) descEl.textContent = d.descricao;
                    }
                });
            }

            // CTA
            if (c.cta) {
                const ctaSubtitle = document.querySelector('.cta-subtitle');

                if (c.cta.subtitulo && ctaSubtitle) {
                    ctaSubtitle.textContent = c.cta.subtitulo;
                }
            }

            // Config (social links)
            const configRes = await fetch('/api/config');
            const configJson = await configRes.json();
            if (configJson.success && configJson.data) {
                const cfg = configJson.data;
                const linkedinLink = document.querySelector('a[aria-label="LinkedIn"]');
                const githubLink = document.querySelector('a[aria-label="GitHub"]');

                if (cfg.linkedin && linkedinLink) linkedinLink.href = cfg.linkedin;
                if (cfg.github && githubLink) githubLink.href = cfg.github;
            }
        } catch (err) {
            console.error('Erro ao carregar conteúdo:', err);
        }
    }

    // --- Initialize All ---
    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initCounters();
        initParticles();
        initTypingEffect();
        initHoverFeedback();
        loadServices();
        loadContent();
    });

})();
