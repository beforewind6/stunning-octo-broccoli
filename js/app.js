/**
 * stunning-octo-broccoli — Interactive Demo App
 * 8 modules · code playground · progress tracker
 */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────
  const TOTAL_MODULES = 8;
  let completedModules = new Set(
    JSON.parse(localStorage.getItem('sob_progress') || '[]')
  );

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
  function renderModules() {
    if (!moduleGrid) return;
    const cards = moduleGrid.querySelectorAll('.module-card');
    cards.forEach((card, i) => {
      const modNum = i + 1;
      if (completedModules.has(modNum)) {
        card.classList.add('completed');
      } else {
        card.classList.remove('completed');
      }
      card.addEventListener('click', () => toggleModule(modNum));
    });
  }

  function toggleModule(n) {
    if (completedModules.has(n)) {
      completedModules.delete(n);
    } else {
      completedModules.add(n);
      spawnParticles(n);
    }
    syncProgress();
    localStorage.setItem('sob_progress', JSON.stringify([...completedModules]));
    renderModules();
  }

  function spawnParticles(n) {
    const card = document.querySelector(`[data-module="${n}"]`);
    if (!card) return;
    const emojis = ['🥦', '⭐', '🌱', '💚', '✨', '🐙'];
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('span');
      particle.textContent = emojis[i];
      particle.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 999;
        font-size: ${14 + Math.random() * 16}px;
        left: ${card.getBoundingClientRect().left + card.offsetWidth / 2}px;
        top: ${card.getBoundingClientRect().top + card.offsetHeight / 2}px;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 1;
      `;
      document.body.appendChild(particle);

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => particle.remove(), 900);
    }
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
        if (count >= threshold) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
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
    renderModules();
    syncProgress();

    if (runBtn) runBtn.addEventListener('click', runCode);
    if (resetBtn) resetBtn.addEventListener('click', resetCode);
    if (clearOutput) clearOutput.addEventListener('click', () => {
      if (output) {
        output.className = 'output-area';
        output.textContent = '';
      }
    });

    // Keyboard shortcut: Ctrl/Cmd+Enter to run
    if (codeEditor) {
      codeEditor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          runCode();
        }
      });
    }

    setupMobileMenu();

    // Slow tick for donation counter
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
