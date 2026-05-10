'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BrandPage.module.css';

export default function BrandPage() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    document.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top = my + 'px';
      }
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Hover effect for interactive elements
    const handleMouseEnter = () => {
      if (cursorRef.current) {
        cursorRef.current.style.width = '3px';
        cursorRef.current.style.height = '3px';
      }
      if (ringRef.current) {
        ringRef.current.style.width = '42px';
        ringRef.current.style.height = '42px';
        ringRef.current.classList.add('opacity-60');
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.width = '5px';
        cursorRef.current.style.height = '5px';
      }
      if (ringRef.current) {
        ringRef.current.style.width = '26px';
        ringRef.current.style.height = '26px';
        ringRef.current.classList.remove('opacity-60');
      }
    };

    const interactiveElements = document.querySelectorAll('a, button, input, textarea');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Nav scroll effect
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle(styles.scrolled, window.scrollY > 80);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Scroll reveal
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.12 }
    );
    
    const revealEls = document.querySelectorAll(`.${styles.reveal}`);
    revealEls.forEach(el => observer.observe(el));

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      revealEls.forEach(el => observer.unobserve(el));
    };
  }, []);

  const handleInterestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    alert(`Thank you, ${name}! We've sent you an exclusive discount code to your email. Watch your inbox for updates on our next drop.`);
    e.currentTarget.reset();
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Thank you for reaching out. We will get back to you soon.');
    e.currentTarget.reset();
  };

  return (
    <>
      <div ref={cursorRef} className={`${styles.cur} bg-primary`} id="cur"></div>
      <div ref={ringRef} className={`${styles.curR} border border-primary/30`} id="curR"></div>

      {/* NAV */}
      <nav ref={navRef} className={`${styles.nav} bg-base-100/92 border-b border-base-300/40`} id="nav">
        <div className={`${styles.navLogo} text-base-content`} onClick={() => scrollToSection('hero')}>SORvÈNE</div>
        <div className={styles.navLinks}>
          <a onClick={() => scrollToSection('about')} className="text-base-content/80 hover:text-primary">About</a>
          <a onClick={() => scrollToSection('contact')} className="text-base-content/80 hover:text-primary">Contact</a>
          <a href="https://www.instagram.com/sorvenestudio" target="_blank" rel="noopener noreferrer" className="text-base-content/80 hover:text-primary">Instagram</a>
        </div>
      </nav>

      {/* SPLIT HERO */}
      <section id="hero" className={`${styles.splitHero} bg-base-100`}>
        <div className={styles.heroVideoSide}>
          <video className={styles.videoFrame} autoPlay muted loop playsInline>
            <source src="/assets/videos/SV_2.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className={`${styles.heroContentSide} bg-base-100`}>
          <div className={`${styles.heroLabel} text-secondary`}>SORvÈNE</div>
          <h1 className={`${styles.heroTitle} text-base-content`}>Structured <em className="text-primary">Intentionality</em></h1>
          <p className={`${styles.heroText} text-base-content/70`}>
            Structured bags made with <span className="text-primary font-normal">uncompromising intention</span>. Premium leather, hand-finished, priced fairly. We make very few. Once gone, they&apos;re gone.
          </p>
          <div className={styles.heroCta}>
            <a href="https://www.instagram.com/sorvenestudio" target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnDark} bg-base-content text-base-100 border-base-content hover:bg-primary hover:border-primary`}>
              Follow Us
            </a>
          </div>
        </div>
      </section>

      <div className={`${styles.divider} bg-base-300`}></div>

      {/* ABOUT */}
      <section id="about" className={styles.aboutSection}>
        <div className={`${styles.secLabel} ${styles.reveal} text-secondary`}>Our Story</div>
        <h2 className={`${styles.secTitle} ${styles.reveal} text-base-content`}>Handbags made <em className="text-primary">the way</em> they should be</h2>
        
        <div className={styles.aboutGrid}>
          <div className={styles.aboutText}>
            <p className={`${styles.reveal} text-base-content/70`}>
              SORvÈNE exists in defiance of excess. We believe true luxury is <span className="text-primary font-normal">not loud</span>. It&apos;s quiet, intentional, and earned through craft.
            </p>
            
            <p className={`${styles.reveal} ${styles.d1} text-base-content/70`}>
              Every bag is crafted from premium full-grain leather and finished by hand. Hardware is antique brass. Interiors are designed for longevity. We make very few pieces, and they&apos;re priced at what they should cost — not what marketing inflates them to.
            </p>
            
            <p className={`${styles.reveal} ${styles.d2} text-base-content/70`}>
              This is not a collection. These are <span className="text-primary font-normal">drops</span>. Finite. Once gone, they&apos;re gone. The rarity is part of the product.
            </p>
          </div>

          <div className={styles.aboutStats}>
            <div className={`${styles.stat} ${styles.reveal} border-l-primary`}>
              <div className={`${styles.statNum} text-primary`}>Drop 01</div>
              <div className={`${styles.statLabel} text-base-content/60`}>Live Now</div>
            </div>
            <div className={`${styles.stat} ${styles.reveal} ${styles.d1} border-l-primary`}>
              <div className={`${styles.statNum} text-primary`}>100%</div>
              <div className={`${styles.statLabel} text-base-content/60`}>Premium Leather</div>
            </div>
            <div className={`${styles.stat} ${styles.reveal} ${styles.d2} border-l-primary`}>
              <div className={`${styles.statNum} text-primary`}>DTC</div>
              <div className={`${styles.statLabel} text-base-content/60`}>Direct to Consumer</div>
            </div>
          </div>
        </div>
      </section>

      <div className={`${styles.divider} bg-base-300`}></div>

      {/* VALUES */}
      <section id="values" className={styles.valuesSection}>
        <div className={`${styles.secLabel} ${styles.reveal} text-secondary`}>How We Work</div>
        <h2 className={`${styles.secTitle} ${styles.reveal} text-base-content`}>Three <em className="text-primary">uncompromising</em> principles</h2>
        
        <div className={styles.valuesGrid}>
          <div className={`${styles.valueCard} ${styles.reveal} border-primary/15 hover:border-primary/40`}>
            <div className={`${styles.vcCardTitle} text-base-content`}>Radical Scarcity</div>
            <div className={`${styles.vcText} text-base-content/70`}>
              Each drop is finite. Once gone, it&apos;s gone. No restocks. No sales. We never inflate value with false scarcity — our scarcity is real.
            </div>
          </div>
          <div className={`${styles.valueCard} ${styles.reveal} ${styles.d1} border-primary/15 hover:border-primary/40`}>
            <div className={`${styles.vcCardTitle} text-base-content`}>Quiet Presence</div>
            <div className={`${styles.vcText} text-base-content/70`}>
              No Instagram noise. No loud campaigns. Those who find us, find us. Discovery is part of the experience. We let the work speak.
            </div>
          </div>
          <div className={`${styles.valueCard} ${styles.reveal} ${styles.d2} border-primary/15 hover:border-primary/40`}>
            <div className={`${styles.vcCardTitle} text-base-content`}>Deliberate Craft</div>
            <div className={`${styles.vcText} text-base-content/70`}>
              Every detail earns its place. Premium leather. Antique hardware. Hand-finished. We don&apos;t compromise, and we don&apos;t cut corners.
            </div>
          </div>
          <div className={`${styles.valueCard} ${styles.reveal} ${styles.d3} border-primary/15 hover:border-primary/40`}>
            <div className={`${styles.vcCardTitle} text-base-content`}>Fair Pricing</div>
            <div className={`${styles.vcText} text-base-content/70`}>
              DTC eliminates middlemen. You pay what the bag is worth — what materials and labor cost. No luxury markup. No artificial inflation.
            </div>
          </div>
        </div>
      </section>

      <div className={`${styles.divider} bg-base-300`}></div>

      {/* STAY TUNED */}
      <section id="stay-tuned" className={`${styles.stayTuned} bg-base-200 border-t-base-300 border-b-base-300`}>
        <div className={styles.stContainer}>
          <div className={`${styles.stLabel} ${styles.reveal} text-secondary`}>Next Drop Coming</div>
          <h2 className={`${styles.stTitle} ${styles.reveal} text-base-content`}>Stay <em className="text-primary">Tuned</em></h2>
          <p className={`${styles.stSubtitle} ${styles.reveal} ${styles.d1} text-base-content/70`}>
            Get exclusive updates about upcoming launches, early access to new drops, and an exclusive discount code sent directly to you.
          </p>
          
          <div className={`${styles.stOffer} ${styles.reveal} ${styles.d2} border-primary`}>
            <span className={`${styles.offerBadge} text-secondary`}>Exclusive for Early Supporters</span>
            <div className={`${styles.offerText} text-base-content`}>Special Discount</div>
            <div className={`${styles.offerSub} text-base-content/60`}>Code sent to your email</div>
          </div>

          <form className={`${styles.stForm} ${styles.reveal} ${styles.d2}`} id="interestForm" onSubmit={handleInterestSubmit}>
            <div className={styles.stFormGroup}>
              <label htmlFor="int-name" className="text-base-content/70">Your Name</label>
              <input type="text" id="int-name" name="name" required className="bg-base-100 border-primary/20 text-base-content focus:border-primary" />
            </div>
            <div className={styles.stFormGroup}>
              <label htmlFor="int-email" className="text-base-content/70">Email</label>
              <input type="email" id="int-email" name="email" required className="bg-base-100 border-primary/20 text-base-content focus:border-primary" />
            </div>
          </form>

          <button type="submit" form="interestForm" className={`${styles.btnInterest} ${styles.reveal} ${styles.d3} bg-base-content text-base-100 border-base-content hover:bg-primary hover:border-primary`}>
            Show Interest
          </button>
        </div>
      </section>

      <div className={`${styles.divider} bg-base-300`}></div>

      {/* CONTACT */}
      <section id="contact" className={styles.contactSection}>
        <div className={`${styles.secLabel} ${styles.reveal} text-secondary`}>Get in Touch</div>
        <h2 className={`${styles.secTitle} ${styles.reveal} text-base-content`}>Have questions? We&apos;re <em className="text-primary">listening</em></h2>
        
        <div className={styles.contactSplit}>
          <div>
            <div className={styles.contactInfo}>
              <h3 className="text-base-content">Email</h3>
              <div className={`${styles.contactDetail} text-base-content/70`}>
                <a href="mailto:hello@sorvene.in" className="text-primary hover:text-base-content">hello@sorvene.in</a>
              </div>
              
              <h3 className="text-base-content">Location</h3>
              <div className={`${styles.contactDetail} text-base-content/70`}>
                Maharashtra, India<br />Direct-to-Consumer Only
              </div>
              
              <h3 className="text-base-content">Follow</h3>
              <div className={`${styles.contactDetail} text-base-content/70`}>
                <a href="https://www.instagram.com/sorvenestudio" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-base-content">Instagram</a><br />
                <a href="https://www.pinterest.com/sorvene/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-base-content">Pinterest</a>
              </div>
            </div>
          </div>

          <form className={styles.contactForm} id="contactForm" onSubmit={handleContactSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className="text-base-content/70">Your Name</label>
              <input type="text" id="name" name="name" required className="border-primary/20 text-base-content focus:border-primary" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className="text-base-content/70">Email</label>
              <input type="email" id="email" name="email" required className="border-primary/20 text-base-content focus:border-primary" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="message" className="text-base-content/70">Message</label>
              <textarea id="message" name="message" required className="border-primary/20 text-base-content focus:border-primary"></textarea>
            </div>
            <button type="submit" className={`${styles.btn} ${styles.btnDark} ${styles.submitBtn} bg-base-content text-base-100 border-base-content hover:bg-primary hover:border-primary`}>
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`${styles.footer} border-t-base-300 text-base-content/70`}>
        <div className={`${styles.fLogo} text-base-content`}>SORvÈNE</div>
        <div className={styles.fSocial}>
          <a href="https://www.instagram.com/sorvenestudio" target="_blank" rel="noopener noreferrer" className="text-base-content/80 hover:text-primary">Instagram</a>
          <a href="https://www.pinterest.com/sorvene/" target="_blank" rel="noopener noreferrer" className="text-base-content/80 hover:text-primary">Pinterest</a>
        </div>
        <div>2026</div>
      </footer>
    </>
  );
}
