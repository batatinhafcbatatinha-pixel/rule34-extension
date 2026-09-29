const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'rule34-filter');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const flush = () => new Promise(resolve => setTimeout(resolve, 15));

function setup(namespace) {
  let data = {};
  let fail = false;
  const listeners = [];
  const api = {
    runtime: {},
    storage: {
      onChanged: { addListener: fn => listeners.push(fn) },
      local: {}
    }
  };
  for (const method of ['get', 'set']) {
    const operation = value => {
      if (fail) throw new Error('Storage unavailable');
      if (method === 'get') return { [value]: data[value] };
      data = { ...data, ...value };
      for (const fn of listeners) fn({ rule34FilterSettings: { newValue: value.rule34FilterSettings } }, 'local');
    };
    api.storage.local[method] = namespace === 'browser'
      ? async value => operation(value)
      : (value, callback) => {
        try { callback(operation(value)); }
        catch (error) { api.runtime.lastError = error; callback(); delete api.runtime.lastError; }
      };
  }
  const context = vm.createContext({ [namespace]: api, console, setTimeout });
  vm.runInContext(source('settings.js'), context);
  return { context, settings: context.Rule34Settings, fail: () => { fail = true; } };
}

for (const namespace of ['chrome', 'browser']) {
  test(`${namespace}: defaults, persistence, empty selection and errors`, async () => {
    const env = setup(namespace);
    const s = env.settings;
    assert.equal((await s.read()).selected.length, 21);
    await s.write({ enabled: false, selected: [] });
    assert.equal((await s.read()).enabled, false);
    assert.equal((await s.read()).selected.length, 0);
    await s.write({ enabled: true, customFilters: [' My Tag ', 'my_tag', 'dog', '', null], selected: ['custom:my_tag'] });
    const saved = await s.read();
    assert.equal(saved.customFilters.length, 1);
    assert.equal(saved.customFilters[0], 'my_tag');
    assert.equal(s.matches('my_tag', s.blockedTags(saved)), true);
    await s.write({ ...saved, selected: [] });
    assert.equal((await s.read()).customFilters[0], 'my_tag');
    assert.equal(s.matches('my_tag', s.blockedTags(await s.read())), false);
    env.fail();
    await assert.rejects(s.read(), /Storage unavailable/);
    await assert.rejects(s.write({}), /Storage unavailable/);
  });
}

test('matches full tags, aliases and case without substring false positives', () => {
  const { settings: s } = setup('browser');
  const tags = s.blockedTags({ selected: ['futa', 'blacked', 'pee', 'dog'] });
  assert.equal(s.matches('FUTANARI blacked', tags), true);
  assert.equal(s.matches('futa', tags), true);
  assert.equal(s.matches('speed dogma', tags), false);
  assert.equal(s.matches('', tags), false);
});

test('content restores posts, updates open pages and handles dynamic tags', async () => {
  const { context, settings } = setup('browser');
  let observer;
  const makeThumb = title => ({
    title, hidden: false,
    querySelector() { return { getAttribute: name => name === 'title' ? this.title : '' }; },
    classList: { toggle(name, hidden) { this.owner.hidden = hidden; } }
  });
  const thumbs = [makeThumb('dog'), makeThumb('dogma')];
  thumbs.forEach(t => { t.classList.owner = t; });
  context.document = { documentElement: {}, querySelectorAll: () => thumbs };
  context.MutationObserver = class { constructor(fn) { observer = fn; } observe() {} };
  vm.runInContext(source('content.js'), context);
  await flush();
  assert.equal(thumbs[0].hidden, true);
  assert.equal(thumbs[1].hidden, false);
  await settings.write({ enabled: false, selected: ['dog'] });
  await flush();
  assert.equal(thumbs[0].hidden, false);
  await settings.write({ enabled: true, selected: ['dog'] });
  await flush();
  assert.equal(thumbs[0].hidden, true);
  thumbs[1].title = 'dog';
  observer();
  await flush();
  assert.equal(thumbs[1].hidden, true);
  await settings.write({ enabled: true, selected: [] });
  await flush();
  assert.equal(thumbs.some(t => t.hidden), false);
  thumbs[0].title = 'custom_tag';
  await settings.write({ enabled: true, customFilters: ['custom_tag'], selected: ['custom:custom_tag'] });
  await flush();
  assert.equal(thumbs[0].hidden, true);
  await settings.write({ enabled: false, customFilters: ['custom_tag'], selected: ['custom:custom_tag'] });
  await flush();
  assert.equal(thumbs[0].hidden, false);
});

test('popup searches aliases, saves hidden selections and rolls back failed writes', async () => {
  const env = setup('chrome');
  const element = () => ({ children: [], events: {}, value: '',
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    focus() {},
    addEventListener(name, fn) { this.events[name] = fn; }
  });
  const ids = Object.fromEntries(['enabled', 'filters', 'filter-list', 'search', 'status', 'power-status', 'count', 'empty', 'add-filter-form', 'custom-tag', 'add-filter'].map(id => [id, element()]));
  env.context.document = { getElementById: id => ids[id], createElement: element };
  vm.runInContext(source('popup.js'), env.context);
  await flush();
  assert.equal(ids['filter-list'].children.length, 23);
  ids.search.value = 'FUTANARI';
  ids.search.events.input();
  const visible = ids['filter-list'].children.filter(row => !row.hidden);
  assert.equal(visible.length, 1);
  visible[0].children[0].checked = true;
  await ids.filters.events.change();
  assert.equal((await env.settings.read()).selected.length, 22);
  ids.search.value = 'does-not-exist';
  ids.search.events.input();
  assert.equal(ids.empty.hidden, false);
  const submit = () => ids['add-filter-form'].events.submit({ preventDefault() {} });
  ids['custom-tag'].value = '  My Tag  ';
  await submit();
  assert.equal(ids['filter-list'].children.length, 24);
  assert.equal((await env.settings.read()).selected.includes('custom:my_tag'), true);
  assert.equal(ids['custom-tag'].value, '');
  ids.search.value = 'my tag';
  ids.search.events.input();
  assert.equal(ids['filter-list'].children.filter(row => !row.hidden).length, 1);
  for (const duplicate of ['MY_TAG', 'futanari']) {
    ids['custom-tag'].value = duplicate;
    await submit();
    assert.equal(ids.status.textContent.includes('já existe'), true);
    assert.equal(ids['filter-list'].children.length, 24);
  }
  for (const invalid of ['   ', 'tag,other']) {
    ids['custom-tag'].value = invalid;
    await submit();
    assert.equal(ids.status.textContent.includes('tag válida'), true);
  }
  env.fail();
  ids['custom-tag'].value = 'another_tag';
  await submit();
  assert.equal(ids['filter-list'].children.length, 24);
  assert.equal(ids['custom-tag'].value, 'another_tag');
  assert.equal(ids.status.className, 'error');
  ids.enabled.checked = false;
  await ids.enabled.events.change();
  assert.equal(ids.enabled.checked, true);
  assert.equal(ids.status.className, 'error');
});

test('all files referenced by manifest and popup exist', () => {
  const manifest = JSON.parse(source('manifest.json'));
  const files = [...manifest.content_scripts.flatMap(script => [...script.js, ...script.css]), manifest.action.default_popup, ...Object.values(manifest.icons), 'popup.css', 'popup.js'];
  files.forEach(file => assert.ok(fs.existsSync(path.join(root, file)), file));
  assert.deepEqual(manifest.permissions, ['storage']);
});
