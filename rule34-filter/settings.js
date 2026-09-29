/* Compartilhado pelo popup e pelo script da página. */
globalThis.Rule34Settings = (() => {
  const defaults = [
    'gay', 'fart', 'farting', 'peeing', 'pee', 'dog', 'dragon', 'tail',
    'fluffy', 'furry', 'solo_male', 'gore', 'beheaded', 'decapitated',
    'blood', 'vomit', 'urine', 'piss', 'fat_male', 'dark-skinned_male', 'male_only'
  ];
  const filters = [
    { id: 'futa', label: 'Futa', tags: ['futa', 'futanari'], selected: false },
    { id: 'blacked', label: 'Blacked', tags: ['blacked'], selected: false },
    ...defaults.map(tag => ({ id: tag, label: tag.replaceAll('_', ' '), tags: [tag], selected: true }))
  ];
  const key = 'rule34FilterSettings';
  const hasBrowser = typeof browser !== 'undefined';
  const api = hasBrowser ? browser : chrome;
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
      selected: Array.isArray(source.selected)
        ? filters.filter(filter => source.selected.includes(filter.id)).map(filter => filter.id)
        : filters.filter(filter => filter.selected).map(filter => filter.id)
    };
  }
  function call(method, value) {
    if (hasBrowser) return api.storage.local[method](value);
    return new Promise((resolve, reject) => {
      api.storage.local[method](value, result => {
        const error = api.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }
  async function read() { return normalize((await call('get', key))[key]); }
  async function write(value) { await call('set', { [key]: normalize(value) }); }
  function onChanged(listener) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && Object.prototype.hasOwnProperty.call(changes, key)) listener(changes[key].newValue);
    });
  }
  function blockedTags(settings) {
    return new Set(filters.filter(filter => settings.selected.includes(filter.id)).flatMap(filter => filter.tags));
  }
  function matches(text, tags) {
    return text.toLowerCase().split(/\s+/).some(tag => tags.has(tag));
  }
  return { filters, normalize, read, write, onChanged, blockedTags, matches };
})();
