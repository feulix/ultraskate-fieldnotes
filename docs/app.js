'use strict';
(() => {
  const byId = id => document.getElementById(id);
  if (byId('pace-output')) {
    function calculate() {
      const distance = Number(byId('distance').value);
      const stops = Number(byId('stops').value);
      const unit = byId('units').value === 'miles' ? 'mph' : 'km/h';
      const valid = byId('distance').value !== '' && byId('stops').value !== '' &&
        Number.isFinite(distance) && distance > 0 && Number.isFinite(stops) && stops >= 0 && stops < 24;
      byId('pace-output').textContent = valid ?
        `${24 - stops} hours moving · ${(distance / (24 - stops)).toFixed(2)} ${unit} while moving · ${(distance / 24).toFixed(2)} ${unit} overall.` :
        'Enter a positive distance and between 0 and less than 24 hours of stops.';
    }
    ['distance', 'stops', 'units'].forEach(id => byId(id).addEventListener('input', calculate));
    calculate();
  }
  if (!byId('search')) return;
  const index = window.FIELDNOTES_SEARCH || [];
  const fold = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const stopWords = new Set(['a', 'an', 'and', 'are', 'at', 'can', 'do', 'for', 'how', 'i', 'in', 'is', 'it', 'of', 'on', 'the', 'to', 'what', 'which', 'with']);
  const prepared = index.map(item => ({ ...item, searchable: fold(`${item.title} ${item.section} ${item.text}`) }));
  const input = byId('search');
  input.value = new URLSearchParams(location.search).get('q') || '';
  function showResults() {
    const query = input.value.trim();
    const terms = [...new Set(fold(query).split(/[^a-z0-9]+/).filter(term => term && !stopWords.has(term)))];
    const container = byId('search-results');
    container.replaceChildren();
    if (!terms.length) {
      byId('result-count').textContent = 'Enter a topic to search the fieldnotes.';
      return;
    }
    const matches = prepared.filter(item => terms.every(term => item.searchable.includes(term)))
      .map(item => ({ ...item, score: terms.reduce((score, term) => score + (fold(item.title).includes(term) ? 3 : 0) + (fold(item.section).includes(term) ? 2 : 0), 0) }))
      .sort((a, b) => b.score - a.score);
    byId('result-count').textContent = matches.length ? `${matches.length} matching section${matches.length === 1 ? '' : 's'}.` :
      'No matching sections. Try fewer words or browse the topics on the home page.';
    for (const match of matches) {
      const article = document.createElement('article'); article.className = 'result';
      const heading = document.createElement('h2');
      const link = document.createElement('a'); link.href = match.url; link.textContent = match.section; heading.append(link);
      const context = document.createElement('p'); context.className = 'meta'; context.textContent = match.title;
      const excerpt = document.createElement('p');
      const first = Math.min(...terms.map(term => fold(match.text).indexOf(term)).filter(pos => pos >= 0));
      const start = Number.isFinite(first) ? Math.max(0, first - 65) : 0;
      let snippet = (start ? '…' : '') + match.text.slice(start, start + 300) + (match.text.length > start + 300 ? '…' : '');
      const pattern = new RegExp(`(${terms.join('|')})`, 'ig');
      for (const part of snippet.split(pattern)) {
        if (terms.includes(fold(part))) { const mark = document.createElement('mark'); mark.textContent = part; excerpt.append(mark); }
        else excerpt.append(document.createTextNode(part));
      }
      article.append(context, heading, excerpt); container.append(article);
    }
  }
  input.addEventListener('input', () => {
    const next = new URL(location.href);
    if (input.value.trim()) next.searchParams.set('q', input.value.trim()); else next.searchParams.delete('q');
    try { history.replaceState(null, '', next); } catch (_) { /* Some file browsers disable history changes. */ }
    showResults();
  });
  showResults();
})();
