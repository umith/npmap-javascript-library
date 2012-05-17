﻿// TODO: Hook up attribution for all layers.
define([
  NPMap.config.server + '/map.js'
], function(core) {
  var
      // The base layer to initialize the map with.
      baseLayer,
      // The center {L.LatLng} to initialize the map with.
      center = NPMap.config.center,
      // The {L.Map} object.
      map,
      // The map config object.
      mapConfig = NPMap.config.mapConfig || {},
      // The zoom level to initialize the map with.
      zoom = NPMap.config.zoom || 4;

  // Simple projection for "flat" maps.
  L.Projection.NoWrap = {
    project: function (latlng) {
      return new L.Point(latlng.lng, latlng.lat);
    },
    unproject: function (point, unbounded) {
      return new L.LatLng(point.y, point.x, true);
    }
  };
  //
  L.CRS.Direct = L.Util.extend({}, L.CRS, {
    code: 'Direct',
    projection: L.Projection.NoWrap,
    transformation: new L.Transformation(1, 0, 1, 0)
  });
  
  if (!center) {
    center = new L.LatLng(40.78054143186031, -99.931640625)
  } else {
    center = new L.LatLng(center.lat, center.lng);
  }
  
  mapConfig.attributionControl = false;
  mapConfig.center = center;
  mapConfig.zoom = zoom;
  mapConfig.zoomControl = false;
  
  if (NPMap.config.baseLayers) {
    for (var i = 0; i < NPMap.config.baseLayers.length; i++) {
      var layer = NPMap.config.baseLayers[i];
      
      if (layer.visible) {
        NPMap.utils.safeLoad('NPMap.leaflet.layers.' + layer.type, function() {
          NPMap.leaflet.layers[layer.type].addLayer(layer);
        });
        
        baseLayer = true;
        
        if (layer.type === 'Zoomify') {
          mapConfig.crs = L.CRS.Direct;
          mapConfig.worldCopyJump = false;
        }
        
        break;
      }
    }
  }
  
  if (NPMap.config.restrictZoom && (NPMap.config.restrictZoom.max && NPMap.config.restrictZoom.min)) {
    mapConfig.maxZoom = NPMap.config.restrictZoom.max;
    mapConfig.minZoom = NPMap.config.restrictZoom.min;
  }
  
  map = new L.Map(NPMap.config.div, mapConfig);
  
  if (!baseLayer) {
    baseLayer = new L.TileLayer('http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png', {
      attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms & Feedback</a>',
      maxZoom: 17
    });
    
    map.addLayer(baseLayer);
    NPMap.Map.setAttribution('<a href="http://mapbox.com/about/maps" target="_blank">Terms & Feedback</a>');
  }
  
  core.init();

  NPMap.leaflet = {};
  
  return NPMap.leaflet.map = {
    /**
     * Zooms to the center and zoom provided. If zoom isn't provided, the map will zoom to level 17.
     * @param {L.LatLng} latLng
     * @param {Number} zoom
     */
    centerAndZoom: function(latLng, zoom) {
      map.setView(latLng, zoom);
    },
    /**
     *
     * @return {L.LatLng}
     */
    getCenter: function() {
      return map.getCenter();
    },
    /**
     *
     */
    getParentDiv: function() {
      return document.getElementById('npmap');
    },
    /**
     *
     * @return {Number}
     */
    getZoom: function() {
      return map.getZoom();
    },
    /**
     * Handles any necessary sizing and positioning for the map when its div is resized.
     */
    handleResize: function(callback) {
      map.invalidateSize();
      
      if (callback) {
        callback();
      }
    },
    /**
     * Is the map loaded and ready to be interacted with programatically?
     */
    isReady: true,
    /**
     * Converts a {L.LatLng} to the NPMap representation of a latitude/longitude string.
     * @param latLng {L.LatLng} The object to convert to a string.
     * @return {String} A latitude/longitude string in "latitude,longitude" format.
     */
    latLngToString: function(latLng) {
      return latLng.lat + ',' + latLng.lng;
    },
    /**
     * The {L.Map} object. This reference should be used to access any of the Leaflet functionality that can't be done through NPMap's API.
     */
    Map: map,
    /**
     * Pans the map horizontally and vertically based on the pixels passed in.
     * @param {Object} pixels
     */
    panByPixels: function(pixels) {
      map.panBy(new L.Point(-pixels.x, -pixels.y));
    },
    /**
     * Zooms the map in by one zoom level.
     */
    zoomIn: function() {
      map.zoomIn();
    },
    /**
     * Zooms the map out by one zoom level.
     */
    zoomOut: function() {
      map.zoomOut();
    },
    /**
     * Zooms the map to its initial extent.
     */
    // TODO: Renamed to "toInitialExtent".
    zoomToInitialExtent: function() {
      map.setView(center, zoom);
    }
  };
});