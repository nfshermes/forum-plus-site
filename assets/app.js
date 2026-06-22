/* ============================================================
   Forum PLUS — bibliothèque des lives  (app.js)
   Site 100% statique : données dans window.FORUM_PLUS (data.js)
   Fonctionne en local (file://) comme en ligne.
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.FORUM_PLUS || { lives: [], categories: [], years: [], total: 0 };

  // Couleur par thématique (id -> hex)
  var CAT_COLORS = {
    or: "#ca8a04", crypto: "#f7931a", immobilier: "#16a34a", entreprise: "#c026d3",
    fiscalite: "#e11d48", patrimoine: "#059669", enveloppes: "#7c3aed",
    obligations: "#0d9488", souverainete: "#475569", etf: "#4f46e5",
    macro: "#2563eb", strategie: "#0891b2", outils: "#6b7280"
  };
  var CAT = {};
  DATA.categories.forEach(function (c) { CAT[c.id] = c; });

  // ---- état ----
  var state = { q: "", cats: [], year: "", sort: "recent" };

  // ---- utilitaires ----
  function fold(s) {
    return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var app = document.getElementById("app");

  function catColor(id) { return CAT_COLORS[id] || "#2563eb"; }
  function catPill(id) {
    var c = CAT[id]; if (!c) return "";
    return '<a class="tag-cat" href="#/cat/' + id + '" style="--c:' + catColor(id) + '" onclick="event.stopPropagation()">' +
      c.emoji + " " + esc(c.label.replace(/ &.*$/, "").replace(/ ·.*/, "")) + "</a>";
  }

  // ---- filtrage ----
  function filtered() {
    var terms = fold(state.q).split(/\s+/).filter(Boolean);
    var out = DATA.lives.filter(function (L) {
      if (state.year && String(L.year) !== state.year) return false;
      if (state.cats.length && !state.cats.every(function (c) { return L.cats.indexOf(c) >= 0; })) return false;
      if (terms.length && !terms.every(function (t) { return L.search.indexOf(t) >= 0; })) return false;
      return true;
    });
    out.sort(function (a, b) { return state.sort === "recent" ? b.ep - a.ep : a.ep - b.ep; });
    return out;
  }

  // ============================================================
  //  VUE ACCUEIL
  // ============================================================
  function renderHome() {
    document.title = "Forum PLUS — La bibliothèque des lives";
    var thinNote = DATA.thin ? '<span class="stat">dont <b>' + DATA.thin + '</b> à enrichir</span>' : "";

    app.innerHTML = (
      '<section class="hero"><div class="wrap">' +
        '<h1>La bibliothèque des lives <span class="grad">Forum PLUS</span></h1>' +
        '<p class="lead">Chaque semaine, un live d\'éducation à l\'investissement pour les particuliers. ' +
        'Retrouvez ici ' + DATA.total + ' émissions : cherchez un sujet, parcourez par thématique, ou explorez le sommaire complet.</p>' +
        '<div class="stats">' +
          '<span class="stat"><b>' + DATA.total + '</b> lives</span>' +
          '<span class="stat"><b>' + DATA.categories.length + '</b> thématiques</span>' +
          '<span class="stat"><b>2022–2026</b></span>' +
          thinNote +
        '</div>' +
        '<div id="search-anchor" class="search-box">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
          '<input id="search" type="search" autocomplete="off" placeholder="Rechercher un sujet : ETF, crypto, succession, PEA, or…" />' +
          '<button class="search-clear" id="search-clear" aria-label="Effacer">✕</button>' +
        '</div>' +
      '</div></section>' +

      '<section class="section" id="cats-anchor"><div class="wrap">' +
        '<div class="section-head"><h2>Parcourir par thématique</h2><span class="muted">cliquez pour filtrer</span></div>' +
        '<div class="cat-grid" id="cat-grid"></div>' +
      '</div></section>' +

      '<section class="section" id="all-anchor"><div class="wrap">' +
        '<div class="section-head"><h2>Tous les lives</h2><span class="muted">du plus récent au plus ancien</span></div>' +
        '<div class="toolbar">' +
          '<div class="active-filters" id="active-filters"></div>' +
          '<span class="spacer"></span>' +
          '<select class="select" id="year-sel"></select>' +
          '<select class="select" id="sort-sel">' +
            '<option value="recent">Plus récent d\'abord</option>' +
            '<option value="old">Plus ancien d\'abord</option>' +
          '</select>' +
          '<button class="btn-text" id="reset-btn">Réinitialiser</button>' +
        '</div>' +
        '<div class="results-meta" id="results-meta"></div>' +
        '<div class="live-list" id="live-list"></div>' +
      '</div></section>'
    );

    // grille thématiques
    var grid = document.getElementById("cat-grid");
    DATA.categories.slice().sort(function (a, b) { return b.count - a.count; }).forEach(function (c) {
      var card = el(
        '<button class="cat-card" data-cat="' + c.id + '" style="--c:' + catColor(c.id) + '">' +
          '<span class="cat-ico">' + c.emoji + '</span>' +
          '<span class="cat-meta"><span class="name">' + esc(c.label) + '</span>' +
          '<span class="count">' + c.count + ' live' + (c.count > 1 ? "s" : "") + '</span></span>' +
        '</button>'
      );
      card.addEventListener("click", function () { toggleCat(c.id); });
      grid.appendChild(card);
    });

    // sélecteur année
    var ysel = document.getElementById("year-sel");
    ysel.appendChild(el('<option value="">Toutes les années</option>'));
    DATA.years.forEach(function (y) { ysel.appendChild(el('<option value="' + y.year + '">' + y.year + " (" + y.count + ")</option>")); });
    ysel.value = state.year;
    ysel.addEventListener("change", function () { state.year = ysel.value; update(); });

    var ssel = document.getElementById("sort-sel");
    ssel.value = state.sort;
    ssel.addEventListener("change", function () { state.sort = ssel.value; update(); });

    document.getElementById("reset-btn").addEventListener("click", resetAll);

    // recherche
    var input = document.getElementById("search");
    var clr = document.getElementById("search-clear");
    input.value = state.q;
    clr.style.display = state.q ? "block" : "none";
    input.addEventListener("input", function () {
      state.q = input.value;
      clr.style.display = state.q ? "block" : "none";
      update();
    });
    clr.addEventListener("click", function () { state.q = ""; input.value = ""; clr.style.display = "none"; input.focus(); update(); });

    update();
  }

  function renderActiveFilters() {
    var box = document.getElementById("active-filters");
    if (!box) return;
    box.innerHTML = "";
    if (!state.cats.length) {
      box.appendChild(el('<span class="muted" style="color:var(--ink-3);font-size:13px">Aucun filtre — ' + DATA.total + ' lives</span>'));
      return;
    }
    state.cats.forEach(function (id) {
      var c = CAT[id];
      var chip = el('<span class="chip" style="--c:' + catColor(id) + '">' + c.emoji + " " + esc(c.label.replace(/ ·.*/, "").replace(/ &.*$/, "")) +
        '<button aria-label="Retirer">✕</button></span>');
      chip.querySelector("button").addEventListener("click", function () { toggleCat(id); });
      box.appendChild(chip);
    });
  }

  function update() {
    // sync état des cartes thématiques
    document.querySelectorAll(".cat-card").forEach(function (c) {
      c.classList.toggle("active", state.cats.indexOf(c.getAttribute("data-cat")) >= 0);
    });
    renderActiveFilters();

    var list = document.getElementById("live-list");
    var meta = document.getElementById("results-meta");
    if (!list) return;
    var res = filtered();
    meta.textContent = res.length + (res.length > 1 ? " lives trouvés" : " live trouvé");

    list.innerHTML = "";
    if (!res.length) {
      list.appendChild(el('<div class="empty"><div class="big">🔍</div><div>Aucun live ne correspond à votre recherche.</div></div>'));
      return;
    }
    var frag = document.createDocumentFragment();
    res.forEach(function (L) { frag.appendChild(liveCard(L)); });
    list.appendChild(frag);
  }

  function liveCard(L) {
    var cats = L.cats.slice(0, 3).map(catPill).join("");
    var body = L.summary
      ? "<p>" + esc(L.summary) + "</p>"
      : '<p class="todo">Transcription brute disponible — résumé détaillé à venir.</p>';
    var card = el(
      '<div class="live-card" role="link" tabindex="0" data-ep="' + L.ep + '">' +
        '<span class="live-num"><span class="hash">LIVE</span><span class="n">' + L.ep + '</span></span>' +
        '<span class="live-body">' +
          '<span class="date">' + esc(L.dateFr) + '</span>' +
          "<h3>" + esc(L.title) + "</h3>" +
          body +
          '<span class="tags">' + cats + "</span>" +
        "</span>" +
      "</div>"
    );
    var go = function () { location.hash = "#/live/" + L.ep; };
    card.addEventListener("click", go);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
    return card;
  }

  // ---- actions filtres ----
  function toggleCat(id) {
    var i = state.cats.indexOf(id);
    if (i >= 0) state.cats.splice(i, 1); else state.cats.push(id);
    if (location.hash.indexOf("/cat/") >= 0) history.replaceState(null, "", "#/");
    update();
  }
  function resetAll() {
    state = { q: "", cats: [], year: "", sort: "recent" };
    renderHome();
  }

  // ============================================================
  //  VUE DÉTAIL
  // ============================================================
  function renderDetail(ep) {
    var L = DATA.lives.filter(function (x) { return x.ep === ep; })[0];
    if (!L) { location.hash = "#/"; return; }
    document.title = "Forum PLUS #" + L.ep + " — " + L.title;

    var catTags = L.cats.map(catPill).join("");
    var kwTags = (L.tags || []).slice(0, 8).map(function (t) { return '<span class="tag-kw">' + esc(t) + "</span>"; }).join("");

    var content = L.html && !L.thin
      ? '<div class="content">' + L.html + "</div>"
      : '<div class="notice"><b>Résumé détaillé à venir.</b><br>La transcription brute de ce live existe mais n\'a pas encore été structurée en fiche. ' +
        'Elle sera ajoutée prochainement. En attendant, ce live reste référencé par sa date et son numéro.</div>';

    app.innerHTML = (
      '<section class="detail"><div class="wrap" style="max-width:780px">' +
        '<a class="back" href="#/">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>' +
          "Tous les lives</a>" +
        '<div class="detail-head">' +
          '<div class="eyebrow"><span class="pill">Live #' + L.ep + "</span><span>" + esc(L.dateFr) + "</span></div>" +
          "<h1>" + esc(L.title) + "</h1>" +
          '<div class="tags">' + catTags + " " + kwTags + "</div>" +
        "</div>" +
        content +
      "</div></section>"
    );
    window.scrollTo(0, 0);
  }

  // ============================================================
  //  ROUTEUR
  // ============================================================
  function route() {
    var h = location.hash || "#/";
    var mLive = h.match(/^#\/live\/(\d+)/);
    var mCat = h.match(/^#\/cat\/([a-z]+)/);
    if (mLive) { renderDetail(parseInt(mLive[1], 10)); return; }
    if (mCat) {
      if (CAT[mCat[1]] && state.cats.indexOf(mCat[1]) < 0) state.cats = [mCat[1]];
      renderHome();
      var a = document.getElementById("all-anchor"); if (a) a.scrollIntoView({ behavior: "smooth" });
      return;
    }
    renderHome();
  }

  // navigation header (scroll vers sections)
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var nav = a.getAttribute("data-nav");
      var go = function () {
        var id = nav === "search" ? "search-anchor" : nav === "cats" ? "cats-anchor" : "all-anchor";
        var t = document.getElementById(id);
        if (t) t.scrollIntoView({ behavior: "smooth", block: nav === "search" ? "center" : "start" });
        if (nav === "search") { var s = document.getElementById("search"); if (s) s.focus(); }
      };
      if (location.hash.indexOf("/live/") >= 0) { location.hash = "#/"; setTimeout(go, 60); }
      else go();
    });
  });

  // footer
  var fm = document.getElementById("foot-meta");
  if (fm) fm.textContent = DATA.total + " lives · mis à jour le " + (DATA.generatedAt || "");

  window.addEventListener("hashchange", route);
  route();
})();
