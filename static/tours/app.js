/**
 * Tour Map Initialization Script
 *
 * Initializes Leaflet maps for tour shortcodes with GPX track overlay.
 * Runs after DOM is loaded and finds all .tour-map elements.
 *
 * Security: Validates GPX URLs and handles errors gracefully.
 * No global namespace pollution - uses IIFE pattern.
 */

(function() {
  'use strict';

  // Store initialized maps to prevent duplicates
  const initializedMaps = new Set();

  /**
   * Validates if a URL/path looks like a valid GPX file
   * @param {string} url - The GPX URL to validate
   * @returns {boolean} - True if valid
   */
  function isValidGpxUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.length === 0) return false;
    // Must end with .gpx (case insensitive)
    return /\.gpx$/i.test(trimmed);
  }

  /**
   * Initializes a single tour map
   * @param {HTMLElement} mapElement - The map container element
   */
  function initializeTourMap(mapElement) {
    const tourId = mapElement.getAttribute('data-tour-id');
    const gpxUrl = mapElement.getAttribute('data-gpx');

    // Prevent duplicate initialization
    if (initializedMaps.has(tourId)) {
      return;
    }

    // Validate GPX URL
    if (!isValidGpxUrl(gpxUrl)) {
      console.warn('[Tour Map] Invalid or missing GPX URL for tour:', tourId);
      mapElement.innerHTML = '<div class="map-error">GPX file not available</div>';
      return;
    }

    try {
      // Initialize Leaflet map
      const map = L.map(mapElement, {
        scrollWheelZoom: false, // Prevent accidental zooming while scrolling
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Load GPX track
      const gpxLayer = new L.GPX(gpxUrl, {
        async: true,
        marker_options: {
          startIconUrl: null,  // Use default markers
          endIconUrl: null,
          shadowUrl: null
        },
        polyline_options: {
          color: '#0066cc',
          weight: 4,
          opacity: 0.75
        }
      });

      // When GPX is loaded, fit map bounds to track
      gpxLayer.on('loaded', function(e) {
        const bounds = e.target.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [20, 20]
          });
        }
      });

      // Handle GPX load errors
      gpxLayer.on('error', function(e) {
        console.error('[Tour Map] Error loading GPX for tour:', tourId, e);
        mapElement.innerHTML = '<div class="map-error">Failed to load GPX track</div>';
      });

      gpxLayer.addTo(map);

      // Mark as initialized
      initializedMaps.add(tourId);

    } catch (error) {
      console.error('[Tour Map] Error initializing map for tour:', tourId, error);
      mapElement.innerHTML = '<div class="map-error">Map initialization failed</div>';
    }
  }

  /**
   * Initializes all tour maps on the page
   */
  function initializeAllMaps() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('[Tour Map] Leaflet library not loaded');
      return;
    }

    // Check if GPX plugin is loaded
    if (typeof L.GPX === 'undefined') {
      console.error('[Tour Map] Leaflet GPX plugin not loaded');
      return;
    }

    // Find all map containers
    const mapContainers = document.querySelectorAll('.tour-map[data-gpx]');

    if (mapContainers.length === 0) {
      return; // No maps on this page
    }

    // Initialize each map
    mapContainers.forEach(function(mapElement) {
      initializeTourMap(mapElement);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllMaps);
  } else {
    // DOM already loaded
    initializeAllMaps();
  }

})();
