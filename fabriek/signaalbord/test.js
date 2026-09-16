// Fase 0-signaalbord — gedragstest (node vm)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function stubEnv() {
  const store = {};
  const ls = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  return {
    localStorage: ls,
    window: { localStorage: ls },
    document: {
      _els: {},
      getElementById(id) {
        if (!this._els[id]) {
          const listeners = {};
          const el = {
            id, listeners, value: '', textContent: '', innerHTML: '',
            classList: { add() {}, remove() {} },
            addEventListener(ev, fn) { listeners[ev] = fn; },
            appendChild() {}, reset() { this.value = '' },
          };
          this._els[id] = el;
        }
        return this._els[id];
      },
      createElement() { return { textContent: '', className: '' }; },
    },
    alert: () => {},
  };
}

function loadScript() {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('geen inline script gevonden');
  const env = stubEnv();
  const ctx = { ...env, console, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(m[1], ctx);
  return { ctx, env };
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' — ' + e.message); }
}

const assert = (c, msg) => { if (!c) throw new Error(msg); };

test('paginatitel noemt signaalbord', () => {
  assert(/signaalbord/i.test(html), 'titel bevat geen "signaalbord"');
});

test('heeft één-regel input voor gebruik', () => {
  assert(/ik gebruik dit voor/i.test(html), 'geen input-label "ik gebruik dit voor"');
  assert(html.includes('id="gebruik-input"'), 'geen gebruik-input element');
});

test('toont ingestie: repo-link Grow-Kit', () => {
  assert(html.includes('github.com/parvenuprompting/Grow-Kit'), 'repo-link ontbreekt');
});

test('toont X-account @GrowKitHarnas', () => {
  assert(html.includes('GrowKitHarnas'), 'X-account ontbreekt');
});

test('versturen slaat signaal op in localStorage', () => {
  const { ctx, env } = loadScript();
  const input = env.document.getElementById('gebruik-input');
  const form = env.document.getElementById('signaal-form');
  input.value = 'test-taak-xyz';
  form.listeners.submit({ preventDefault() {} });
  const raw = env.localStorage.getItem('fase0_signalen');
  assert(raw, 'niets opgeslagen');
  const lijst = JSON.parse(raw);
  assert(lijst.length === 1, 'verkeerd aantal signalen: ' + lijst.length);
  assert(lijst[0].gebruik === 'test-taak-xyz', 'tekst niet bewaard');
  assert(lijst[0].bron === 'fabriek-bord', 'bron ontbreekt');
});

test('leeg veld wordt geweigerd', () => {
  const { ctx, env } = loadScript();
  const input = env.document.getElementById('gebruik-input');
  const form = env.document.getElementById('signaal-form');
  input.value = '   ';
  form.listeners.submit({ preventDefault() {} });
  assert(env.localStorage.getItem('fase0_signalen') === null, 'leeg signaal mag niet opgeslagen worden');
});

test('na verzenden is input leeg en bevestiging zichtbaar', () => {
  const { ctx, env } = loadScript();
  const input = env.document.getElementById('gebruik-input');
  const form = env.document.getElementById('signaal-form');
  input.value = 'dag 2, nog steeds bezig';
  form.listeners.submit({ preventDefault() {} });
  assert(input.value === '', 'input niet geleegd');
  const bevestiging = env.document.getElementById('bevestiging');
  assert(bevestiging && /dank/i.test(bevestiging.textContent), 'bevestiging niet getoond');
});

test('bestaande signalen worden geladen en geteld', () => {
  const { ctx, env } = loadScript();
  env.localStorage.setItem('fase0_signalen', JSON.stringify([{ gebruik: 'x', gebruik: 'bestaand', bron: 'fabriek-bord', ts: '2026-09-11' }]));
  const input = env.document.getElementById('gebruik-input');
  const form = env.document.getElementById('signaal-form');
  input.value = 'nieuw';
  form.listeners.submit({ preventDefault() {} });
  const lijst = JSON.parse(env.localStorage.getItem('fase0_signalen'));
  assert(lijst.length === 2, 'bestaand signaal verloren: lengte ' + lijst.length);
});

console.log('\n' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed ? 1 : 0);