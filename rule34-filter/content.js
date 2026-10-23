(() => {
  const { normalize, read, onChanged, blockedTags, matches } = Rule34Settings;
  let settings = normalize();
  let ready = false;
  let revision = 0;
  let pending = false;
  const hiddenClass = 'rule34-filter-hidden';
  const hiddenElements = new Set();
  function applyFilters() {
    pending = false;
    if (!ready) return;
    const tags = blockedTags(settings);
    const targets = new Map();
    document.querySelectorAll('.thumb img, img.preview').forEach(img => {
      const target = img.closest('.thumb') || img.closest('a') || img;
      const text = `${img.getAttribute('title') || ''} ${img.getAttribute('alt') || ''}`;
      targets.set(target, (targets.get(target) || false) || matches(text, tags));
    });
    hiddenElements.forEach(element => {
      if (!targets.has(element)) {
        element.classList.remove(hiddenClass);
        hiddenElements.delete(element);
      }
    });
    targets.forEach((blocked, target) => {
      const hidden = settings.enabled && blocked;
      target.classList.toggle(hiddenClass, hidden);
      if (hidden) hiddenElements.add(target);
      else hiddenElements.delete(target);
    });
  }
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(applyFilters, 0);
  }
  onChanged(value => {
    revision++;
    settings = normalize(value);
    ready = true;
    schedule();
  });
  const initialRevision = revision;
  read().then(value => {
    if (revision === initialRevision) settings = value;
    ready = true;
    schedule();
  }).catch(error => {
    console.warn('Rule34 Filter: não foi possível carregar as preferências.', error);
  });
  new MutationObserver(schedule).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['title', 'alt']
  });
})();
