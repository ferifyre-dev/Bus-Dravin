(function () {
  "use strict";

  var STORAGE_KEY = "busDravin.routes.v1";
  var DRAFT_KEY = "busDravin.draftStops.v1";
  var CITY_KEY = "busDravin.defaultCity.v1";
  // Google Maps' consumer directions URL supports 25 total stops
  // (origin + destination + waypoints). We stay one under that
  // to be safe, and split longer routes into linked parts.
  var MAX_STOPS_PER_LINK = 24;

  var stops = [];
  var cornerEditIndex = -1;

  var els = {
    defaultCityInput: document.getElementById("default-city-input"),
    pasteArea: document.getElementById("paste-area"),
    addPastedBtn: document.getElementById("add-pasted-btn"),
    singleInput: document.getElementById("single-stop-input"),
    addSingleBtn: document.getElementById("add-single-btn"),
    stopList: document.getElementById("stop-list"),
    emptyMessage: document.getElementById("empty-message"),
    clearAllBtn: document.getElementById("clear-all-btn"),
    routeNameInput: document.getElementById("route-name-input"),
    saveRouteBtn: document.getElementById("save-route-btn"),
    routeSelect: document.getElementById("route-select"),
    loadRouteBtn: document.getElementById("load-route-btn"),
    deleteRouteBtn: document.getElementById("delete-route-btn"),
    openMapsBtn: document.getElementById("open-maps-btn"),
    statusMessage: document.getElementById("status-message"),

    cornerPanel: document.getElementById("corner-picker-panel"),
    cornerPanelStopLabel: document.getElementById("corner-panel-stop-label"),
    cornerStatus: document.getElementById("corner-status"),
    useMyLocationBtn: document.getElementById("use-my-location-btn"),
    cornerSearchInput: document.getElementById("corner-search-input"),
    cornerSearchBtn: document.getElementById("corner-search-btn"),
    cornerManualInput: document.getElementById("corner-manual-input"),
    cornerManualBtn: document.getElementById("corner-manual-btn"),
    cornerMapWrap: document.getElementById("corner-map-wrap"),
    cornerConfirmBtn: document.getElementById("corner-confirm-btn"),
    cornerCancelBtn: document.getElementById("corner-cancel-btn"),
  };

  // ---------- storage helpers ----------

  function loadRoutes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveRoutes(routes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    } catch (e) {
      setStatus("Could not save. Your browser storage may be full or blocked.", "error");
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stops));
    } catch (e) {
      /* non-fatal */
    }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function loadDefaultCity() {
    try {
      return localStorage.getItem(CITY_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function saveDefaultCity(city) {
    try {
      localStorage.setItem(CITY_KEY, city);
    } catch (e) {
      /* non-fatal */
    }
  }

  // ---------- formatting a stop for Google Maps ----------
  // Bus route sheets often list stops as cross streets (e.g. "Cavendish/Westminster")
  // with no city. Google Maps needs "Cavendish & Westminster, Montreal, QC" to find it
  // reliably, so we transform the text just for the Maps search — what you typed stays
  // untouched in the list above.

  function looksLikeCoordinates(text) {
    return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(text.trim());
  }

  function formatStopForMaps(text, defaultCity) {
    var formatted = text.trim();
    if (looksLikeCoordinates(formatted)) return formatted;

    formatted = formatted.replace(/\s*\/\s*/g, " & ");

    if (defaultCity && formatted.indexOf(",") === -1) {
      formatted = formatted + ", " + defaultCity;
    }
    return formatted;
  }

  // ---------- corner picker (side-of-street precision) ----------
  // The address-and-directions flow above gets you to the right intersection,
  // but Google Maps drops the pin at the crossing's center, not on the actual
  // curb — wrong side of a divided road, wrong corner of a 4-way stop, etc.
  // Rather than have the driver translate compass directions (unreliable in
  // a city like Montreal, where the street grid runs well off true north),
  // this shows a real, draggable map and lets them place the pin by eye.

  var cornerMap = null;
  var cornerMarker = null;

  function setCornerStatus(message, type) {
    els.cornerStatus.textContent = message;
    els.cornerStatus.className = "help-text" + (type ? " " + type : "");
  }

  function ensureCornerMap() {
    if (cornerMap) return cornerMap;
    cornerMap = L.map("corner-map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(cornerMap);
    cornerMarker = L.marker([0, 0], { draggable: true }).addTo(cornerMap);
    return cornerMap;
  }

  function showPointOnMap(lat, lon) {
    ensureCornerMap();
    els.cornerMapWrap.hidden = false;
    cornerMap.setView([lat, lon], 19);
    cornerMarker.setLatLng([lat, lon]);
    // Leaflet can't size itself correctly while its container was hidden.
    setTimeout(function () {
      cornerMap.invalidateSize();
    }, 50);
  }

  function openCornerPicker(index) {
    cornerEditIndex = index;
    els.cornerPanelStopLabel.textContent = stops[index];
    els.cornerManualInput.value = "";
    els.cornerMapWrap.hidden = true;
    setCornerStatus("", null);
    els.cornerPanel.hidden = false;
    els.cornerPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    var stopText = stops[index];
    if (looksLikeCoordinates(stopText)) {
      els.cornerSearchInput.value = "";
      var parts = stopText.split(",");
      showPointOnMap(parseFloat(parts[0]), parseFloat(parts[1]));
      setCornerStatus("Showing this stop's current pin — drag to adjust, or search below to start over.", null);
    } else {
      var defaultCity = els.defaultCityInput.value.trim();
      els.cornerSearchInput.value = formatStopForMaps(stopText, defaultCity);
      searchCornerIntersection();
    }
  }

  function closeCornerPicker() {
    cornerEditIndex = -1;
    els.cornerPanel.hidden = true;
  }

  function applyCornerResult(lat, lon) {
    if (cornerEditIndex < 0 || cornerEditIndex >= stops.length) return;
    var stopNumber = cornerEditIndex + 1;
    stops[cornerEditIndex] = lat.toFixed(6) + "," + lon.toFixed(6);
    closeCornerPicker();
    renderStops();
    setStatus("Stop " + stopNumber + " updated to the exact spot you picked.", "success");
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setCornerStatus("This browser can't look up your location. Try search or manual coordinates instead.", "error");
      return;
    }
    setCornerStatus("Getting your location…", null);
    els.useMyLocationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        els.useMyLocationBtn.disabled = false;
        showPointOnMap(pos.coords.latitude, pos.coords.longitude);
        setCornerStatus("Found your location — drag the pin if it's not exactly right, then tap Use This Pin.", null);
      },
      function (err) {
        els.useMyLocationBtn.disabled = false;
        setCornerStatus("Couldn't get your location (" + err.message + "). Try search or manual coordinates instead.", "error");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function geocodeQuery(query) {
    var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(query);
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("Lookup failed. Try again in a moment.");
        return res.json();
      })
      .then(function (results) {
        if (!results || results.length === 0) {
          throw new Error("No location found for that search. Try adding the city, or use manual coordinates below.");
        }
        return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), name: results[0].display_name };
      });
  }

  function searchCornerIntersection() {
    var query = els.cornerSearchInput.value.trim();
    if (!query) {
      setCornerStatus("Type an intersection or address to search.", "error");
      return;
    }
    setCornerStatus("Looking up…", null);
    els.cornerSearchBtn.disabled = true;
    geocodeQuery(query)
      .then(function (result) {
        showPointOnMap(result.lat, result.lon);
        setCornerStatus("Found: " + result.name + " — drag the pin to the exact corner, then tap Use This Pin.", null);
      })
      .catch(function (err) {
        setCornerStatus(err.message || "Couldn't reach the lookup service. Try manual coordinates below.", "error");
      })
      .finally(function () {
        els.cornerSearchBtn.disabled = false;
      });
  }

  function showManualOnMap() {
    var text = els.cornerManualInput.value.trim();
    if (!looksLikeCoordinates(text)) {
      setCornerStatus("Enter coordinates like 45.50231, -73.65872.", "error");
      return;
    }
    var parts = text.split(",");
    showPointOnMap(parseFloat(parts[0]), parseFloat(parts[1]));
    setCornerStatus("Drag the pin if needed, then tap Use This Pin.", null);
  }

  function confirmCornerPin() {
    if (!cornerMarker) return;
    var pos = cornerMarker.getLatLng();
    applyCornerResult(pos.lat, pos.lng);
  }

  // ---------- stop list rendering ----------

  function renderStops() {
    els.stopList.innerHTML = "";
    els.emptyMessage.style.display = stops.length === 0 ? "block" : "none";

    stops.forEach(function (stopText, index) {
      var li = document.createElement("li");
      li.className = "stop-item";

      var badge = document.createElement("span");
      badge.className = "stop-badge";
      badge.textContent = String(index + 1);
      badge.setAttribute("aria-hidden", "true");

      var textWrap = document.createElement("span");
      textWrap.className = "stop-text";

      var roleLabel = "";
      if (stops.length > 1) {
        if (index === 0) roleLabel = "Start";
        else if (index === stops.length - 1) roleLabel = "End";
      }
      if (roleLabel) {
        var role = document.createElement("span");
        role.className = "stop-role";
        role.textContent = roleLabel;
        textWrap.appendChild(role);
      }
      textWrap.appendChild(document.createTextNode(stopText));

      var defaultCity = els.defaultCityInput.value.trim();
      var formatted = formatStopForMaps(stopText, defaultCity);
      if (formatted !== stopText) {
        var preview = document.createElement("span");
        preview.className = "stop-preview";
        preview.textContent = "Maps search: " + formatted;
        textWrap.appendChild(preview);
      }

      var controls = document.createElement("span");
      controls.className = "stop-controls";

      var upBtn = makeIconButton("↑", "Move stop " + (index + 1) + " up", function () {
        moveStop(index, -1);
      });
      upBtn.disabled = index === 0;

      var downBtn = makeIconButton("↓", "Move stop " + (index + 1) + " down", function () {
        moveStop(index, 1);
      });
      downBtn.disabled = index === stops.length - 1;

      var pinBtn = makeIconButton("📍", "Pin exact location for stop " + (index + 1), function () {
        openCornerPicker(index);
      });

      var removeBtn = makeIconButton("✕", "Remove stop " + (index + 1), function () {
        removeStop(index);
      });
      removeBtn.classList.add("remove");

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      controls.appendChild(pinBtn);
      controls.appendChild(removeBtn);

      li.appendChild(badge);
      li.appendChild(textWrap);
      li.appendChild(controls);
      els.stopList.appendChild(li);
    });

    saveDraft();
  }

  function makeIconButton(label, ariaLabel, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn";
    btn.textContent = label;
    btn.setAttribute("aria-label", ariaLabel);
    btn.addEventListener("click", onClick);
    return btn;
  }

  // ---------- stop list mutation ----------

  function addStop(text) {
    var trimmed = (text || "").trim();
    if (!trimmed) return false;
    stops.push(trimmed);
    return true;
  }

  function addPastedStops(raw) {
    var lines = (raw || "")
      .split(/\r?\n/)
      .map(function (l) {
        return l.trim();
      })
      .filter(function (l) {
        return l.length > 0;
      });

    if (lines.length === 0) {
      setStatus("Nothing to add — paste a list with at least one stop.", "error");
      return;
    }

    lines.forEach(addStop);
    renderStops();
    els.pasteArea.value = "";
    setStatus("Added " + lines.length + " stop" + (lines.length === 1 ? "" : "s") + ".", "success");
  }

  function removeStop(index) {
    if (cornerEditIndex >= 0) closeCornerPicker();
    stops.splice(index, 1);
    renderStops();
  }

  function moveStop(index, direction) {
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    if (cornerEditIndex >= 0) closeCornerPicker();
    var tmp = stops[index];
    stops[index] = stops[newIndex];
    stops[newIndex] = tmp;
    renderStops();
  }

  function clearAllStops() {
    if (stops.length === 0) return;
    var ok = window.confirm("Remove all " + stops.length + " stops from this list? This does not delete any saved routes.");
    if (!ok) return;
    if (cornerEditIndex >= 0) closeCornerPicker();
    stops = [];
    renderStops();
    setStatus("Stop list cleared.", "success");
  }

  // ---------- saved routes ----------

  function refreshRouteSelect() {
    var routes = loadRoutes();
    var names = Object.keys(routes).sort(function (a, b) {
      return a.localeCompare(b);
    });

    els.routeSelect.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = names.length ? "-- Choose a saved route --" : "-- No saved routes yet --";
    els.routeSelect.appendChild(placeholder);

    names.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name + " (" + routes[name].length + " stops)";
      els.routeSelect.appendChild(opt);
    });
  }

  function saveCurrentRoute() {
    var name = els.routeNameInput.value.trim();
    if (!name) {
      setStatus("Give the route a name first (e.g. \"AM Route\").", "error");
      return;
    }
    if (stops.length === 0) {
      setStatus("Add at least one stop before saving a route.", "error");
      return;
    }
    var routes = loadRoutes();
    var overwriting = Object.prototype.hasOwnProperty.call(routes, name);
    if (overwriting) {
      var ok = window.confirm('A route named "' + name + '" already exists. Overwrite it?');
      if (!ok) return;
    }
    routes[name] = stops.slice();
    saveRoutes(routes);
    refreshRouteSelect();
    els.routeSelect.value = name;
    setStatus('Saved route "' + name + '".', "success");
  }

  function loadSelectedRoute() {
    var name = els.routeSelect.value;
    if (!name) {
      setStatus("Choose a saved route first.", "error");
      return;
    }
    var routes = loadRoutes();
    if (!routes[name]) {
      setStatus("That route no longer exists.", "error");
      refreshRouteSelect();
      return;
    }
    if (stops.length > 0) {
      var ok = window.confirm("Replace your current stop list with \"" + name + "\"?");
      if (!ok) return;
    }
    if (cornerEditIndex >= 0) closeCornerPicker();
    stops = routes[name].slice();
    els.routeNameInput.value = name;
    renderStops();
    setStatus('Loaded route "' + name + '".', "success");
  }

  function deleteSelectedRoute() {
    var name = els.routeSelect.value;
    if (!name) {
      setStatus("Choose a saved route first.", "error");
      return;
    }
    var ok = window.confirm('Delete the saved route "' + name + '"? This cannot be undone.');
    if (!ok) return;
    var routes = loadRoutes();
    delete routes[name];
    saveRoutes(routes);
    refreshRouteSelect();
    setStatus('Deleted route "' + name + '".', "success");
  }

  // ---------- building & opening the Maps link(s) ----------

  function chunkStops(list, maxPerChunk) {
    if (list.length <= maxPerChunk) return [list];
    var chunks = [];
    var i = 0;
    while (i < list.length - 1) {
      var end = Math.min(i + maxPerChunk, list.length - 1);
      chunks.push(list.slice(i, end + 1));
      if (end >= list.length - 1) break;
      i = end; // overlap: last stop of this chunk = first stop of next
    }
    return chunks;
  }

  function buildMapsUrl(chunk, defaultCity) {
    var formattedChunk = chunk.map(function (stop) {
      return formatStopForMaps(stop, defaultCity);
    });
    var origin = encodeURIComponent(formattedChunk[0]);
    var destination = encodeURIComponent(formattedChunk[formattedChunk.length - 1]);
    var middle = formattedChunk.slice(1, -1);
    var url =
      "https://www.google.com/maps/dir/?api=1" +
      "&travelmode=driving" +
      "&origin=" + origin +
      "&destination=" + destination;
    if (middle.length > 0) {
      url += "&waypoints=" + middle.map(encodeURIComponent).join("%7C");
    }
    return url;
  }

  function openRoute() {
    if (stops.length < 2) {
      setStatus("Add at least 2 stops (a start and an end) before opening the route.", "error");
      return;
    }

    var defaultCity = els.defaultCityInput.value.trim();
    var chunks = chunkStops(stops, MAX_STOPS_PER_LINK);
    var opened = 0;

    chunks.forEach(function (chunk, i) {
      var url = buildMapsUrl(chunk, defaultCity);
      var win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) opened++;
    });

    if (opened === 0) {
      setStatus("Your browser blocked the popup. Allow popups for this app, then try again.", "error");
      return;
    }

    if (chunks.length === 1) {
      setStatus("Opened your route in Google Maps (" + stops.length + " stops).", "success");
    } else {
      setStatus(
        "Your route has " + stops.length + " stops, more than one map link can hold. " +
        "Opened it as " + chunks.length + " linked parts in " + chunks.length + " tabs " +
        "— drive Part 1 first, then Part 2, and so on.",
        "success"
      );
    }
  }

  // ---------- status ----------

  var statusTimer = null;
  function setStatus(message, type) {
    els.statusMessage.textContent = message;
    els.statusMessage.className = "status-message" + (type ? " " + type : "");
    if (statusTimer) clearTimeout(statusTimer);
    if (type === "success") {
      statusTimer = setTimeout(function () {
        els.statusMessage.textContent = "";
        els.statusMessage.className = "status-message";
      }, 6000);
    }
  }

  // ---------- wire up events ----------

  els.addPastedBtn.addEventListener("click", function () {
    addPastedStops(els.pasteArea.value);
  });

  els.addSingleBtn.addEventListener("click", function () {
    var added = addStop(els.singleInput.value);
    if (added) {
      renderStops();
      setStatus("Stop added.", "success");
      els.singleInput.value = "";
      els.singleInput.focus();
    } else {
      setStatus("Type a stop before adding it.", "error");
    }
  });

  els.singleInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      els.addSingleBtn.click();
    }
  });

  els.defaultCityInput.addEventListener("input", function () {
    saveDefaultCity(els.defaultCityInput.value);
    renderStops();
  });

  els.clearAllBtn.addEventListener("click", clearAllStops);

  els.useMyLocationBtn.addEventListener("click", useMyLocation);
  els.cornerSearchBtn.addEventListener("click", searchCornerIntersection);
  els.cornerSearchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchCornerIntersection();
    }
  });
  els.cornerManualBtn.addEventListener("click", showManualOnMap);
  els.cornerConfirmBtn.addEventListener("click", confirmCornerPin);
  els.cornerCancelBtn.addEventListener("click", closeCornerPicker);
  els.saveRouteBtn.addEventListener("click", saveCurrentRoute);
  els.loadRouteBtn.addEventListener("click", loadSelectedRoute);
  els.deleteRouteBtn.addEventListener("click", deleteSelectedRoute);
  els.openMapsBtn.addEventListener("click", openRoute);

  // ---------- init ----------

  stops = loadDraft();
  els.defaultCityInput.value = loadDefaultCity();
  refreshRouteSelect();
  renderStops();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {
        /* offline install is a nice-to-have, ignore failures */
      });
    });
  }
})();
