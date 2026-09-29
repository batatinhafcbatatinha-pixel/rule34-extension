(() => {
  const { filters, read, write } = Rule34Settings;
  const enabled = document.getElementById('enabled');
  const fieldset = document.getElementById('filters');
  const list = document.getElementById('filter-list');
  const search = document.getElementById('search');
  const status = document.getElementById('status');
  let settings;
  const rows = filters.map(filter => {
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
  function render() {
    enabled.checked = settings.enabled;
    document.getElementById('power-status').textContent = settings.enabled ? 'Ativada' : 'Desativada · todos os posts visíveis';
    document.getElementById('count').textContent = `${settings.selected.length} selecionados`;
    rows.forEach(row => { row.checkbox.checked = settings.selected.includes(row.filter.id); });
  }
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase().replaceAll('_', ' ');
    let visible = 0;
    rows.forEach(({ filter, label }) => {
      label.hidden = !`${filter.label} ${filter.tags.join(' ')}`.toLowerCase().replaceAll('_', ' ').includes(query);
      if (!label.hidden) visible++;
    });
    document.getElementById('empty').hidden = visible !== 0;
  });
  async function save() {
    const next = { enabled: enabled.checked, selected: rows.filter(row => row.checkbox.checked).map(row => row.filter.id) };
    enabled.disabled = fieldset.disabled = true;
    status.className = '';
    status.textContent = 'Salvando…';
    try {
      await write(next);
      settings = next;
      status.textContent = 'Salvo. Aplicado às páginas abertas.';
    } catch (error) {
      status.className = 'error';
      status.textContent = 'Não foi possível salvar. Tente novamente.';
    } finally {
      render();
      enabled.disabled = fieldset.disabled = false;
    }
  }
  enabled.addEventListener('change', save);
  fieldset.addEventListener('change', save);
  read().then(value => {
    settings = value;
    render();
    enabled.disabled = fieldset.disabled = false;
    status.textContent = 'Pronto para filtrar.';
  }).catch(() => {
    status.className = 'error';
    status.textContent = 'Não foi possível carregar. Feche e abra a extensão novamente.';
  });
})();
