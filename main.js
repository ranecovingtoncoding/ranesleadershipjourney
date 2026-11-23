import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { shelves, starterEntries } from './seed.js';

const app = document.querySelector('#app');
const runtimeConfig = window.LIBRARY_CONFIG || {};
const config = {
  url: runtimeConfig.supabaseUrl,
  key: runtimeConfig.supabaseAnonKey,
  ownerEmail: (runtimeConfig.ownerEmail || '').trim().toLowerCase()
};

const defaultSettings = {
  id: true,
  library_title: 'Rane’s Library of Better Questions',
  library_subtitle: 'A collection of the stories, mistakes, ideas, and books I want to keep returning to long after Trailblazers ends.',
  exterior_image_path: null,
  paper_texture_path: null,
  shelf_texture_path: null
};

const state = {
  supabase: null,
  user: null,
  settings: { ...defaultSettings },
  entries: [],
  urls: {},
  editingId: null
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function paragraphs(value) {
  const text = escapeHtml(value || '');
  return text.split(/\n\s*\n/).filter(Boolean).map(function (item) {
    return '<p>' + item + '</p>';
  }).join('');
}

function cssUrl(path) {
  if (!path || !state.urls[path]) return '';
  return 'url(&quot;' + escapeHtml(state.urls[path]) + '&quot;)';
}

function showNotice(message, type) {
  const existing = document.querySelector('.notice');
  if (existing) existing.remove();
  const notice = document.createElement('div');
  notice.className = 'notice' + (type === 'error' ? ' error' : '');
  notice.textContent = message;
  document.body.appendChild(notice);
  window.setTimeout(function () {
    notice.remove();
  }, 4600);
}

function renderSetup() {
  app.innerHTML = [
    '<section class="setup-page">',
      '<article class="setup-card">',
        '<p class="eyebrow">One small setup step</p>',
        '<h1>Connect the library.</h1>',
        '<p>This project is built, but it needs your private Supabase project before it can protect and save your entries.</p>',
        '<p class="muted">Follow the README: create the Supabase project, run <code>supabase/schema.sql</code>, then add the three Vercel environment variables.</p>',
      '</article>',
    '</section>'
  ].join('');
}

function renderLogin(message) {
  const note = message ? '<p class="muted">' + escapeHtml(message) + '</p>' : '';
  app.innerHTML = [
    '<section class="auth-page">',
      '<article class="auth-card">',
        '<p class="eyebrow">Private collection</p>',
        '<h1>Welcome<br>back.</h1>',
        '<p>This library is only visible to you. I will send a secure sign-in link to your email.</p>',
        '<form id="loginForm">',
          '<label class="field-label" for="email">Your email</label>',
          '<input id="email" type="email" value="' + escapeHtml(config.ownerEmail) + '" readonly />',
          '<div class="form-actions"><button class="primary-button" type="submit">Send me a sign-in link</button></div>',
        '</form>',
        note,
        '<p class="fine-print">The writing, reflections, and images in this library remain private until you choose otherwise.</p>',
      '</article>',
    '</section>'
  ].join('');

  document.querySelector('#loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.textContent = 'Sending...';
    const result = await state.supabase.auth.signInWithOtp({
      email: config.ownerEmail,
      options: { emailRedirectTo: window.location.origin }
    });
    if (result.error) {
      button.disabled = false;
      button.textContent = 'Send me a sign-in link';
      showNotice(result.error.message, 'error');
      return;
    }
    renderLogin('The sign-in link is on its way. Open it in this browser to enter the library.');
  });
}

