/**
 * stunning-octo-broccoli — Interactive Demo App
 * 8 modules · code playground · progress tracker
 */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────
  const TOTAL_MODULES = 8;
  const PARTICLE_BURST = 6;
  const PARTICLE_EMOJIS = ['🥦', '⭐', '🌱', '💚', '✨', '🐙'];
  const SPAWN_COOLDOWN_MS = 280;

  let completedModules = new Set(
    JSON.parse(localStorage.getItem('sob_progress') || '[]')
  );
  let lastSpawnAt = 0;
  let particlePool = [];
  let particleLayer = null;
  let modulesBound = false;

  // ─── DOM refs ────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const moduleGrid = $('#moduleGrid');
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const progressStages = $('#progressStages');
  const codeEditor = $('#codeEditor');
  const output = $('#output');
  const runBtn = $('#runBtn');
  const resetBtn = $('#resetBtn');
  const clearOutput = $('#clearOutput');

  // ─── Module Cards ─────────────────────────────────────
  function updateModuleStates() {
    if (!moduleGrid) return;
    moduleGrid.querySelectorAll('.module-card').forEach((card, i) => {
      card.classList.toggle('completed', completedModules.has(i + 1));
    });
  }

  function bindModuleCards() {
    if (!moduleGrid || modulesBound) return;
    moduleGrid.querySelectorAll('.module-card').forEach((card, i) => {
      card.addEventListener('click', () => toggleModule(i + 1));
    });
    modulesBound = true;
  }

  function toggleModule(n) {
    if (completedModules.has(n)) {
      completedModules.delete(n);
    } else {
      completedModules.add(n);
    }
    syncProgress();
    localStorage.setItem('sob_progress', JSON.stringify([...completedModules]));
    updateModuleStates();
  }

  function initParticleLayer() {
    if (particleLayer) return;

    particleLayer = document.createElement('div');
    particleLayer.className = 'particle-layer';
    particleLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(particleLayer);

    const poolSize = PARTICLE_BURST * 8;
    for (let i = 0; i < poolSize; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.dataset.free = '1';
      particle.addEventListener('animationend', () => {
        particle.classList.remove('is-flying');
        particle.dataset.free = '1';
      });
      particleLayer.appendChild(particle);
      particlePool.push(particle);
    }
  }

  function acquireParticle() {
    return particlePool.find((el) => el.dataset.free === '1');
  }

  function spawnParticlesAt(x, y) {
    const now = performance.now();
    if (now - lastSpawnAt < SPAWN_COOLDOWN_MS) return;
    lastSpawnAt = now;

    if (!particleLayer) return;

    for (let i = 0; i < PARTICLE_BURST; i++) {
      const particle = acquireParticle();
      if (!particle) break;

      particle.dataset.free = '0';
      particle.textContent = PARTICLE_EMOJIS[i];
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.fontSize = `${14 + Math.random() * 12}px`;
      particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 180}px`);
      particle.style.setProperty('--dy', `${(Math.random() - 0.5) * 180}px`);

      particle.classList.remove('is-flying');
      void particle.offsetWidth;
      particle.classList.add('is-flying');
    }
  }

  function shouldSkipParticleClick(target) {
    if (!(target instanceof Element)) return true;
    return Boolean(
      target.closest('textarea, input, select, [contenteditable="true"], .particle-layer')
    );
  }

  function bindGlobalParticles() {
    document.addEventListener('click', (e) => {
      if (shouldSkipParticleClick(e.target)) return;
      spawnParticlesAt(e.clientX, e.clientY);
    });
  }

  // ─── Progress ─────────────────────────────────────────
  function syncProgress() {
    const count = completedModules.size;
    const pct = (count / TOTAL_MODULES) * 100;

    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${count} / ${TOTAL_MODULES} 模块完成`;

    if (progressStages) {
      const stages = progressStages.querySelectorAll('span');
      stages.forEach((s, i) => {
        const threshold = (i / (stages.length - 1)) * TOTAL_MODULES;
        s.classList.toggle('active', count >= threshold);
      });
    }
  }

  // ─── Code Playground ──────────────────────────────────
  function runCode() {
    if (!codeEditor || !output) return;
    const code = codeEditor.value;
    output.className = 'output-area';
    output.textContent = '';

    const originalLog = console.log;
    const originalError = console.error;
    const lines = [];

    console.log = (...args) => {
      lines.push(args.map(String).join(' '));
    };
    console.error = (...args) => {
      lines.push('[Error] ' + args.map(String).join(' '));
    };

    try {
      const fn = new Function(code);
      fn();
      output.textContent = lines.join('\n') || '(代码执行完成，无输出)';
    } catch (err) {
      output.className = 'output-area error';
      output.textContent = `❌ ${err.name}: ${err.message}`;
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  }

  function resetCode() {
    if (!codeEditor) return;
    codeEditor.value = codeEditor.defaultValue;
    if (output) {
      output.className = 'output-area';
      output.textContent = '点击"运行代码"查看结果...';
    }
  }

  // ─── Donation ticker (simulated) ──────────────────────
  let donationAmount = 0;
  const DONATION_GOAL = 50000;

  function tickDonation() {
    donationAmount += Math.floor(Math.random() * 5) + 1;
    if (donationAmount > DONATION_GOAL * 0.4) donationAmount = DONATION_GOAL * 0.4;

    const fill = $('.donation-fill');
    const info = $('.donation-info span:first-child');
    if (fill) fill.style.width = `${(donationAmount / DONATION_GOAL) * 100}%`;
    if (info) info.textContent = `¥${donationAmount.toLocaleString()}`;
  }

  // ─── Mobile menu ──────────────────────────────────────
  function setupMobileMenu() {
    const toggle = $('.mobile-toggle');
    const nav = $('.nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const visible = nav.style.display === 'flex';
      nav.style.display = visible ? 'none' : 'flex';
      if (!visible) {
        nav.style.cssText = `
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          padding: 20px 24px;
          gap: 16px;
        `;
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────
  function init() {
    initParticleLayer();
    bindGlobalParticles();
    bindModuleCards();
    updateModuleStates();
    syncProgress();

    if (runBtn) runBtn.addEventListener('click', runCode);
    if (resetBtn) resetBtn.addEventListener('click', resetCode);
    if (clearOutput) clearOutput.addEventListener('click', () => {
      if (output) {
        output.className = 'output-area';
        output.textContent = '';
      }
    });

    if (codeEditor) {
      codeEditor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          runCode();
        }
      });
    }

    setupMobileMenu();

    setInterval(tickDonation, 8000);
    tickDonation();

    console.log('🐙🥦 stunning-octo-broccoli demo ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
