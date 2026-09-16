// Zijmenu logic — GrowKit-app-stijl: hover-uitklap (desktop) + handmatige toggle + mobiel slide-in.
(function () {
  function init() {
    const nav = document.getElementById('side-nav');
    const toggle = document.getElementById('side-toggle');
    if (!nav || !toggle) return;

    // handmatige toggle
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      document.body.classList.toggle('side-open', open);
      try { localStorage.setItem('sidenav-open', open ? '1' : '0'); } catch (e) {}
    });

    // staat bewaren tussen paginaladen
    try {
      if (localStorage.getItem('sidenav-open') === '1') {
        nav.classList.add('open');
        document.body.classList.add('side-open');
      }
    } catch (e) {}

    // mobiel: klik buiten het menu sluit het
    if (window.matchMedia('(max-width: 899px)').matches) {
      document.addEventListener('click', function (e) {
        if (document.body.classList.contains('side-open')
            && !nav.contains(e.target) && !toggle.contains(e.target)) {
          nav.classList.remove('open');
          document.body.classList.remove('side-open');
          try { localStorage.setItem('sidenav-open', '0'); } catch (err) {}
        }
      });
    }

    // Escape sluit ook
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        document.body.classList.remove('side-open');
        try { localStorage.setItem('sidenav-open', '0'); } catch (err) {}
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