function libraryIllustration() {
  return [
    '<div class="library-illustration" aria-hidden="true">',
      '<svg viewBox="0 0 950 610">',
        '<defs>',
          '<linearGradient id="building" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#334a3e"/><stop offset="100%" stop-color="#18271f"/></linearGradient>',
          '<linearGradient id="roof" x1="0" x2="1"><stop offset="0%" stop-color="#1a2729"/><stop offset="100%" stop-color="#334541"/></linearGradient>',
          '<filter id="glow"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
        '</defs>',
        '<path d="M0 535 Q105 482 220 522 T430 520 T654 516 T950 535 V610 H0Z" fill="#0a1612"/>',
        '<path d="M42 568 Q156 515 278 553 T544 548 T766 544 T950 564 V610 H0Z" fill="#10211a"/>',
        '<path d="M240 504 L272 201 L475 75 L690 201 L734 504Z" fill="url(#building)" stroke="#0f1916" stroke-width="9"/>',
        '<path d="M214 217 L475 42 L758 217 L713 230 L475 92 L253 230Z" fill="url(#roof)" stroke="#0e1818" stroke-width="9"/>',
        '<path d="M465 43 L465 5 L502 5 L502 65Z" fill="#263931" stroke="#0f1916" stroke-width="7"/>',
        '<path d="M296 501 L310 244 L475 146 L644 244 L671 501Z" fill="#2d4338" opacity=".95"/>',
        '<path d="M294 504 H672" stroke="#152119" stroke-width="14"/>',
        '<g filter="url(#glow)" fill="#efc76d" stroke="#19251e" stroke-width="9">',
          '<path d="M326 290 Q326 252 358 252 Q390 252 390 290 V369 H326Z"/>',
          '<path d="M554 290 Q554 252 586 252 Q618 252 618 290 V369 H554Z"/>',
          '<path d="M326 397 Q326 361 358 361 Q390 361 390 397 V474 H326Z"/>',
          '<path d="M554 397 Q554 361 586 361 Q618 361 618 397 V474 H554Z"/>',
        '</g>',
        '<g stroke="#73522c" stroke-width="5" opacity=".72">',
          '<path d="M358 260 V361 M334 307 H382"/><path d="M586 260 V361 M562 307 H610"/>',
          '<path d="M358 370 V472 M334 422 H382"/><path d="M586 370 V472 M562 422 H610"/>',
        '</g>',
        '<path d="M271 504 H680" stroke="#6d4a2c" stroke-width="12"/><path d="M291 512 H660" stroke="#20150f" stroke-width="12"/>',
        '<g opacity=".92"><path d="M188 534 Q190 431 236 423 Q277 449 275 534Z" fill="#14231b"/><path d="M698 534 Q699 423 744 414 Q786 449 786 534Z" fill="#14231b"/><path d="M106 544 Q111 461 169 460 Q214 495 202 544Z" fill="#112019"/><path d="M789 544 Q803 467 855 462 Q900 495 889 544Z" fill="#112019"/></g>',
      '</svg>',
    '</div>'
  ].join('');
}

function renderEntry() {
  const background = cssUrl(state.settings.exterior_image_path);
  const style = background ? ' style="--exterior-image:' + background + '"' : '';
  app.innerHTML = [
    '<section class="entry"' + style + '>',
      '<div class="moon"></div>',
      '<div class="entry-copy">',
        '<p class="eyebrow">A strategic leadership plan</p>',
        '<h1>' + escapeHtml(state.settings.library_title) + '</h1>',
        '<p>' + escapeHtml(state.settings.library_subtitle) + '</p>',
      '</div>',
      libraryIllustration(),
      '<button class="door" id="enterDoor" aria-label="Enter the library">Enter</button>',
      '<p class="entry-note">Click the door to enter.</p>',
    '</section>'
  ].join('');
  document.querySelector('#enterDoor').addEventListener('click', function () {
    const door = document.querySelector('#enterDoor');
    door.classList.add('open');
    window.setTimeout(renderInterior, 610);
  });
}

function coverStyle(entry) {
  const image = cssUrl(entry.cover_image_path);
  let style = '--book:' + escapeHtml(entry.cover_color || '#536d5c') + ';';
  if (image) style += '--cover-image:' + image + ';';
  return style;
}

