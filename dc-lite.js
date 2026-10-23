// Renderizador mínimo para las pantallas del mockup (sin dependencias)
(function () {
  class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(s) { Object.assign(this.state, s); } }
  const get = (scope, p) => p.trim().split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  const interp = (str, scope) => str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, p) => { const v = get(scope, p); return v == null ? '' : v; });
  function walk(node, scope) {
    if (node.nodeType === 3) { if (node.nodeValue.includes('{{')) node.nodeValue = interp(node.nodeValue, scope); return; }
    if (node.nodeType !== 1) return;
    for (const a of [...node.attributes]) if (a.value.includes('{{')) node.setAttribute(a.name, interp(a.value, scope));
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 1 && ch.tagName === 'TEMPLATE' && ch.dataset.for) {
        const list = get(scope, ch.dataset.for) || [];
        const frag = document.createDocumentFragment();
        list.forEach((it, i) => {
          const c = ch.content.cloneNode(true);
          const s = Object.assign({}, scope, { [ch.dataset.as]: it, $index: i });
          [...c.childNodes].forEach(n => walk(n, s));
          frag.appendChild(c);
        });
        ch.replaceWith(frag);
      } else walk(ch, scope);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const x = document.querySelector('x-dc'), sc = document.querySelector('script[data-dc-script]');
    const props = {};
    try { const d = JSON.parse(sc.getAttribute('data-props') || '{}'); for (const k in d) if (k[0] !== '$') props[k] = d[k].default; } catch (e) {}
    const Component = new Function('DCLogic', sc.textContent + ';return Component;')(DCLogic);
    const vals = new Component(props).renderVals();
    const helmet = x.querySelector('helmet');
    if (helmet) { [...helmet.children].forEach(c => document.head.appendChild(c)); helmet.remove(); }
    walk(x, vals);
    x.style.display = 'block';
  });
})();
