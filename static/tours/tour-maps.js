(function() {
  'use strict';

  // Configuration constants
  var TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors';
  var MAX_ZOOM = 18;
  var BOUNDS_PADDING = [20, 20];
  var GPX_COLOR = '#dc2626';
  var GPX_OPACITY = 0.9;
  var GPX_WEIGHT = 4;
  var DEBUG = false; // Set to true for debugging

  function log() {
    if (DEBUG && console && console.log) {
      console.log.apply(console, arguments);
    }
  }

  function logError() {
    if (console && console.error) {
      console.error.apply(console, arguments);
    }
  }

  function hasLeafletSupport() {
    return typeof window !== 'undefined' && window.L && typeof window.L.map === 'function';
  }

  function showError(canvas, message) {
    canvas.innerHTML = '<div class="map-error map-error--full">' + message + '</div>';
    canvas.dataset.mapInitialized = 'error';
  }

  function parsePeaksData(canvas) {
    if (!canvas) {
      return [];
    }

    var raw = canvas.getAttribute('data-peaks');
    if (!raw) {
      return [];
    }

    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(function(peak) {
        return peak && peak.lat !== undefined && peak.lng !== undefined;
      });
    } catch (err) {
      logError('[Tours] Failed to parse peak data', err);
      return [];
    }
  }

  function createPeakMarkers(map, peaks) {
    if (!map || !Array.isArray(peaks) || !peaks.length) {
      return [];
    }

    return peaks.reduce(function(markers, peak, index) {
      var lat = parseFloat(peak.lat);
      var lng = parseFloat(peak.lng);

      if (!isFinite(lat) || !isFinite(lng)) {
        log('[Tours] Ignoring peak with invalid coordinates', peak);
        return markers;
      }

      var icon = L.divIcon({
        className: 'tour-peak-marker',
        html: '<span>' + (index + 1) + '</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      var marker = L.marker([lat, lng], {
        icon: icon,
        keyboard: false,
        riseOnHover: true,
        bubblingMouseEvents: false
      });

      if (peak.label) {
        marker.bindTooltip(peak.label, {
          direction: 'top',
          offset: [0, -16],
          className: 'tour-peak-tooltip'
        });
      }

      marker.addTo(map);
      markers.push(marker);
      return markers;
    }, []);
  }

  function renderTourMap(canvas) {
    if (!canvas || canvas.dataset.mapInitialized === 'true') {
      log('[Tours] Canvas already initialized or not found');
      return;
    }

    if (!hasLeafletSupport()) {
      logError('[Tours] Leaflet not available for rendering map');
      showError(canvas, 'Karte kann nicht geladen werden (Leaflet nicht verfügbar)');
      return;
    }

    var gpxUrl = canvas.getAttribute('data-gpx');
    log('[Tours] Initializing map with GPX URL:', gpxUrl);

    var peakData = parsePeaksData(canvas);
    var peakMarkers = [];
    var hiddenMarkerIcon = L.divIcon({
      className: 'tour-hidden-marker',
      iconSize: [0, 0]
    });

    if (!gpxUrl) {
      logError('[Tours] No GPX URL provided');
      showError(canvas, 'Keine GPX-Datei angegeben');
      return;
    }

    // Check if leaflet-gpx is available
    if (typeof L.GPX !== 'function') {
      logError('[Tours] Leaflet GPX plugin not available');
      showError(canvas, 'GPX-Plugin nicht verfügbar');
      return;
    }

    canvas.dataset.mapInitialized = 'true';

    var map = L.map(canvas, {
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_LAYER_ATTRIBUTION,
      maxZoom: MAX_ZOOM
    }).addTo(map);

    log('[Tours] Map created, tile layer added');
    log('[Tours] Loading GPX file:', gpxUrl);

    var gpxLayer = new L.GPX(gpxUrl, {
      async: true,
      marker_options: {
        startIcon: hiddenMarkerIcon,
        endIcon: hiddenMarkerIcon,
        shadowUrl: ''
      },
      polyline_options: {
        color: GPX_COLOR,
        opacity: GPX_OPACITY,
        weight: GPX_WEIGHT,
        lineCap: 'round',
        lineJoin: 'round'
      }
    });

    if (peakData.length) {
      peakMarkers = createPeakMarkers(map, peakData);
    }

    gpxLayer.on('loaded', function(evt) {
      log('[Tours] GPX loaded successfully');
      var bounds = evt.target.getBounds();
      log('[Tours] GPX bounds:', bounds);

      if (bounds && bounds.isValid()) {
        if (peakMarkers.length) {
          peakMarkers.forEach(function(marker) {
            if (marker && marker.getLatLng) {
              bounds.extend(marker.getLatLng());
            }
          });
        }

        log('[Tours] Fitting map to bounds');
        map.fitBounds(bounds, { padding: BOUNDS_PADDING });

        // Single invalidateSize after bounds are set
        requestAnimationFrame(function() {
          map.invalidateSize();
        });
      } else {
        logError('[Tours] Invalid bounds from GPX');
        showError(canvas, 'GPX-Datei enthält ungültige Koordinaten');
      }
    });

    gpxLayer.on('error', function(err) {
      logError('[Tours] Error loading GPX:', err);
      logError('[Tours] GPX URL was:', gpxUrl);
      showError(canvas, 'GPX-Datei konnte nicht geladen werden');
    });

    gpxLayer.addTo(map);
    log('[Tours] GPX layer added to map');
  }

  function setupTourMaps() {
    var canvases = document.querySelectorAll('[data-tour-map-canvas]');
    if (!canvases.length) {
      return;
    }

    // Use IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && entry.target.dataset.mapInitialized !== 'true') {
            renderTourMap(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px'
      });

      canvases.forEach(function(canvas) {
        observer.observe(canvas);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      canvases.forEach(function(canvas) {
        renderTourMap(canvas);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTourMaps);
  } else {
    setupTourMaps();
  }
})();