function shelfHtml(shelf) {
  const entries = state.entries.filter(function (entry) {
    return entry.kind === 'leadership' && entry.shelf === shelf.id;
  }).sort(function (a, b) {
    return a.sort_order - b.sort_order;
  });
  const books = entries.map(function (entry, index) {
    const height = index % 2 === 0 ? 168 : 187;
    const width = index % 2 === 0 ? 74 : 80;
    return [
      '<button class="spine" data-open-book="' + entry.id + '" style="' + coverStyle(entry) + '--book-width:' + width + 'px;--book-height:' + height + 'px">',
        '<span>' + escapeHtml(entry.title) + '</span>',
        '<small>' + escapeHtml(entry.context || shelf.number) + '</small>',
      '</button>'
    ].join('');
  }).join('');
  const empty = entries.length === 0 ? '<p style="position:relative;z-index:2;color:#f7e9c2;font-style:italic;">This shelf is waiting for its first book.</p>' : '';
  return [
    '<section class="shelf-section">',
      '<div class="shelf-heading"><span class="shelf-number">' + shelf.number + '</span><h3>' + escapeHtml(shelf.title) + '</h3></div>',
      '<div class="shelf-scroll"><div class="wood-shelf">',
        books, empty, '<div class="candle" aria-hidden="true"></div>',
      '</div></div>',
    '</section>'
  ].join('');
}

function readingAlcoveHtml() {
  const books = state.entries.filter(function (entry) {
    return entry.kind === 'reading';
  }).sort(function (a, b) {
    return a.sort_order - b.sort_order;
  }).map(function (entry, index) {
    const heights = [176, 193, 163, 185, 172, 198, 165, 189, 178];
    const widths = [72, 62, 73, 65, 70, 63, 67, 73, 64];
    return [
      '<button class="reading-book" data-open-book="' + entry.id + '" style="' + coverStyle(entry) + '--book-width:' + (widths[index % widths.length]) + 'px;--book-height:' + (heights[index % heights.length]) + 'px">',
        '<span>' + escapeHtml(entry.title) + '</span>',
        '<small>' + escapeHtml((entry.context || 'READ').split(' ')[0].toUpperCase()) + '</small>',
      '</button>'
    ].join('');
  }).join('');
  return [
    '<section class="reading-alcove">',
      '<div class="reading-intro">',
        '<h3>The Leadership Reading Alcove</h3>',
        '<p>These are not all leadership books in the traditional sense. They are books that have made me think about people, power, feedback, courage, identity, and what it means to create something that matters. Each one belongs somewhere in the six-shelf library too.</p>',
      '</div>',
      '<div class="reading-scroll"><div class="reading-shelf">',
        books || '<p style="position:relative;z-index:2;">Add your reading list from the Librarian Desk.</p>',
      '</div></div>',
    '</section>'
  ].join('');
}

function modalHtml() {
  return [
    '<dialog class="book-dialog" id="bookDialog">',
      '<button class="close-book" aria-label="Close book">×</button>',
      '<div class="book-stage"><article class="open-book">',
        '<div class="page left" id="leftPage"></div>',
        '<div class="page right" id="rightPage"></div>',
        '<div class="turn-page" id="turnPage"><span id="coverTitle"></span><small>Rane’s Leadership Library</small></div>',
      '</article></div>',
    '</dialog>'
  ].join('');
}

function renderInterior() {
  const paper = cssUrl(state.settings.paper_texture_path);
  const shelf = cssUrl(state.settings.shelf_texture_path);
  let inline = '';
  if (paper) inline += '--paper-texture:' + paper + ';';
  if (shelf) inline += '--shelf-texture:' + shelf + ';';
  app.innerHTML = [
    '<section class="interior" style="' + inline + '">',
      '<header class="interior-header">',
        '<div class="top-actions">',
          '<button class="secondary-button" id="backToDoor">← Door</button>',
          '<button class="secondary-button" id="openAdmin">Librarian Desk</button>',
          '<button class="secondary-button" id="signOut">Sign out</button>',
        '</div>',
        '<p class="eyebrow">The main collection</p>',
        '<h2>Six shelves for the lessons I am still learning.</h2>',
        '<p>Each shelf is one strategic leadership principle. Each book is a real moment that changed how I want to show up in my work, my teams, and my life.</p>',
      '</header>',
      '<main class="library-content">',
        '<p class="library-instruction">Choose a book. It will open when you are ready to read it.</p>',
        shelves.map(shelfHtml).join(''),
        readingAlcoveHtml(),
      '</main>',
    '</section>',
    modalHtml()
  ].join('');

  document.querySelector('#backToDoor').addEventListener('click', renderEntry);
  document.querySelector('#openAdmin').addEventListener('click', function () {
    state.editingId = null;
    renderAdmin();
  });
  document.querySelector('#signOut').addEventListener('click', signOut);
  document.querySelectorAll('[data-open-book]').forEach(function (button) {
    button.addEventListener('click', function () {
      openBook(button.dataset.openBook);
    });
  });
  document.querySelector('.close-book').addEventListener('click', closeBook);
}

