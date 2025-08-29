const API = 'https://www.thecocktaildb.com/api/json/v1/1';
const LS_KEY = 'favoritos_cocktails_min';

// Shorthands DOM
const $ = (sel, root = document) => root.querySelector(sel);
const el = (id) => document.getElementById(id);
const make = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k in n) n[k] = v;
    else n.setAttribute(k, v);
  });
  ([]).concat(children).forEach(c => {
    if (typeof c === 'string') n.appendChild(document.createTextNode(c));
    else if (c) n.appendChild(c);
  });
  return n;
};
const clear = (node) => { while (node && node.firstChild) node.removeChild(node.firstChild); };

// Mostrar y ocultar carga
function showLoader(root = document) {
  const l = $('#cargando', root);
  if (l) l.style.display = 'inline-block';
}
function hideLoader(root = document) {
  const l = $('#cargando', root);
  if (l) l.style.display = 'none';
}

// Mostrar y ocultar estrellita
function showStar(root = document) {
  const l = $('#star', root);
  if (l) l.style.display = 'inline-block';
}
function hideStar(root = document) {
  const l = $('#star', root);
  if (l) l.style.display = 'none';
}

/* LocalStorage*/
function readFavs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function writeFavs(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function addFav(id, name) {
  const favs = readFavs();
  if (!favs.some(f => f.id === id)) {
    favs.push({ id, name });
    writeFavs(favs);
    return true;
  }
  return false;
}
function removeFav(id) {
  writeFavs(readFavs().filter(f => f.id !== id));
}

/* Ingredientes  */
function fillIngredientsList(drink, listNode) {
  clear(listNode);
  let had = false;
  for (let i = 1; i <= 15; i++) {
    const ing = drink['strIngredient' + i];
    const mea = drink['strMeasure' + i];
    if (ing && ing.trim() !== '') {
      const li = make('li', {}, `${mea ? mea.trim() + ' ' : ''}${ing}`);
      listNode.appendChild(li);
      had = true;
    }
  }
  if (!had) listNode.appendChild(make('li', {}, '—'));
}

/* llenar info index */
let currentDrink = null; // {id, name} 

function fillDrinkOnIndex(drink) {
  el('drink_name').textContent        = drink.strDrink || '—';
  el('drink_id').textContent          = drink.idDrink || '—';
  el('drink_category').textContent    = drink.strCategory || '—';
  el('drink_alcoholic').textContent   = drink.strAlcoholic || '—';
  el('drink_glass').textContent       = drink.strGlass || '—';

  const img = el('drink_img');
  if (drink.strDrinkThumb) {
    img.src = drink.strDrinkThumb;
    img.alt = `Imagen de ${drink.strDrink}`;
    img.style.display = 'block';
  } else {
    img.removeAttribute('src');
    img.alt = '';
    img.style.display = 'none';
  }

  fillIngredientsList(drink, el('drink_ingredients'));
  el('drink_instructions').textContent = drink.strInstructions || '—';

  currentDrink = { id: drink.idDrink, name: drink.strDrink };

  const favs = readFavs();
  if (favs.some(f => f.id === drink.idDrink)) {
    showStar();
  }
  else {
    hideStar();
  }
}

async function loadRandomDrink() {
  showLoader();
  try {
    const res = await fetch(`${API}/random.php`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const drink = data?.drinks?.[0];
    if (!drink) throw new Error('Respuesta vacía');
    fillDrinkOnIndex(drink);
  } catch (err) {
    console.error(err);
    el('drink_name').textContent = `Error: ${err.message}`;
  } finally {
    hideLoader();
  }
}

function handleAddToFavs() {
  if (!currentDrink) {
    alert('Primero genera un cóctel y luego agrégalo a Favoritos.');
    return;
  }
  const ok = addFav(currentDrink.id, currentDrink.name);
  alert(ok ? 'Guardado en Favoritos' : 'Ya estaba en Favoritos');
  const favs = readFavs();
  if (favs.some(f => f.id === currentDrink.id)) {
    showStar();
  }
}

/* Inicialización para index */
function initIndexPage() {
  const main = el('body_inicio');
  if (!main) return;

  hideLoader();
  hideStar();
  loadRandomDrink();
  const btnRandom = el('btn_random');
  const btnFavs   = el('btn_favs');
  if (btnRandom) btnRandom.addEventListener('click', loadRandomDrink);
  if (btnFavs)   btnFavs.addEventListener('click', handleAddToFavs);
}

/* generar favoritos */

function buildFavsLayout() {
  const main = el('main_favs');
  if (!main) return null;


  const toolbar = make('div', { class: 'favs-toolbar' }, [
    make('img', { id: 'cargando', src: '1496.gif', alt: 'Cargando…', style: 'display:none;height:28px;' })
  ]);

  const container = make('section', { class: 'favs-panels' });

  const listCard = make('article', { class: 'card' }, [
    make('h3', {}, 'Mis favoritos'),
    make('ul', { id: 'lista_favoritos', class: 'fav-list' })
  ]);

  const detailCard = make('article', { class: 'card' }, [
    make('h3', {}, 'Detalle'),
    make('div',  {id: 'detalle_favorito' }, [
      make('h4', { id: 'fav_name' }, 'Selecciona un favorito'),
      make('p',  { id: 'fav_id' }),
      make('p',  { id: 'fav_meta', class: 'muted' }), // categoría · tipo · vaso
      make('img',{ id: 'fav_img', alt: '', style: 'max-width:260px;display:none;border-radius:10px;margin:.5rem 0;' }),
      make('h4', {}, 'Ingredientes'),
      make('ul', { id: 'fav_ingredients' }),
      make('h4', {}, 'Instrucciones'),
      make('p',  { id: 'fav_instructions' })
    ])
  ]);

  container.appendChild(listCard);
  container.appendChild(detailCard);

  main.appendChild(toolbar);
  main.appendChild(container);
  return main;
}

/* Render lista de favoritos */
function renderFavList_FavsPage() {
  const list = el('lista_favoritos');
  if (!list) return;

  clear(list);
  const favs = readFavs();

  if (favs.length === 0) {
    list.appendChild(make('li', { class: 'muted' }, 'Aún no tienes favoritos.'));
    return;
  }

  favs.forEach(f => {
    const li  = make('li', { class: 'fav-row' });
    const btn = make('button', { class: 'fav-item', dataset: { id: f.id } }, `${f.name} (#${f.id})`);
    const del = make('button', { class: 'fav-del', dataset: { id: f.id }, title: 'Eliminar' }, '🗑️');

    li.appendChild(btn);
    li.appendChild(del);
    list.appendChild(li);
  });
}

/* 3.3) AJAX clásico (XHR) para lookup por ID */
function xhrLookupById(id) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${API}/lookup.php?i=${encodeURIComponent(id)}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch (e) { reject(e); }
      } else reject(new Error('HTTP ' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('Fallo de red XHR'));
    xhr.send();
  });
}


