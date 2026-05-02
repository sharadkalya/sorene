'use client';

import { useEffect, useRef } from 'react';
import styles from './BrandPage.module.css';

export default function BrandPage() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

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
        cursorRef.current.style.width = '4px';
        cursorRef.current.style.height = '4px';
      }
      if (ringRef.current) {
        ringRef.current.style.width = '48px';
        ringRef.current.style.height = '48px';
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.width = '8px';
        cursorRef.current.style.height = '8px';
      }
      if (ringRef.current) {
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
      }
    };

    const interactiveElements = document.querySelectorAll('a, button');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(el => observer.observe(el));

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      revealEls.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} id="cursor"></div>
      <div ref={ringRef} className={styles.cursorRing} id="cursorRing"></div>

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>SORÈNE</div>
        <div className={styles.navLinks}>
          <a href="#">Drop 01</a>
          <a href="#">Atelier</a>
          <a href="#">Waitlist</a>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroLine}></div>
        <div className={styles.heroLine}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>Drop 01 — Available Now</div>
          <h1 className={styles.heroTitle}>
            Sor<em>è</em>ne
          </h1>
          <p className={styles.heroSub}>Structured Faux Leather · India · 15 Pieces Only</p>
          <div className={styles.heroCta}>
            <a href="#drop" className={styles.btnPrimary}>
              View the Collection
            </a>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <div className={styles.scrollLine}></div>
          <span className={styles.scrollText}>Scroll</span>
        </div>
      </section>

      {/* DROP SECTION */}
      <section className={styles.dropSection} id="drop">
        <div className={styles.dropVisual}>
          <div className={styles.bagRender}>
            <div className={styles.bagHandle}></div>
            <div className={styles.bagFlap}></div>
            <div className={styles.bagClasp}></div>
            <div className={styles.bagBody}>
              <div className={styles.bagStitch}></div>
            </div>
          </div>
          <div className={styles.bagTag}>
            <span className={styles.tagName}>SORÈNE</span>
            <div className={styles.tagLine}></div>
            <span className={styles.tagPrice}>₹7,900</span>
          </div>
          <div className={styles.dropVisualLabel}>The Noir Tote — Drop 01</div>
          <div className={styles.dropVisualNum}>01</div>
        </div>

        <div className={styles.dropInfo}>
          <div className={`${styles.dropLabel} reveal`}>Sorène · Drop 01 · 2026</div>
          <h2 className={`${styles.dropTitle} reveal reveal-delay-1`}>
            The<br />
            <em>Noir</em> Tote
          </h2>
          <p className={`${styles.dropDesc} reveal reveal-delay-2`}>
            Structured PU leather in obsidian black. Gold-cast hardware. Suede-effect tan interior.
            Designed to carry a day's worth — and outlast the trends.
          </p>
          <div className={`${styles.dropMeta} reveal reveal-delay-2`}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Price</span>
              <span className={styles.metaValue}>₹7,900</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Edition</span>
              <span className={styles.metaValue}>15 Only</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Ships</span>
              <span className={styles.metaValue}>Pan-India</span>
            </div>
          </div>
          <div className={`${styles.soldBar} reveal reveal-delay-3`}>
            <span className={styles.soldText}>11 of 15 claimed</span>
            <div className={styles.soldTrack}>
              <div className={styles.soldFill}></div>
            </div>
            <span className={styles.soldText}>4 left</span>
          </div>
          <a href="#" className={`${styles.btnPrimary} reveal reveal-delay-3`}>
            Claim Yours — ₹7,900
          </a>
        </div>
      </section>

      {/* BRAND PILLARS */}
      <section className={styles.strategySection}>
        <div className={`${styles.sectionHeader} reveal`}>
          <div className={styles.sectionLabel}>The Brand</div>
          <h2 className={styles.sectionTitle}>Built on three uncompromising principles</h2>
        </div>
        <div className={styles.pillarsGrid}>
          <div className={`${styles.pillar} reveal`}>
            <div className={styles.pillarNum}>01</div>
            <div className={styles.pillarName}>Radical Scarcity</div>
            <p className={styles.pillarText}>
              Each drop is finite. Once gone, it&apos;s gone. No restocks. No sales. The rarity is
              the product.
            </p>
          </div>
          <div className={`${styles.pillar} reveal reveal-delay-1`}>
            <div className={styles.pillarNum}>02</div>
            <div className={styles.pillarName}>Quiet Presence</div>
            <p className={styles.pillarText}>
              No Instagram noise. No loud campaigns. Those who find us, find us. Discovery is part
              of the experience.
            </p>
          </div>
          <div className={`${styles.pillar} reveal reveal-delay-2`}>
            <div className={styles.pillarNum}>03</div>
            <div className={styles.pillarName}>Deliberate Craft</div>
            <p className={styles.pillarText}>
              Premium PU leather. Brushed gold hardware. Hand-finished interiors. Every detail earns
              its place.
            </p>
          </div>
        </div>
      </section>

      {/* DROP CADENCE */}
      <section className={styles.cadenceSection}>
        <div className={`${styles.sectionHeader} reveal`}>
          <div className={styles.sectionLabel}>The Model</div>
          <h2 className={styles.sectionTitle}>
            Drops, not collections.
            <br />
            Scarcity, not volume.
          </h2>
        </div>
        <div className={styles.dropsTimeline}>
          <div className={`${styles.dropCard} ${styles.active} reveal`}>
            <div className={styles.dcNum}>01</div>
            <div className={styles.dcLabel}>Now Live</div>
            <div className={styles.dcMonth}>March 2026</div>
            <div className={styles.dcUnits}>15</div>
            <div className={styles.dcUnitLabel}>pieces</div>
          </div>
          <div className={`${styles.dropCard} reveal reveal-delay-1`}>
            <div className={styles.dcNum}>02</div>
            <div className={styles.dcLabel}>Coming Soon</div>
            <div className={styles.dcMonth}>June 2026</div>
            <div className={styles.dcUnits}>20</div>
            <div className={styles.dcUnitLabel}>pieces</div>
          </div>
          <div className={`${styles.dropCard} reveal reveal-delay-2`}>
            <div className={styles.dcNum}>03</div>
            <div className={styles.dcLabel}>Planned</div>
            <div className={styles.dcMonth}>Aug 2026</div>
            <div className={styles.dcUnits}>25</div>
            <div className={styles.dcUnitLabel}>pieces</div>
          </div>
          <div className={`${styles.dropCard} reveal reveal-delay-3`}>
            <div className={styles.dcNum}>04</div>
            <div className={styles.dcLabel}>Planned</div>
            <div className={styles.dcMonth}>Oct 2026</div>
            <div className={styles.dcUnits}>35</div>
            <div className={styles.dcUnitLabel}>pieces</div>
          </div>
          <div className={`${styles.dropCard} reveal reveal-delay-3`}>
            <div className={styles.dcNum}>05</div>
            <div className={styles.dcLabel}>Planned</div>
            <div className={styles.dcMonth}>Dec 2026</div>
            <div className={styles.dcUnits}>50</div>
            <div className={styles.dcUnitLabel}>pieces</div>
          </div>
        </div>
      </section>

      {/* PRICING CONTEXT */}
      <section className={styles.pricingSection}>
        <div className={`${styles.pricingLeft} reveal`}>
          <div className={styles.sectionLabel}>Pricing</div>
          <div className={styles.priceTag}>₹7,900</div>
          <div className={styles.priceSub}>Per piece · DTC · No middlemen</div>
          <div className={styles.marginBarWrap}>
            <div className={styles.mbarLabel}>Gross margin</div>
            <div className={styles.mbarTrack}>
              <div className={styles.mbarFill} style={{ width: '65%', background: 'var(--warm)' }}></div>
            </div>
            <div className={styles.mbarVal}>~65%</div>
            <div className={styles.mbarLabel} style={{ marginTop: '24px' }}>
              Material quality
            </div>
            <div className={styles.mbarTrack}>
              <div
                className={styles.mbarFill}
                style={{ width: '88%', background: 'rgba(196,168,130,0.6)' }}
              ></div>
            </div>
            <div className={styles.mbarVal}>Premium PU</div>
          </div>
        </div>
        <div className={`${styles.pricingRight} reveal reveal-delay-1`}>
          <div className={styles.sectionLabel}>Market Context</div>
          <h3 className={styles.gapTitle}>The gap you&apos;re filling</h3>
          <div className={styles.comparisonList}>
            <div className={styles.compItem}>
              <span className={styles.compBrand}>Chanel Classic Flap</span>
              <span className={styles.compPrice}>₹5,80,000+</span>
            </div>
            <div className={styles.compItem}>
              <span className={styles.compBrand}>Polène Numéro Un</span>
              <span className={styles.compPrice}>₹38,000+</span>
            </div>
            <div className={styles.compItem}>
              <span className={styles.compBrand}>Charles & Keith Premium</span>
              <span className={styles.compPrice}>₹8,000–₹15,000</span>
            </div>
            <div className={`${styles.compItem} ${styles.yours}`}>
              <span className={styles.compBrand}>SORÈNE (Your Brand)</span>
              <span className={styles.compPrice}>₹7,900</span>
            </div>
            <div className={styles.compItem}>
              <span className={styles.compBrand}>Mass Faux Leather</span>
              <span className={styles.compPrice}>₹800–₹2,500</span>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className={styles.manifesto}>
        <blockquote className={`${styles.manifestoText} reveal`}>
          &quot;We make <em>very few bags.</em> Each one is finished by hand, shipped in a box that
          feels like a gift, and priced at what it should cost — not what luxury marketing inflates
          it to.&quot;
        </blockquote>
        <p className={`${styles.manifestoAttr} reveal reveal-delay-1`}>— Sorène, Brand Philosophy</p>
        <div className={`reveal reveal-delay-2`} style={{ marginTop: '60px' }}>
          <a href="#" className={`${styles.btnPrimary} ${styles.btnLight}`}>
            Join the Waitlist for Drop 02
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>SORÈNE</div>
        <div className={styles.footerNote}>India · DTC Only · Limited Drops</div>
        <div className={styles.footerTag}>Brand Concept — 2026</div>
      </footer>
    </>
  );
}