function openBook(id) {
  const entry = state.entries.find(function (item) { return item.id === id; });
  if (!entry) return;
  const dialog = document.querySelector('#bookDialog');
  const coverImage = cssUrl(entry.cover_image_path);
  document.querySelector('#leftPage').innerHTML = [
    '<p class="page-label">' + escapeHtml(entry.context || 'A note from this shelf') + '</p>',
    '<h4>Why this belongs in the library</h4>',
    paragraphs(entry.left_note)
  ].join('');
  document.querySelector('#rightPage').innerHTML = [
    '<p class="page-label">The reflection</p>',
    '<h2>' + escapeHtml(entry.title) + '</h2>',
    '<span class="principle-chip">' + escapeHtml(entry.principle) + '</span>',
    paragraphs(entry.reflection)
  ].join('');
  document.querySelector('#coverTitle').textContent = entry.title;
  document.querySelector('#turnPage').style.setProperty('--book-cover', entry.cover_color || '#536d5c');
  if (coverImage) document.querySelector('#turnPage').style.backgroundImage = 'linear-gradient(105deg, rgba(0,0,0,.12), rgba(0,0,0,.22)), ' + coverImage;
  else document.querySelector('#turnPage').style.backgroundImage = '';
  dialog.classList.remove('opening');
  dialog.showModal();
  window.requestAnimationFrame(function () {
    dialog.classList.add('opening');
  });
}

function closeBook() {
  const dialog = document.querySelector('#bookDialog');
  if (!dialog) return;
  dialog.close();
  dialog.classList.remove('opening');
}

async function getSignedUrl(path) {
  if (!path) return null;
  const result = await state.supabase.storage.from('library-assets').createSignedUrl(path, 3600);
  if (result.error) return null;
  return result.data.signedUrl;
}

async function hydrateAssetUrls() {
  const paths = [
    state.settings.exterior_image_path,
    state.settings.paper_texture_path,
    state.settings.shelf_texture_path
  ].concat(state.entries.map(function (entry) { return entry.cover_image_path; })).filter(Boolean);
  const unique = Array.from(new Set(paths));
  const pairs = await Promise.all(unique.map(async function (path) {
    return [path, await getSignedUrl(path)];
  }));
  state.urls = {};
  pairs.forEach(function (pair) {
    if (pair[1]) state.urls[pair[0]] = pair[1];
  });
}

async function loadLibrary() {
  const settingsResult = await state.supabase.from('site_settings').select('*').eq('id', true).maybeSingle();
  const entriesResult = await state.supabase.from('entries').select('*').order('kind').order('shelf').order('sort_order');
  if (settingsResult.error || entriesResult.error) {
    showNotice((settingsResult.error || entriesResult.error).message, 'error');
    return;
  }
  state.settings = settingsResult.data ? { ...defaultSettings, ...settingsResult.data } : { ...defaultSettings };
  state.entries = entriesResult.data || [];
  await hydrateAssetUrls();
  renderEntry();
}

async function startPrivateSession(session) {
  const email = (session.user.email || '').toLowerCase();
  if (email !== config.ownerEmail) {
    await state.supabase.auth.signOut();
    renderLogin('This email is not allowed to open this private library.');
    return;
  }
  state.user = session.user;
  await loadLibrary();
}

async function signOut() {
  await state.supabase.auth.signOut();
  state.user = null;
  renderLogin('You have been signed out.');
}

