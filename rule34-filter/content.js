(() => {
  const { normalize, read, onChanged, blockedTags, matches } = Rule34Settings;
  let settings = normalize();
  let ready = false;
  let revision = 0;
  let pending = false;
  const hiddenClass = 'rule34-filter-hidden';
  function applyFilters() {
    pending = false;
    if (!ready) return;
    const tags = blockedTags(settings);
    document.querySelectorAll('span.thumb').forEach(thumb => {
      const img = thumb.querySelector('img');
      const text = img ? `${img.getAttribute('title') || ''} ${img.getAttribute('alt') || ''}` : '';
      thumb.classList.toggle(hiddenClass, settings.enabled && matches(text, tags));
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
