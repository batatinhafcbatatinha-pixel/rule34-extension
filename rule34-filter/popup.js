(() => {
  const { catalog, normalizeTag, read, write } = Rule34Settings;
  const enabled = document.getElementById('enabled');
  const fieldset = document.getElementById('filters');
  const list = document.getElementById('filter-list');
  const search = document.getElementById('search');
  const status = document.getElementById('status');
  const addForm = document.getElementById('add-filter-form');
  const customTag = document.getElementById('custom-tag');
  const addButton = document.getElementById('add-filter');
  let settings;
  let rows = [];
  function buildRows() {
    list.replaceChildren();
    rows = catalog(settings).map(filter => {
    const label = document.createElement('label');
    label.className = 'filter';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = filter.id;
    const text = document.createElement('span');
    text.textContent = filter.label;
    label.append(checkbox, text);
    list.append(label);
    return { filter, label, checkbox };
    });
  }
  function render() {
    enabled.checked = settings.enabled;
    document.getElementById('power-status').textContent = settings.enabled ? 'Ativada' : 'Desativada · todos os posts visíveis';
    document.getElementById('count').textContent = `${settings.selected.length} selecionados`;
    rows.forEach(row => { row.checkbox.checked = settings.selected.includes(row.filter.id); });
  }
  function searchRows() {
    const query = search.value.trim().toLowerCase().replaceAll('_', ' ');
    let visible = 0;
    rows.forEach(({ filter, label }) => {
      label.hidden = !`${filter.label} ${filter.tags.join(' ')}`.toLowerCase().replaceAll('_', ' ').includes(query);
      if (!label.hidden) visible++;
    });
    document.getElementById('empty').hidden = visible !== 0;
  }
  search.addEventListener('input', searchRows);
  function setBusy(busy) {
    enabled.disabled = fieldset.disabled = customTag.disabled = addButton.disabled = busy;
  }
  async function persist(next) {
    setBusy(true);
    status.className = '';
    status.textContent = 'Salvando…';
    try {
      await write(next);
      settings = next;
      status.textContent = 'Salvo. Aplicado às páginas abertas.';
      return true;
    } catch (error) {
      status.className = 'error';
      status.textContent = 'Não foi possível salvar. Tente novamente.';
      return false;
    } finally {
      render();
      setBusy(false);
    }
  }
  async function save() {
    await persist({ ...settings, enabled: enabled.checked, selected: rows.filter(row => row.checkbox.checked).map(row => row.filter.id) });
  }
  addForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!settings || addButton.disabled) return;
    const tag = normalizeTag(customTag.value);
    if (!tag) {
      status.className = 'error';
      status.textContent = 'Digite uma tag válida, sem vírgulas (até 100 caracteres).';
      customTag.focus();
      return;
    }
    if (catalog(settings).some(filter => filter.tags.includes(tag))) {
      status.className = 'error';
      status.textContent = 'Esse filtro já existe. Use a pesquisa para encontrá-lo.';
      return;
    }
    if (await persist({ ...settings, customFilters: [...settings.customFilters, tag], selected: [...settings.selected, `custom:${tag}`] })) {
      buildRows();
      render();
      customTag.value = '';
      search.value = '';
      searchRows();
      status.textContent = `Filtro "${tag}" adicionado e marcado.`;
      customTag.focus();
    }
  });
  enabled.addEventListener('change', save);
  fieldset.addEventListener('change', save);
  read().then(value => {
    settings = value;
    buildRows();
    render();
    searchRows();
    setBusy(false);
    status.textContent = 'Pronto para filtrar.';
  }).catch(() => {
    status.className = 'error';
    status.textContent = 'Não foi possível carregar. Feche e abra a extensão novamente.';
  });
})();
