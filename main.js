/* ============================================
   main.js — IA CashFlow
   Nav, animations scroll, SWARM-CORP mini demo
   ============================================ */

(function () {
  'use strict';

  // --- Nav mobile toggle ---
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    // Fermer le menu au clic sur un lien
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });
  }

  // --- Nav background on scroll ---
  var nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        nav.style.borderBottomColor = 'rgba(0,212,170,0.15)';
      } else {
        nav.style.borderBottomColor = 'rgba(255,255,255,0.08)';
      }
    });
  }

  // --- Intersection Observer pour animations ---
  var animated = document.querySelectorAll('[data-animate]');
  if (animated.length > 0 && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    animated.forEach(function (el) { obs.observe(el); });
  } else {
    animated.forEach(function (el) { el.classList.add('visible'); });
  }

  // --- SWARM-CORP Mini Demo ---
  var swarmBtn = document.getElementById('swarm-start');
  var swarmTimer = document.getElementById('swarm-timer');
  var swarmTimerBar = document.getElementById('swarm-timer-bar');
  var agentEls = document.querySelectorAll('.swarm-agent');
  var demoRunning = false;

  function runSwarmDemo() {
    if (demoRunning) return;
    demoRunning = true;

    // Reset
    agentEls.forEach(function (el) {
      el.classList.remove('active', 'done');
      el.querySelector('.sa-fill').style.width = '0%';
    });
    if (swarmTimerBar) swarmTimerBar.style.width = '0%';

    var speeds = [1.8, 2.2, 2.0, 1.5, 1.4, 1.2, 1.1, 1.3];
    var progress = [0, 0, 0, 0, 0, 0, 0, 0];
    var done = [false, false, false, false, false, false, false, false];
    var startTime = Date.now();
    var totalDone = 0;

    // Activate agents with stagger
    agentEls.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('active');
      }, i * 200);
    });

    var interval = setInterval(function () {
      var elapsed = (Date.now() - startTime) / 1000;
      totalDone = 0;

      for (var i = 0; i < 8; i++) {
        if (done[i]) { totalDone++; continue; }
        progress[i] = Math.min(100, progress[i] + speeds[i] * (0.7 + Math.random() * 0.6));
        agentEls[i].querySelector('.sa-fill').style.width = Math.round(progress[i]) + '%';

        if (progress[i] >= 100 && !done[i]) {
          done[i] = true;
          totalDone++;
          agentEls[i].classList.remove('active');
          agentEls[i].classList.add('done');
        }
      }

      // Timer
      var m = Math.floor(elapsed / 60);
      var s = Math.floor(elapsed % 60);
      if (swarmTimer) swarmTimer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (swarmTimerBar) swarmTimerBar.style.width = Math.min(100, (totalDone / 8) * 100) + '%';

      if (totalDone >= 8) {
        clearInterval(interval);
        demoRunning = false;
        if (swarmTimer) swarmTimer.textContent = m + ':' + (s < 10 ? '0' : '') + s + ' — livre !';
      }
    }, 80);
  }

  if (swarmBtn) {
    swarmBtn.addEventListener('click', runSwarmDemo);
  }

  // Auto-start swarm demo on scroll
  var swarmSection = document.getElementById('swarm');
  if (swarmSection && 'IntersectionObserver' in window) {
    var swarmObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !demoRunning) {
        runSwarmDemo();
        swarmObs.disconnect();
      }
    }, { threshold: 0.4 });
    swarmObs.observe(swarmSection);
  }

})();