function shelfOptions(selected) {
  return shelves.map(function (shelf) {
    return '<option value="' + shelf.id + '"' + (selected === shelf.id ? ' selected' : '') + '>' + escapeHtml(shelf.number + ' — ' + shelf.title) + '</option>';
  }).join('');
}

function entryEditorHtml(entry) {
  const item = entry || {
    shelf: 'self-awareness',
    kind: 'leadership',
    title: '',
    context: '',
    principle: shelves[0].title,
    cover_color: '#506f5d',
    sort_order: state.entries.length + 1,
    left_note: '',
    reflection: ''
  };
  const id = entry ? entry.id : '';
  return [
    '<form id="entryForm">',
      '<input type="hidden" name="id" value="' + escapeHtml(id) + '" />',
      '<div class="field-row">',
        '<div class="field-group"><label class="field-label" for="entryKind">Collection</label><select id="entryKind" name="kind"><option value="leadership"' + (item.kind === 'leadership' ? ' selected' : '') + '>Leadership shelf</option><option value="reading"' + (item.kind === 'reading' ? ' selected' : '') + '>Reading alcove</option></select></div>',
        '<div class="field-group"><label class="field-label" for="entryShelf">Shelf</label><select id="entryShelf" name="shelf">' + shelfOptions(item.shelf) + '<option value="reading-alcove"' + (item.shelf === 'reading-alcove' ? ' selected' : '') + '>Reading alcove</option></select></div>',
      '</div>',
      '<div class="field-group"><label class="field-label" for="entryTitle">Book title</label><input id="entryTitle" name="title" required value="' + escapeHtml(item.title) + '" /></div>',
      '<div class="field-row">',
        '<div class="field-group"><label class="field-label" for="entryContext">Context or author</label><input id="entryContext" name="context" value="' + escapeHtml(item.context) + '" /></div>',
        '<div class="field-group"><label class="field-label" for="entryOrder">Shelf order</label><input id="entryOrder" name="sort_order" type="number" min="1" value="' + escapeHtml(item.sort_order) + '" /></div>',
      '</div>',
      '<div class="field-row">',
        '<div class="field-group"><label class="field-label" for="entryPrinciple">Leadership principle</label><input id="entryPrinciple" name="principle" required value="' + escapeHtml(item.principle) + '" /></div>',
        '<div class="field-group"><label class="field-label" for="entryColor">Cover color</label><input id="entryColor" name="cover_color" type="color" value="' + escapeHtml(item.cover_color || '#506f5d') + '" /></div>',
      '</div>',
      '<div class="field-group"><label class="field-label" for="entryLeft">Left page: why it belongs</label><textarea id="entryLeft" name="left_note" required>' + escapeHtml(item.left_note) + '</textarea></div>',
      '<div class="field-group"><label class="field-label" for="entryReflection">Right page: reflection</label><textarea id="entryReflection" name="reflection" required>' + escapeHtml(item.reflection) + '</textarea></div>',
      '<div class="field-group"><label class="field-label" for="entryImage">Optional real cover image</label><input id="entryImage" name="cover_image" type="file" accept="image/*" /><p class="fine-print">' + (item.cover_image_path ? 'A cover image is already attached. Choosing a new file replaces it.' : 'Use a photo or texture to make this book feel real.') + '</p></div>',
      '<div class="form-actions"><button class="primary-button" type="submit">Save book</button><button class="secondary-button" id="cancelEdit" type="button">Cancel</button></div>',
      (entry ? '<div class="delete-row"><button class="danger-button" id="deleteEntry" type="button">Delete this book</button></div>' : ''),
    '</form>'
  ].join('');
}

