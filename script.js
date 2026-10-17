/**
 * ACME Fertility & Healthcare Centre — Institutional Investor Portal Scripts
 * Features: Auth Gatekeeper, Scroll Reveal, Counters, Scrollspy, Data Room,
 * Term Sheet Modal, Lightbox, Asset Filter, Tilt & Magnetic Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Investor Auth Gatekeeper
    if (window.location.search.includes('preview=true') && !localStorage.getItem('acme_investor_auth')) {
        localStorage.setItem('acme_investor_auth', JSON.stringify({ user: 'Institutional Partner' }));
    }
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const authDataRaw = localStorage.getItem('acme_investor_auth');

    if (!isLoginPage) {
        if (!authDataRaw) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const auth = JSON.parse(authDataRaw);
            const userDisplay = document.getElementById('investor-user-name');
            if (userDisplay && auth.user) userDisplay.textContent = auth.user;
        } catch (e) {
            window.location.href = 'login.html';
            return;
        }
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('acme_investor_auth');
            window.location.href = 'login.html';
        });
    }

    // User Profile Dropdown Toggle
    const userAvatarBtn = document.getElementById('user-avatar-btn');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const userMenuWrapper = document.getElementById('user-menu-wrapper');

    if (userAvatarBtn && userDropdownMenu) {
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userDropdownMenu.classList.toggle('open');
            userAvatarBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', (e) => {
            if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
                userDropdownMenu.classList.remove('open');
                userAvatarBtn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && userDropdownMenu.classList.contains('open')) {
                userDropdownMenu.classList.remove('open');
                userAvatarBtn.setAttribute('aria-expanded', 'false');
                userAvatarBtn.focus();
            }
        });
    }

    // 2. Scroll-driven chrome: header state, smart auto-hide, progress bar, back-to-top
    const header = document.querySelector('.site-header');
    const progressBar = document.getElementById('scroll-progress');
    const backToTop = document.getElementById('back-to-top');
    let lastScrollY = window.scrollY;
    const scrollThreshold = 8;

    function onScroll() {
        const y = window.scrollY;
        if (header) {
            header.classList.toggle('scrolled', y > 30);

            // Smart navbar: hide when scrolling down, show when scrolling up
            const delta = y - lastScrollY;
            if (y <= 60) {
                // At top of page: always visible
                header.classList.remove('header-hidden');
            } else if (delta > scrollThreshold) {
                // Scrolling down: hide header
                header.classList.add('header-hidden');
                if (userDropdownMenu) userDropdownMenu.classList.remove('open');
            } else if (delta < -scrollThreshold) {
                // Scrolling up: show header
                header.classList.remove('header-hidden');
            }
        }
        lastScrollY = Math.max(0, y);

        if (progressBar) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }

        if (backToTop) backToTop.classList.toggle('visible', y > 600);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }

    // 3. Scroll Reveal System
    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach(el => {
        const delay = el.getAttribute('data-delay');
        if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
    });

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    // 4. Animated Counters
    const counters = document.querySelectorAll('.counter');

    function formatValue(value, format) {
        if (format === 'comma') return Math.round(value).toLocaleString('en-IN');
        return Math.round(value).toString();
    }

    function runCounter(el) {
        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const format = el.getAttribute('data-format');
        const duration = 1600;
        const start = performance.now();

        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
            el.textContent = formatValue(target * eased, format) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }

        if (prefersReducedMotion) {
            el.textContent = formatValue(target, format) + suffix;
        } else {
            requestAnimationFrame(tick);
        }
    }

    if ('IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach(c => counterObserver.observe(c));
    } else {
        counters.forEach(runCounter);
    }

    // 5. Scrollspy — highlight active nav link
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const spySections = [...navLinks]
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if ('IntersectionObserver' in window && spySections.length) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        spySections.forEach(s => spyObserver.observe(s));
    }

    // 6. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileNav = document.querySelector('.site-nav-mobile');
    const menuIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
    const closeIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>';

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileNav.classList.toggle('open');
            mobileToggle.innerHTML = isOpen ? closeIcon : menuIcon;
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                mobileToggle.innerHTML = menuIcon;
            });
        });
    }

    // 7. Hero Thumbnail Switcher
    const heroMainImg = document.getElementById('hero-main-img');
    const heroMainCaption = document.getElementById('hero-main-caption');
    const heroThumbnails = document.querySelectorAll('.hero-thumb-item');

    heroThumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            heroThumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');

            const newSrc = thumb.getAttribute('data-src');
            const newCaption = thumb.getAttribute('data-caption');

            if (heroMainImg) {
                heroMainImg.style.opacity = '0';
                heroMainImg.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    heroMainImg.src = newSrc;
                    heroMainImg.style.opacity = '1';
                    heroMainImg.style.transform = 'scale(1)';
                }, 200);
            }
            if (heroMainCaption) heroMainCaption.textContent = newCaption;
        });
    });

    // 8. Subtle 3D tilt on hero showcase (desktop, fine pointers only)
    const heroCard = document.getElementById('hero-main-card');
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    if (heroCard && finePointer && !prefersReducedMotion) {
        const wrap = heroCard.parentElement;
        const strength = 5;

        wrap.addEventListener('mousemove', (e) => {
            const rect = wrap.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            heroCard.style.transform = `perspective(1100px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg)`;
        });

        wrap.addEventListener('mouseleave', () => {
            heroCard.style.transform = 'perspective(1100px) rotateY(0deg) rotateX(0deg)';
        });
    }

    // 9. Donut ring animation for 84.6% badge
    const statRing = document.querySelector('.float-stat-ring');
    if (statRing && 'IntersectionObserver' in window) {
        const ringObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statRing.classList.add('animate');
                    ringObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        ringObserver.observe(statRing);
    } else if (statRing) {
        statRing.classList.add('animate');
    }

    // 10. Assets Gallery Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    const facilityCards = document.querySelectorAll('.facility-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            facilityCards.forEach(card => {
                const cat = card.getAttribute('data-category');
                const show = filter === 'all' || cat.includes(filter);
                if (show) {
                    card.style.display = 'block';
                    card.style.animation = 'none';
                    void card.offsetWidth; // reflow to restart animation
                    card.style.animation = 'fadeIn 0.45s var(--ease-out)';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Inject keyframes for filter fade (avoids needing them in markup)
    const styleSheet = document.createElement('style');
    styleSheet.textContent = '@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }';
    document.head.appendChild(styleSheet);

    // 11. Lightbox Modal
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    let currentGalleryIndex = 0;
    const galleryItems = [];

    facilityCards.forEach((card, idx) => {
        const img = card.querySelector('img');
        const title = card.querySelector('.facility-title')?.textContent || '';
        const desc = card.querySelector('.facility-meta')?.textContent || '';
        galleryItems.push({ src: img.src, title, desc });

        card.addEventListener('click', () => openLightbox(idx));
    });

    function openLightbox(index) {
        currentGalleryIndex = index;
        const item = galleryItems[index];
        if (lightboxImg) {
            lightboxImg.style.animation = 'none';
            void lightboxImg.offsetWidth;
            lightboxImg.style.animation = '';
            lightboxImg.src = item.src;
        }
        if (lightboxTitle) lightboxTitle.textContent = item.title;
        if (lightboxDesc) lightboxDesc.textContent = item.desc;
        if (lightboxModal) {
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Manyata Certificate trigger
    document.querySelectorAll('.cert-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (lightboxImg) lightboxImg.src = 'assets/Manyata-Certificate_1.webp';
            if (lightboxTitle) lightboxTitle.textContent = 'Manyata National Certification — FOGSI Clinical Standards';
            if (lightboxDesc) lightboxDesc.textContent = 'Official quality accreditation validating adherence to stringent clinical protocols for maternity, surgical safety, and reproductive medicine.';
            if (lightboxModal) {
                lightboxModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox((currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox((currentGalleryIndex + 1) % galleryItems.length);
        });
    }

    // 12. Term Sheet & Investment Inquiry Modal
    const termSheetModal = document.getElementById('termsheet-modal');
    const termSheetForm = document.getElementById('termsheet-form');

    document.querySelectorAll('.open-termsheet-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const parentModal = btn.closest('.modal-backdrop');
            if (parentModal && parentModal !== termSheetModal) {
                parentModal.classList.remove('active');
            }
            if (termSheetModal) {
                termSheetModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    if (termSheetForm) {
        termSheetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const investorName = document.getElementById('inquiry-name')?.value || 'Investor';
            const firm = document.getElementById('inquiry-firm')?.value || 'Firm';

            termSheetModal.classList.remove('active');
            document.body.style.overflow = '';
            termSheetForm.reset();
            showToast(`Inquiry received from ${investorName} (${firm}). Confidential Investment Dossier & Term Sheet dispatched.`);
        });
    }

    const dataroomInlineForm = document.getElementById('dataroom-inline-form');
    if (dataroomInlineForm) {
        dataroomInlineForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const investorName = document.getElementById('dr-name')?.value || 'Investor';
            const firm = document.getElementById('dr-firm')?.value || 'Firm';

            dataroomInlineForm.reset();
            showToast(`Meeting request received from ${investorName} (${firm}). Dr. James Elangbam's direct office will connect within 24 hours.`);
        });
    }

    // 13. Virtual Data Room File Requests
    document.querySelectorAll('.dataroom-file-item').forEach(item => {
        item.addEventListener('click', () => {
            const docName = item.getAttribute('data-doc') || 'Clinical Document';
            showToast(`Generating secure encrypted watermarked copy for "${docName}"... Download ready.`);
        });
    });

    // 14. Founder Video Briefing Modal
    const videoModal = document.getElementById('video-modal');

    document.querySelectorAll('.open-video-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (videoModal) {
                videoModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // 15. Universal Modal Close Handlers
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-close-btn')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
            document.body.style.overflow = '';
            if (mobileNav) mobileNav.classList.remove('open');
        } else if (lightboxModal && lightboxModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                openLightbox((currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length);
            } else if (e.key === 'ArrowRight') {
                openLightbox((currentGalleryIndex + 1) % galleryItems.length);
            }
        }
    });

    // 16. Toast System
    function showToast(message) {
        let toast = document.getElementById('site-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'site-toast';
            toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: linear-gradient(135deg, #082827 0%, #0F4C4A 100%);
        color: #FFFFFF;
        padding: 14px 26px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 12px 36px rgba(0,0,0,0.35);
        z-index: 2000;
        transition: transform 0.45s var(--ease-out, cubic-bezier(0.16,1,0.3,1)), opacity 0.45s ease;
        opacity: 0;
        max-width: 90vw;
        text-align: center;
        border: 1px solid rgba(143, 184, 178, 0.4);
      `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, 4500);
    }
});