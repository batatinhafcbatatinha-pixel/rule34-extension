(() => {
  const { normalize, read, onChanged, blockedTags, matches } = Rule34Settings;
  let settings = normalize();
  let ready = false;
  let revision = 0;
  let pending = false;
  const hiddenClass = 'rule34-filter-hidden';
  const hiddenElements = new Map();
  function restore(element) {
    const original = hiddenElements.get(element);
    if (original) {
      if (original.value) element.style.setProperty('display', original.value, original.priority);
      else element.style.removeProperty('display');
    }
    element.classList.remove(hiddenClass);
    hiddenElements.delete(element);
  }
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
    hiddenElements.forEach((original, element) => {
      if (!targets.has(element)) {
        restore(element);
      }
    });
    targets.forEach((blocked, target) => {
      const hidden = settings.enabled && blocked;
      if (hidden) {
        if (!hiddenElements.has(target)) hiddenElements.set(target, {
          value: target.style.getPropertyValue('display'),
          priority: target.style.getPropertyPriority('display')
        });
        target.classList.toggle(hiddenClass, true);
        if (target.style.getPropertyValue('display') !== 'none' || target.style.getPropertyPriority('display') !== 'important') {
          target.style.setProperty('display', 'none', 'important');
        }
      } else if (hiddenElements.has(target)) restore(target);
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
    attributeFilter: ['title', 'alt', 'style']
  });
})();