function fillFavDetail(drink) {
  el('fav_name').textContent = drink.strDrink || '—';
  el('fav_id').textContent   = drink.idDrink ? `ID: ${drink.idDrink}` : '';

 
  const meta = [drink.strCategory, drink.strAlcoholic, drink.strGlass].filter(Boolean).join(' · ');
  el('fav_meta').textContent = meta || '';

  const img = el('fav_img');
  if (drink.strDrinkThumb) {
    img.src = drink.strDrinkThumb;
    img.alt = `Imagen de ${drink.strDrink}`;
    img.style.display = 'block';
  } else {
    img.removeAttribute('src');
    img.alt = '';
    img.style.display = 'none';
  }

  fillIngredientsList(drink, el('fav_ingredients'));
  el('fav_instructions').textContent = drink.strInstructions || '—';
}

async function onFavsListClick(e) {
  const target = e.target;
  const id = target?.dataset?.id;
  if (!id) return;

  // Borrar
  if (target.classList.contains('fav-del')) {
    removeFav(id);
    renderFavList_FavsPage();
    if (el('fav_id').textContent.includes(id)) {
      el('fav_name').textContent = 'Selecciona un favorito';
      el('fav_id').textContent = '';
      el('fav_meta').textContent = '';
      el('fav_img').style.display = 'none';
      clear(el('fav_ingredients'));
      el('fav_instructions').textContent = '';
    }
    return;
  }

  // Ver detalle
  showLoader();
  try {
    const data = await xhrLookupById(id);
    const drink = data?.drinks?.[0];
    if (!drink) throw new Error('No encontrado');
    fillFavDetail(drink);
  } catch (err) {
    console.error(err);
    el('fav_name').textContent = `Error: ${err.message}`;
    el('fav_id').textContent = '';
    el('fav_meta').textContent = '';
    el('fav_img').style.display = 'none';
    clear(el('fav_ingredients'));
    el('fav_instructions').textContent = '';
  } finally {
    hideLoader();
  }
}


function initFavsPage() {
  const mainFavs = el('main_favs');
  if (!mainFavs) return; 


  buildFavsLayout();
  renderFavList_FavsPage();
  const list = el('lista_favoritos');
  if (list) list.addEventListener('click', onFavsListClick);
}

document.addEventListener('DOMContentLoaded', () => {
  initIndexPage();
  initFavsPage();
});
