/* Orion Studio — comportamiento comun a todas las demos.
   Antes esto estaba copiado dentro de cada index.html (7 veces). Cada arreglo
   habia que replicarlo demo por demo. Aca vive una sola vez y se cachea entre
   paginas. Lo unico que sigue viviendo en cada demo es su CSS de identidad,
   que por definicion no se comparte.

   Todo se configura por data-atributos, no hay nada hardcodeado del negocio:
     <form class="lead-form" data-wa="5491133451152">   -> WA del PROSPECTO
   El mail del formulario siempre va a Orion (access_key de Web3Forms en el HTML).

   Uso:  <script src="/webs/assets/orion-demo.js" defer></script>
*/
(function () {
  'use strict';

  /* ---------- Analytics (GoatCounter, sin cookies) ----------
     No cuenta si la pagina esta embebida en un iframe (la agencia muestra
     demos adentro de un telefono 3D: esas visitas no son del prospecto).

     Para excluir un navegador propio NO hace falta tocar este archivo:
     GoatCounter trae su propio interruptor. Abrir cualquier pagina del sitio
     con  #toggle-goatcounter  al final de la URL y ese navegador deja de
     contarse (guarda skipgc en localStorage, por origen: con hacerlo una vez
     quedan cubiertas las 9 demos y la agencia). La misma URL lo reactiva. */
  if (window.self === window.top) {
    var gc = document.createElement('script');
    gc.async = true;
    gc.src = 'https://gc.zgo.at/count.js';
    gc.setAttribute('data-goatcounter', 'https://orionstudio.goatcounter.com/count');
    document.head.appendChild(gc);
  }

  function evento(path, titulo) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: path + ' ' + location.pathname, title: titulo, event: true });
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest
      ? e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href^="tel:"]')
      : null;
    if (!a) return;
    var tipo = (a.getAttribute('href') || '').indexOf('tel:') === 0 ? 'tel-click' : 'wa-click';
    evento(tipo, 'Click de contacto');
  });

  /* ---------- Reveal on scroll + red de seguridad ----------
     Si IntersectionObserver no dispara (navegador raro, pestaña en segundo
     plano, prefers-reduced-motion), a los 2,5 s se muestra todo igual.
     Nada puede quedar invisible para un visitante real. */
  var revelables = [].slice.call(document.querySelectorAll('.reveal, .rv'));
  if (revelables.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.14 });
      revelables.forEach(function (el) { io.observe(el); });
    }
    setTimeout(function () { revelables.forEach(function (el) { el.classList.add('in'); }); }, 2500);
  }

  /* ---------- Nav: fondo solido al scrollear + hamburguesa mobile ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    addEventListener('scroll', function () {
      nav.classList.toggle('solid', scrollY > 40);
    }, { passive: true });

    var burger = document.getElementById('hamburger');
    if (burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', open);
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('menu-open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ---------- Comparador antes/despues arrastrable ----------
     Estructura esperada:
       <div class="ba-wrap"><img class="ba-a"><div class="ba-after"><img class="ba-b"></div>
         <div class="ba-handle"></div></div>
     Se maneja con mouse, touch y teclado (flechas), por accesibilidad. */
  document.querySelectorAll('.ba-wrap').forEach(function (wrap) {
    var after = wrap.querySelector('.ba-after');
    var handle = wrap.querySelector('.ba-handle');
    if (!after || !handle) return;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      after.style.width = pct + '%';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    function desdeEvento(ev) {
      var r = wrap.getBoundingClientRect();
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      set((x / r.width) * 100);
    }

    var arrastrando = false;
    wrap.addEventListener('mousedown', function (e) { arrastrando = true; desdeEvento(e); e.preventDefault(); });
    addEventListener('mousemove', function (e) { if (arrastrando) desdeEvento(e); });
    addEventListener('mouseup', function () { arrastrando = false; });
    wrap.addEventListener('touchstart', function (e) { arrastrando = true; desdeEvento(e); }, { passive: true });
    wrap.addEventListener('touchmove', function (e) { if (arrastrando) desdeEvento(e); }, { passive: true });
    addEventListener('touchend', function () { arrastrando = false; });
    handle.addEventListener('keydown', function (e) {
      var v = parseFloat(handle.getAttribute('aria-valuenow') || '50');
      if (e.key === 'ArrowLeft') { set(v - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(v + 4); e.preventDefault(); }
    });
    set(50);
  });

  /* ---------- Formulario real (Web3Forms) ----------
     El mail SIEMPRE llega a Orion (asunto "[Demo X]"). El boton de WhatsApp
     arma el texto con lo ya tipeado y abre el chat DEL PROSPECTO (data-wa):
     son destinos distintos a proposito. No hay reenvio automatico real:
     WhatsApp no tiene API gratis sin backend, y una key client-side quedaria
     expuesta en el HTML. */
  document.querySelectorAll('form.lead-form').forEach(function (f) {
    var wa = f.getAttribute('data-wa');
    var st = f.querySelector('.lf-status');
    var btn = f.querySelector('button[type="submit"]');

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      var t0 = btn.textContent;
      btn.disabled = true; btn.textContent = 'Enviando…';
      st.className = 'lf-status'; st.textContent = '';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.success) throw new Error('w3f');
          f.reset();
          st.className = 'lf-status ok';
          st.textContent = '¡Listo! Recibimos tu consulta y te contactamos en el día.';
          evento('form-ok', 'Formulario enviado');
        })
        .catch(function () {
          st.className = 'lf-status err';
          st.innerHTML = 'No se pudo enviar. Probá de nuevo o <a href="https://wa.me/' + wa +
            '" target="_blank" rel="noopener">escribinos por WhatsApp</a>.';
        })
        .then(function () { btn.disabled = false; btn.textContent = t0; });
    });

    var waBtn = f.querySelector('.lf-btn.wa');
    if (waBtn && wa) {
      waBtn.addEventListener('click', function () {
        if (!f.reportValidity()) return;
        var g = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
        var texto = 'Hola! Soy ' + g('nombre') + ' (' + g('telefono') + '). ' + g('mensaje');
        evento('wa-lead-click', 'WhatsApp desde formulario');
        window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      });
    }
  });

  /* Expuesto por si una demo necesita contar un evento propio
     (ej. el asistente de turnos de Enjoy Dental). */
  window.orionEvento = evento;
})();
