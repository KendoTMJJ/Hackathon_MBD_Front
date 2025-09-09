import React from "react";
import { Link } from "react-router-dom";

/** Rutas públicas (public/images) */
const LOGO_FULL = "/images/LOGO.png";
const LOGO_ISO = "/images/LOGO1.png";
const HERO_IMG = "/images/hero.jpg";
const HERO_MP4 = "/images/hero.mp4";
const SAMPLE_1 = "/images/Home.png";
const SAMPLE_2 = "/images/Documentos.png";
const SAMPLE_3 = "/images/Plantillas.png";
const USE_VIDEO_HERO = true;

/* =========================
   Tipos TS
========================= */
type CarouselProps = {
  children: React.ReactNode;
};

type SlideProps = {
  title: string;
  img: string;
  children: React.ReactNode;
  fit?: "cover" | "contain";
};

/* =========================
   Carrusel profesional (compacto)
========================= */
function ProfessionalCarousel({ children }: CarouselProps) {
  const slides = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isTransitioning, setIsTransitioning] = React.useState<boolean>(false);
  const [paused, setPaused] = React.useState<boolean>(false);
  const touchStartX = React.useRef<number>(0);

  const goToSlide = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((index + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };
  const goToPrev = () => goToSlide(currentIndex - 1);
  const goToNext = () => goToSlide(currentIndex + 1);

  // Swipe
  const handleTouchStart = (e: React.TouchEvent) =>
    (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? goToNext() : goToPrev();
  };

  // Teclado
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, isTransitioning]);

  // Autoplay (pausa al hover y si la pestaña no está visible)
  React.useEffect(() => {
    const tick = () => {
      if (!isTransitioning && !paused && document.visibilityState === "visible")
        goToNext();
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [currentIndex, isTransitioning, paused]);

  return (
    <div
      className="pro-carousel"
      role="region"
      aria-roledescription="Carrusel"
      aria-label="Showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pro-carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning
            ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="pro-carousel-slide"
            aria-hidden={index !== currentIndex}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="pro-carousel-controls" aria-hidden="false">
        <button
          className="pro-carousel-control pro-carousel-control-prev"
          onClick={goToPrev}
          aria-label="Slide anterior"
        >
          {/* SVG oculto; usamos chevron CSS */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="pro-carousel-control pro-carousel-control-next"
          onClick={goToNext}
          aria-label="Slide siguiente"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Indicadores (puntos con flecha) */}
      <div
        className="pro-carousel-indicators"
        role="tablist"
        aria-label="Indicadores"
      >
        {slides.map((_, index) => (
          <button
            key={index}
            className={`pro-carousel-indicator ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-current={index === currentIndex}
            aria-label={`Ir al slide ${index + 1}`}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   Slide
========================= */
function Slide({ title, img, children, fit = "cover" }: SlideProps) {
  return (
    <div className="slide">
      <article className="panel panel--hover">
        <div className={`panel__thumb ${fit === "contain" ? "thumb--contain" : ""}`}>
          <img src={img} alt={title} loading="lazy" />
        </div>
        <div className="panel__body">
          <h3>{title}</h3>
          <p className="muted">{children}</p>
        </div>
      </article>
    </div>
  );
}

/* =========================
   Página
========================= */
export default function LandingPage() {
  return (
    <div>
      <style>{`
        :root{
          --primary:#34495E;
          --primary-600:#2b3c4e;
          --primary-300:#4a6582;
          --accent:#7aa2ff;
          --accent-glow:rgba(122, 162, 255, 0.5);
          --bg:#ffffff;
          --panel:#EDF3F8;
          --panel-strong:#E4EEF6;
          --line:#CAD8E6;
          --ink:#34495E;
          --muted:#5d6d7e;
          --muted-light:#8a9aac;
          --shadow:0 6px 18px rgba(31,57,87,.10);
          --shadow-lg:0 10px 28px rgba(31,57,87,.14);
          --transition: all .28s cubic-bezier(.2,.8,.2,1);

          /* Carrusel */
          --carousel-h: clamp(260px, 36vw, 480px);
          --carousel-max: 980px;
        }

        html, body { max-width: 100%; overflow-x: hidden; }
        *{box-sizing:border-box}
        body{
          margin:0;background:var(--bg);color:var(--ink);
          font-family:'Inter',system-ui,Avenir,Helvetica,Arial,sans-serif;line-height:1.6;
          -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
        }
        a{color:inherit;text-decoration:none}
        .wrap{max-width:1200px;margin:0 auto;padding:0 24px;}

        h1,h2,h3,h4,strong{ color:var(--primary);font-weight:800;letter-spacing:-.025em; }
        h1{line-height:1.1}

        .btn{
          display:inline-flex;align-items:center;justify-content:center;
          height:48px;padding:0 28px;border-radius:14px;font-weight:800;letter-spacing:.2px;
          cursor:pointer;background:var(--primary);color:#fff !important;border:1px solid var(--primary);
          box-shadow:0 4px 0 var(--primary-600);transition:var(--transition);
          position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;
        }
        .btn:after{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transition:.5s;
        }
        .btn:hover{background:var(--primary-600);transform:translateY(-2px);
          box-shadow:0 6px 0 var(--primary-600),0 12px 20px rgba(31,57,87,.2);}
        .btn:hover:after{left:100%}
        .btn:active{transform:translateY(0);box-shadow:0 2px 0 var(--primary-600)}
        .btn:focus-visible{outline:2px solid rgba(52,73,94,.55);outline-offset:3px}

        .section{padding:72px 0;position:relative}
        .section .head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:24px}
        .section h2{font-size:32px;line-height:1.2;margin:0;position:relative}
        .section h2:after{
          content:'';position:absolute;bottom:-8px;left:0;width:36px;height:4px;background:var(--primary);
          border-radius:2px;
        }
        .muted{color:var(--muted);line-height:1.6;}

        /* HERO */
        .hero{position:relative;overflow:hidden;padding:32px 0 48px}
        .hero:before{
          content:'';position:absolute;top:-160px;right:-160px;width:360px;height:360px;background:var(--panel);
          border-radius:50%;opacity:.5;z-index:-1;
        }
        .hero:after{
          content:'';position:absolute;bottom:-120px;left:-120px;width:240px;height:240px;background:var(--panel-strong);
          border-radius:50%;opacity:.4;z-index:-1;
        }
        .hero .grid{display:grid;grid-template-columns:1.05fr 1.05fr;gap:40px;align-items:center;padding:24px 0}

        /* ==== TÍTULO con animación azul/blanco (franja blanca fina) ==== */
        .hero h1{
          font-size:3rem;margin:0 0 14px;line-height:1.1;
          background:
            linear-gradient(
              120deg,
              var(--primary) 0%,
              var(--primary) 46%,
              rgba(255,255,255,0.85) 50%,
              var(--primary) 54%,
              var(--primary) 100%
            );
          background-size: 240% 240%;
          -webkit-background-clip:text;
          background-clip:text;
          -webkit-text-fill-color: transparent;
          animation: blueWhiteShift 7.5s ease-in-out infinite;
        }
        @keyframes blueWhiteShift{
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero p{font-size:1.15rem;margin:0 0 26px;color:var(--muted);max-width:90%}

        /* Tarjeta del logo — animaciones (como lo tenías) */
        .brandCard{
          border: 1px solid var(--line);
          border-radius: 24px;
          background: 
            radial-gradient(1200px 600px at 120% -10%, rgba(122,162,255,.16), transparent 40%),
            radial-gradient(900px 500px at -20% 120%, rgba(76,125,210,.10), transparent 40%),
            linear-gradient(135deg, var(--panel-strong) 0%, #E8F1FA 100%);
          box-shadow: 
            0 20px 45px rgba(31,57,87,.12), 
            inset 0 1px 0 rgba(255,255,255,.6),
            0 0 0 1px rgba(255,255,255,.3);
          overflow: hidden;
          position: relative;
          padding: 24px;
          display: grid;
          place-items: center;
          min-height: 360px;
          isolation: isolate;
        }
        .logoFrame{
          position: relative;
          width: min(72%, 380px);
          aspect-ratio: 1/1;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: rgba(255,255,255,.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.85);
          box-shadow:
            0 18px 40px rgba(31,57,87,.16),
            inset 0 0 0 1px rgba(255,255,255,.7),
            0 0 26px rgba(122, 162, 255, 0.18);
          overflow: hidden;
          z-index: 2;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          animation: frameFloat 3s ease-in-out infinite;
        }
        @keyframes frameFloat { 0%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-6px) rotate(.35deg)} 50%{transform:translateY(0) rotate(0)} 75%{transform:translateY(-4px) rotate(-.35deg)} 100%{transform:translateY(0) rotate(0)} }
        .logoFrame::before{
          content:'';position:absolute;inset:-2px;padding:2px;border-radius:24px;
          background:conic-gradient(from 140deg, rgba(122,162,255,.8), rgba(76,125,210,.5), rgba(122,162,255,.4), rgba(76,125,210,.5), rgba(122,162,255,.8));
          -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
          animation:rotateBorder 8s linear infinite;z-index:-1;
        }
        @keyframes rotateBorder{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}
        .logoAura{position:absolute;width:82%;height:82%;border-radius:18px;background:radial-gradient(40% 40% at 50% 50%, rgba(122,162,255,.35), transparent 70%);filter:blur(18px);z-index:0;opacity:.75;animation:auraPulse 2.8s ease-in-out infinite;}
        @keyframes auraPulse{0%,100%{transform:scale(1);opacity:.65}50%{transform:scale(1.06);opacity:.95}}
        .logoIso{position:relative;z-index:3;width:68%;height:68%;object-fit:contain;filter:drop-shadow(0 6px 18px rgba(0,0,0,.18)) brightness(1.06) contrast(1.12);animation:isoDrift 4.5s ease-in-out infinite;}
        @keyframes isoDrift{0%{transform:translateY(0)}33%{transform:translateY(-4px)}66%{transform:translateY(2px)}100%{transform:translateY(0)}}

        /* ==== CARRUSEL (compacto y centrado) ==== */
        #showcase .wrap { max-width: var(--carousel-max); }
        .pro-carousel {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          margin: 0 auto;
          touch-action: pan-y;
          background: linear-gradient(180deg,#f7fbff,#eef5fc);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          padding-bottom: 50px; /* espacio para flecha de los puntos */
        }
        .pro-carousel-track { display: flex; width: 100%; will-change: transform; }
        .pro-carousel-slide { flex: 0 0 100%; min-width: 0; padding: 0; }

        .pro-carousel-controls {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          pointer-events: none;
          z-index: 10;
        }
        .pro-carousel-control {
          pointer-events: auto;
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid var(--line);
          display: grid;
          place-items: center;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 2px rgba(255,255,255,.6);
          backdrop-filter: blur(3px);
        }
        /* Ocultamos SVG, usamos chevrons CSS */
        .pro-carousel-control svg { display: none; }
        .pro-carousel-control::after{
          content:''; position:absolute; width:10px; height:10px;
          border-right:2px solid currentColor; border-bottom:2px solid currentColor;
        }
        .pro-carousel-control-prev::after{ transform: rotate(135deg); }  /* < */
        .pro-carousel-control-next::after{ transform: rotate(-45deg); } /* > */
        .pro-carousel-control:hover { background: var(--primary); color: #fff; transform: scale(1.06); }
        .pro-carousel-control:active { transform: scale(0.98); }

        .pro-carousel-indicators {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 12px;
          z-index: 10;
        }
        .pro-carousel-indicator {
          position: relative; /* para la flecha */
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.95);
          cursor: pointer;
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }
        .pro-carousel-indicator:hover { transform: scale(1.15); }

        /* Efecto activo + flecha superior */
        .pro-carousel-indicator.active::before{
          content:''; position:absolute; inset:-4px; border-radius:50%;
          background: radial-gradient(closest-side, rgba(122,162,255,.35), transparent 70%);
          filter: blur(2px); z-index:-1;
        }
        .pro-carousel-indicator.active,
        .pro-carousel-indicator:hover { background: var(--primary); }
        .pro-carousel-indicator.active::after,
        .pro-carousel-indicator:hover::after{
          content:''; position:absolute; top:-8px; left:50%; transform:translateX(-50%);
          width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:6px solid var(--primary);
        }

        /* Panel/Slide */
        .panel{
          border:1px solid var(--line);border-radius:18px;background:#fff;
          box-shadow:0 10px 26px rgba(31,57,87,.12);
          overflow:hidden;display:grid;grid-template-rows:auto 1fr;
        }
        .panel--hover{transition:var(--transition)}
        .panel--hover:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(31,57,87,.16)}
        .panel__thumb{ height: var(--carousel-h); background:#E6F0FA; display:grid; place-items:center; overflow:hidden; }
        .panel__thumb img{ width:100%;height:100%;object-fit:cover;transition:transform .5s ease;transform:translateZ(0);}
        .panel--hover:hover .panel__thumb img{transform:scale(1.03)}
        .panel__thumb.thumb--contain img{ object-fit:contain; background:#E6F0FA; }

        .panel__body{ padding:18px 22px; background:linear-gradient(180deg,#fff 0%,#F4F8FC 100%); }
        .panel__body h3{margin:0 0 8px;font-size:20px;line-height:1.2;color:var(--primary)}

        /* Footer centrado */
        footer{ padding:56px 0 28px;border-top:1px solid var(--line);color:#5b6470;background:#fff;position:relative;text-align:center }
        footer:before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(to right,transparent,var(--line),transparent)}
        .fgrid{ display:grid;grid-template-columns:repeat(3, minmax(220px,1fr));gap:28px; justify-items:center;text-align:center;max-width:920px;margin:0 auto; }
        .brand{display:flex;gap:12px;align-items:center;margin-bottom:16px;justify-content:center}
        .brand img.logo{height:30px}
        .flist{display:grid;gap:10px}
        .social{display:flex;gap:10px;margin-top:18px;justify-content:center}
        .icon-btn{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#EAF2F9;border:1px solid var(--line);color:#31455a;transition:var(--transition)}
        .icon-btn:hover{background:var(--primary);color:#fff;transform:translateY(-2px)}
        .fbottom{display:flex;align-items:center;justify-content:center;margin-top:34px;padding-top:18px;border-top:1px solid var(--line);color:#8a9aac;font-size:.9rem}

        /* Responsive */
        @media (max-width:1024px){
          .hero .grid{grid-template-columns:1fr;gap:32px}
          .hero h1{font-size:2.4rem}
          .brandCard{min-height:320px}
          .fgrid{max-width:740px}
          .pro-carousel-control{ width:36px; height:36px; }
        }
        @media (max-width:720px){
          .section{padding:56px 0}
          .hero{padding:26px 0 36px}
          .hero h1{font-size:2rem}
          .hero p{font-size:1rem}
          .brandCard{min-height:280px}
          .fgrid{grid-template-columns:1fr;max-width:520px}
          .section .head{flex-direction:column;align-items:flex-start;gap:12px}
          .section h2{font-size:26px}
          .section h2:after{display:none}
          .pro-carousel-controls { padding: 0 6px; }
          .pro-carousel-control { width:34px; height:34px; }
          .pro-carousel-indicators { bottom: 10px; }
        }
      `}</style>

      {/* HERO */}
      <header className="hero">
        <div className="wrap grid hero grid">
          <div>
            <h1>BLACK HAT ARCHETYPE</h1>
            <div className="actions">
              <Link to="/home" className="btn">EMPIEZA AHORA</Link>
            </div>
            <div className="media no-invert">
              {USE_VIDEO_HERO ? (
                <video
                  src={HERO_MP4}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={(e) => {
                    (e.currentTarget as HTMLVideoElement).style.display = "none";
                    const img = document.getElementById("hero-fallback");
                    if (img) img.removeAttribute("data-hidden");
                  }}
                />
              ) : null}
              <img
                id="hero-fallback"
                src={HERO_IMG}
                alt="Hero"
                data-hidden={USE_VIDEO_HERO ? "" : undefined}
                style={{ display: USE_VIDEO_HERO ? "none" : "block" }}
              />
              <style>{`#hero-fallback[data-hidden]{display:none}`}</style>
            </div>
          </div>

          {/* Logo animado */}
          <aside className="brandCard no-invert" aria-label="Black Hat Archetype">
            <div className="logoFrame">
              <span className="logoAura" />
              <img className="logoIso" src={LOGO_ISO} alt="BHA isotipo" />
            </div>
          </aside>
        </div>
      </header>

      {/* POR QUÉ */}
      <section className="section">
        <div className="wrap">
          <div className="head">
            <h2>Como funciona la aplicación?</h2>
          </div>
          <div className="grid-3">
            <article className="feature">
              <h4>Estética de alto impacto</h4>
              <p className="muted">Tipografías grandes, contraste correcto y micro-interacciones.</p>
            </article>
            <article className="feature">
              <h4>Rápido y medible</h4>
              <p className="muted">SEO y analítica para entender tráfico y conversión.</p>
            </article>
            <article className="feature">
              <h4>Integraciones</h4>
              <p className="muted">Email, redes y herramientas sin fricción.</p>
            </article>
          </div>
        </div>
      </section>

      {/* SHOWCASE - CARRUSEL COMPACTO */}
      <section className="section" id="showcase">
        <div className="wrap">
          <div className="head"><h2>Aplicación</h2></div>
          <ProfessionalCarousel>
            <Slide title="Inicio" img={SAMPLE_1} fit="contain">
              Panel principal con acceso rápido a <strong>Diagnóstico de Seguridad</strong>,{" "}
              <strong>Prueba de Penetración</strong>, <strong>Ponderación de Seguridad</strong> y{" "}
              <strong>Análisis Forense</strong>. Acciones directas para cargar
              plantillas o crear diagramas en blanco.
            </Slide>

            {/* MISMA DIMENSIÓN QUE INICIO */}
            <Slide title="Documentos" img={SAMPLE_2} fit="contain">
              Vista de trabajo con tus diagramas guardados: <strong>previsualización</strong>, <strong>fecha</strong>,{" "}
              <strong>nodos y conexiones</strong>. Abre, elimina o crea un <strong>nuevo documento.</strong>
            </Slide>

            {/* MISMA DIMENSIÓN QUE INICIO */}
            <Slide title="Plantillas" img={SAMPLE_3} fit="contain">
              Catálogo de <strong>plantillas reutilizables</strong> con preview
              y métricas. Úsalas para iniciar más rápido o crea una{" "}
              <strong>nueva plantilla</strong> lista para personalizar.
            </Slide>
          </ProfessionalCarousel>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <div className="brand">
                <img className="logo" src={LOGO_FULL} alt="Black Hat Archetype" />
                <div><strong>BLACK HAT ARCHETYPE</strong></div>
              </div>
              <div className="social">
                <a aria-label="Github" className="icon-btn no-invert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5A12 12 0 0 0 0 12.7c0 5.4 3.4 10 8.1 11.6.6.1.8-.3.8-.6v-2c-3.3.8-4-1.6-4-1.6-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.2 1.6 1.2 1 .1.7 2 2.9 1.4.1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.4-5.5-6.2 0-1.4.5-2.5 1.2-3.4-.1-.3-.6-1.7.1-3.5 0 0 1-.3 3.5 1.3a12 12 0 0 1 6.4 0c2.5-1.6 3.5-1.3 3.5-1.3.7 1.8.2 3.2.1 3.5.8.9 1.2 2 1.2 3.4 0 4.8-2.8 5.9-5.6 6.2.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12.2 12.2 0 0 0 24 12.7 12 12 0 0 0 12 .5z" />
                  </svg>
                </a>
                <a aria-label="X" className="icon-btn no-invert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2H21l-6.57 7.5L22 22h-6.99l-4.35-5.72L5.6 22H3l7.07-8.07L2 2h7.07l4.06 5.44L18.244 2zm-1.02 18h1.9L8.3 4H6.33l10.89 16z" />
                  </svg>
                </a>
                <a target="_blank" rel="noreferrer" aria-label="Instagram" className="icon-btn no-invert">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="flist">
              <strong>Sitio</strong>
              <a href="/home">Home</a>
              <a href="/templates">Templates</a>
              <a href="/documents">Documents</a>
            </div>

            <div className="flist">
              <strong>Soporte</strong>
              <a>Privacidad</a>
              <a>Términos</a>
              <a>Ayuda</a>
            </div>
          </div>

          <div className="fbottom">
            <span>© {new Date().getFullYear()} — BLACK HAT ARCHETYPE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
