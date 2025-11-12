# Leaflet Libraries Required

This plugin requires Leaflet libraries to display maps. Please download the following files:

## Required Files

### 1. Leaflet CSS
```bash
curl -o static/tours/leaflet.css https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
```

### 2. Leaflet JavaScript
```bash
curl -o static/tours/leaflet.js https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
```

### 3. Leaflet GPX Plugin
```bash
curl -o static/tours/leaflet-gpx.js https://cdn.jsdelivr.net/npm/leaflet-gpx@1.7.0/gpx.min.js
```

## Quick Setup

Run all commands from the plugin root directory:

```bash
cd /path/to/mbplugin-fischr-tours
curl -o static/tours/leaflet.css https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
curl -o static/tours/leaflet.js https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
curl -o static/tours/leaflet-gpx.js https://cdn.jsdelivr.net/npm/leaflet-gpx@1.7.0/gpx.min.js
```

## Verification

After downloading, verify the files exist:

```bash
ls -lh static/tours/leaflet*
```

You should see three files with reasonable file sizes (CSS ~15KB, JS ~150KB, GPX plugin ~10KB).