function adminListHtml() {
  if (state.entries.length === 0) return '<p class="muted">This collection is empty. Add the starter collection or create your first book.</p>';
  return state.entries.slice().sort(function (a, b) {
    return a.kind.localeCompare(b.kind) || a.shelf.localeCompare(b.shelf) || a.sort_order - b.sort_order;
  }).map(function (entry) {
    return [
      '<div class="admin-entry">',
        '<div><strong>' + escapeHtml(entry.title) + '</strong><small>' + escapeHtml(entry.kind === 'reading' ? 'Reading alcove' : (shelves.find(function (shelf) { return shelf.id === entry.shelf; }) || {}).title || entry.shelf) + '</small></div>',
        '<button data-edit-id="' + entry.id + '">Edit</button>',
      '</div>'
    ].join('');
  }).join('');
}

function adminSettingsHtml() {
  return [
    '<form id="settingsForm">',
      '<div class="field-group"><label class="field-label" for="libraryTitle">Library title</label><input id="libraryTitle" name="library_title" value="' + escapeHtml(state.settings.library_title) + '" /></div>',
      '<div class="field-group"><label class="field-label" for="librarySubtitle">Subtitle</label><textarea id="librarySubtitle" name="library_subtitle">' + escapeHtml(state.settings.library_subtitle) + '</textarea></div>',
      '<div class="form-actions"><button class="secondary-button" type="submit">Save title and subtitle</button></div>',
    '</form>',
    '<details><summary>Replace a visual texture or background</summary>',
      '<form id="assetForm" style="margin-top:15px">',
        '<div class="field-group"><label class="field-label" for="assetTarget">Where should this image go?</label><select id="assetTarget" name="target"><option value="exterior_image_path">Outside-library background</option><option value="paper_texture_path">Open-book paper texture</option><option value="shelf_texture_path">Bookshelf wood texture</option></select></div>',
        '<div class="field-group"><label class="field-label" for="assetFile">Image file</label><input id="assetFile" name="asset" type="file" accept="image/*" required /></div>',
        '<div class="form-actions"><button class="secondary-button" type="submit">Upload visual</button></div>',
      '</form>',
    '</details>'
  ].join('');
}

function renderAdmin() {
  const selected = state.entries.find(function (entry) { return entry.id === state.editingId; }) || null;
  app.innerHTML = [
    '<section class="admin-page">',
      '<header class="admin-top">',
        '<div><p class="eyebrow">Private editor</p><h1>The Librarian Desk</h1><p>This is your private place to change an entry, add a new book, update your reading list, or upload real photo textures and backgrounds.</p></div>',
        '<button class="secondary-button" id="backToLibrary">← Back to library</button>',
      '</header>',
      '<main class="admin-grid">',
        '<section class="admin-card">',
          '<h2>Collection</h2>',
          '<div class="form-actions"><button class="primary-button" id="newEntry" type="button">Add a book</button><button class="secondary-button" id="seedEntries" type="button"' + (state.entries.length ? ' disabled' : '') + '>Add starter collection</button></div>',
          '<div class="admin-list" style="margin-top:18px">' + adminListHtml() + '</div>',
          '<h3>Library settings</h3>',
          adminSettingsHtml(),
        '</section>',
        '<section class="admin-card">',
          '<h2>' + (selected ? 'Edit a book' : 'Add a new book') + '</h2>',
          entryEditorHtml(selected),
        '</section>',
      '</main>',
    '</section>'
  ].join('');

  document.querySelector('#backToLibrary').addEventListener('click', renderInterior);
  document.querySelector('#newEntry').addEventListener('click', function () {
    state.editingId = null;
    renderAdmin();
  });
  document.querySelectorAll('[data-edit-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.editingId = button.dataset.editId;
      renderAdmin();
    });
  });
  document.querySelector('#entryForm').addEventListener('submit', saveEntry);
  document.querySelector('#cancelEdit').addEventListener('click', function () {
    state.editingId = null;
    renderAdmin();
  });
  const deleteButton = document.querySelector('#deleteEntry');
  if (deleteButton) deleteButton.addEventListener('click', deleteEntry);
  document.querySelector('#seedEntries').addEventListener('click', seedEntries);
  document.querySelector('#settingsForm').addEventListener('submit', saveSettings);
  document.querySelector('#assetForm').addEventListener('submit', uploadSettingAsset);
}

async function uploadFile(file, folder) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = folder + '/' + Date.now() + '-' + safeName;
  const result = await state.supabase.storage.from('library-assets').upload(path, file, { upsert: false, contentType: file.type });
  if (result.error) throw result.error;
  return result.data.path;
}

async function saveEntry(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const id = form.get('id');
  const image = form.get('cover_image');
  const existing = state.entries.find(function (entry) { return entry.id === id; });
  let imagePath = existing ? existing.cover_image_path : null;
  try {
    if (image && image.size) imagePath = await uploadFile(image, 'covers');
    const payload = {
      shelf: form.get('shelf'),
      kind: form.get('kind'),
      title: form.get('title').trim(),
      context: form.get('context').trim(),
      principle: form.get('principle').trim(),
      cover_color: form.get('cover_color'),
      cover_image_path: imagePath,
      sort_order: Number(form.get('sort_order')) || 1,
      left_note: form.get('left_note').trim(),
      reflection: form.get('reflection').trim()
    };
    const result = id
      ? await state.supabase.from('entries').update(payload).eq('id', id)
      : await state.supabase.from('entries').insert(payload);
    if (result.error) throw result.error;
    showNotice('Your book was saved.');
    state.editingId = null;
    await loadLibrary();
    renderAdmin();
  } catch (error) {
    showNotice(error.message || 'The book could not be saved.', 'error');
  }
}

async function deleteEntry() {
  const entry = state.entries.find(function (item) { return item.id === state.editingId; });
  if (!entry || !window.confirm('Delete “' + entry.title + '”? This cannot be undone.')) return;
  const result = await state.supabase.from('entries').delete().eq('id', entry.id);
  if (result.error) {
    showNotice(result.error.message, 'error');
    return;
  }
  state.editingId = null;
  await loadLibrary();
  renderAdmin();
  showNotice('The book was removed.');
}

async function seedEntries() {
  if (state.entries.length || !window.confirm('Add all starter reflection and reading-list books?')) return;
  const result = await state.supabase.from('entries').insert(starterEntries);
  if (result.error) {
    showNotice(result.error.message, 'error');
    return;
  }
  await loadLibrary();
  showNotice('Your starter collection is now on the shelves.');
  renderAdmin();
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const result = await state.supabase.from('site_settings').upsert({
    id: true,
    library_title: form.get('library_title').trim(),
    library_subtitle: form.get('library_subtitle').trim(),
    exterior_image_path: state.settings.exterior_image_path,
    paper_texture_path: state.settings.paper_texture_path,
    shelf_texture_path: state.settings.shelf_texture_path
  });
  if (result.error) {
    showNotice(result.error.message, 'error');
    return;
  }
  await loadLibrary();
  showNotice('Library settings saved.');
  renderAdmin();
}

async function uploadSettingAsset(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const file = form.get('asset');
  const target = form.get('target');
  if (!file || !file.size) return;
  try {
    const path = await uploadFile(file, 'textures');
    const payload = {
      id: true,
      library_title: state.settings.library_title,
      library_subtitle: state.settings.library_subtitle,
      exterior_image_path: state.settings.exterior_image_path,
      paper_texture_path: state.settings.paper_texture_path,
      shelf_texture_path: state.settings.shelf_texture_path
    };
    payload[target] = path;
    const result = await state.supabase.from('site_settings').upsert(payload);
    if (result.error) throw result.error;
    await loadLibrary();
    showNotice('Visual uploaded. It is ready in your library.');
    renderAdmin();
  } catch (error) {
    showNotice(error.message || 'The image could not be uploaded.', 'error');
  }
}

async function boot() {
  if (!config.url || !config.key || !config.ownerEmail) {
    renderSetup();
    return;
  }
  state.supabase = createClient(config.url, config.key);
  const result = await state.supabase.auth.getSession();
  if (result.data.session) {
    await startPrivateSession(result.data.session);
  } else {
    renderLogin();
  }
  state.supabase.auth.onAuthStateChange(function (_event, session) {
    if (session && session.user && !state.user) startPrivateSession(session);
    if (!session && state.user) {
      state.user = null;
      renderLogin('You have been signed out.');
    }
  });
}

boot();
