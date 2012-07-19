﻿define([
  'Map/Map'
], function(Map) {
  var
      // The initially-active base layer.
      activeBaseLayer,
      // The current bounds of the map.
      bounds,
      // An array of the default base layers for the Google baseAPI.
      DEFAULT_BASE_LAYERS = [{
        code: 'HYBRID',
        type: 'Aerial'
      },{
        code: 'ROADMAP',
        type: 'Street'
      },{
        code: 'SATELLITE',
        type: 'Aerial'
      },{
        code: 'TERRAIN',
        type: 'Topo'
      }],
      // Helps handle map single and double-click events.
      doubleClicked = false,
      // The initial bounds of the map.
      initialBounds,
      // Is there at least one clustered layer in the map?
      clustered = NPMap.Map.hasClusteredLayer(),
      // The initial center latitude/longitude of the map.
      initialCenter,
      // The initial zoom level of the map.
      initialZoom,
      // The map object.
      map,
      // The map config object.
      mapConfig,
      // The initial mapTypeId of the map.
      mapTypeId,
      // An array of mapTypeIds for the map.
      mapTypeIds = [],
      // The max zoom level for the map.
      max = 19,
      // The min zoom level for the map.
      min = 0,
      // The last zoom level.
      oldZoom,
      // An overlay object to use to convert points to latLngs and back.
      overlay = null,
      // Is there at least one tiled layer in the map?
      tiled = NPMap.Map.hasTiledLayer(),
      // What should NPMap use to set the initial center and zoom level?
      use = 'bbox';
  
  /**
   * Converts a 0-255 opacity to 0-1.0.
   * @param {Number} opacity
   */
  function convertOpacity(opacity) {
    return (opacity / 25.5) * 0.1;
  }
  /**
   * Hooks up a google.maps.event click handler to a shape.
   * @param {Object} shape
   */
  function hookUpShapeClickHandler(shape) {
    google.maps.event.addListener(shape, 'click', function(e) {
      e.shape = shape;
      NPMap.Event.trigger('NPMap.Map', 'shapeclick', e);
    });
  }

  if (NPMap.config.center && NPMap.config.zoom) {
    use = 'centerAndZoom';
  }
  
  if (NPMap.config.baseLayers) {
    $.each(NPMap.config.baseLayers, function(i, v) {
      if (v.visible) {
        activeBaseLayer = v;
      }
      
      if (v.code === 'roadmap' || v.code === 'satellite' || v.code === 'terrain') {
        mapTypeIds.push(google.maps.MapTypeId[v.code.toUpperCase()]);
      } else {
        mapTypeIds.push(v.code);
      }
    });
  }
  
  if (activeBaseLayer) {
    if (activeBaseLayer.code === 'roadmap' || activeBaseLayer.code === 'satellite' || activeBaseLayer.code === 'terrain') {
      mapTypeId = google.maps.MapTypeId[activeBaseLayer.code.toUpperCase()];
    } else {
      mapTypeId = activeBaseLayer.code;
    }
  } else {
    activeBaseLayer = {
      code: 'terrain',
      visible: true
    };
    mapTypeId = google.maps.MapTypeId.TERRAIN;

    NPMap.config.baseLayers = [
      activeBaseLayer
    ];
  }
  
  mapConfig = {
    disableDefaultUI: true,
    draggable: (function() {
      if (NPMap.Util.doesPropertyExist(NPMap, 'NPMap.config.tools.mouse.draggable')) {
        return NPMap.config.tools.mouse.draggable;
      } else {
        return true;
      }
    })(),
    keyboardShortcuts: (function() {
      if (NPMap.Util.doesPropertyExist(NPMap, 'NPMap.config.tools.keyboard')) {
        return NPMap.config.tools.keyboard;
      } else {
        return true;
      }
    })(),
    mapTypeControl: false,
    mapTypeId: mapTypeId,
    noClear: true,
    panControl: false,
    scaleControl: (function() {
      if (NPMap.Util.doesPropertyExist(NPMap, 'NPMap.config.tools.controls.scaleBar')) {
        if (NPMap.config.tools.controls.scaleBar === true) {
          mapConfig.scaleControlOptions = {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
            style: google.maps.ScaleControlStyle.DEFAULT
          };
        }

        return NPMap.config.tools.controls.scaleBar;
      } else {
        return false;
      }
    })(),
    scrollWheel: (function() {
      if (NPMap.Util.doesPropertyExist(NPMap, 'NPMap.config.tools.mouse.scrollWheel')) {
        return NPMap.config.tools.mouse.scrollWheel;
      } else {
        return true;
      }
    })(),
    streetViewControl: false,
    zoomControl: false
  };
  
  if (use === 'bbox') {
    initialBounds = new google.maps.LatLngBounds(new google.maps.LatLng(29.713, -111), new google.maps.LatLng(46.82, -79));
    map = new google.maps.Map(document.getElementById(NPMap.config.div), mapConfig);
    map.fitBounds(initialBounds);
  } else {
    mapConfig.center = initialCenter = new google.maps.LatLng(NPMap.config.center.lat, NPMap.config.center.lng);
    mapConfig.zoom = initialZoom = NPMap.config.zoom;
    map = new google.maps.Map(document.getElementById('npmap'), mapConfig);
  }
  
  $.each(NPMap.config.baseLayers, function(i, v) {
    if (v.code != 'roadmap' || v.code != 'satellite' || v.code != 'terrain') {
      map.mapTypes.set(v.code, new google.maps.StyledMapType(v.style, {
        alt: v.alt ? v.alt : null,
        name: v.name
      }));
    }
  });
  
  var interval = setInterval(function() {
    bounds = map.getBounds();
    
    if (bounds) {
      clearInterval(interval);
      
      var enableKeyDragZoom;
      
      (function() {
        // TODO: Make this configurable.
        eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(4(){2 r=4(a){2 b;1P(a){U\'29\':b="32";R;U\'2O\':b="2E";R;U\'2v\':b="2o";R;2j:b=a}B b};2 q=4(h){2 b;2 a={};7(u.1q&&u.1q.1R){b=h.2J.1q.1R(h,"");7(b){a.s=A(b.1J,10)||0;a.T=A(b.1C,10)||0;a.9=A(b.2c,10)||0;a.13=A(b.25,10)||0;B a}}1c 7(u.12.V){7(h.V){a.s=A(r(h.V.1J),10)||0;a.T=A(r(h.V.1C),10)||0;a.9=A(r(h.V.2c),10)||0;a.13=A(r(h.V.25),10)||0;B a}}a.s=A(h.3["1a-s-Q"],10)||0;a.T=A(h.3["1a-T-Q"],10)||0;a.9=A(h.3["1a-9-Q"],10)||0;a.13=A(h.3["1a-13-Q"],10)||0;B a};2 o=4(e){2 a=0,1i=0;e=e||1U.t;7(W e.1Q!=="S"){a=e.1Q;1i=e.2A}1c 7(W e.1M!=="S"){a=e.1M+(W u.12.1h!=="S"?u.12.1h:u.1p.1h);1i=e.2t+(W u.12.1g!=="S"?u.12.1g:u.1p.1g)}B{9:a,s:1i}};2 l=4(h){2 a=h.1H;2 b=h.1F;2 c=h.1E;2i(c!==M){7(c!==u.1p&&c!==u.12){a-=c.1h;b-=c.1g}a+=c.1H;b+=c.1F;c=c.1E}B{9:a,s:b}};2 n=4(a,b){7(a&&b){2f(2 x 39 b){7(b.38(x)){a[x]=b[x]}}}B a};2 m=4(a,b){7(W b!==\'S\'){a.3.1e=b}7(W a.3.1e!==\'S\'){a.3.35="34(1e="+(a.3.1e*33)+")"}};4 C(a,d){2 c=J 5.6.2V();2 b=1;c.2U=4(){b.1W(a,d)};c.2T=4(){};c.2S=4(){};c.2Q(a);1.1j=c}C.w.1W=4(c,a){1.z=c;a=a||{};1.H=a.2N||\'1k\';1.H=1.H.2L();1.N=q(1.z.G());1.8=u.1Z("23");1.8.2D=4(){B I};n(1.8.3,{1w:\'1N\',1e:0.0,2y:\'2x\'});n(1.8.3,a.2w);n(1.8.3,{1K:\'1I\',2u:\'2s\',2r:2q,K:\'P\'});7(1.H===\'1k\'){1.8.3.2p="P"}m(1.8);7(1.8.3.1w===\'2n\'){1.8.3.1w=\'1N\';m(1.8,0)}1.z.G().1G(1.8);1.v=u.1Z(\'23\');n(1.v.3,{1a:\'29 2m #2l\'});n(1.v.3,a.2k);n(1.v.3,{1K:\'1I\',K:\'P\'});m(1.v);1.z.G().1G(1.v);1.15=q(1.v);2 b=1;1.1D=5.6.t.Z(u,\'2h\',4(e){b.1B(e)});1.1A=5.6.t.Z(u,\'2g\',4(e){b.1z(e)});1.1y=5.6.t.Z(1.8,\'24\',4(e){b.2e(e)});1.2d=5.6.t.Z(u,\'24\',4(e){b.2b(e)});1.2a=5.6.t.Z(u,\'37\',4(e){b.28(e)});1.27=5.6.t.Z(u,\'36\',4(e){b.26(e)});1.O=I;1.X=I;1.E=M;1.F=M;1.1x=M;1.1v=M;1.1o=M;1.1d=l(1.z.G());1.1n=I};C.w.22=4(e){2 a;e=e||1U.t;a=(e.31&&1.H===\'1k\')||(e.30&&1.H===\'21\')||(e.2Y&&1.H===\'20\');7(!a){1P(e.2X){U 16:7(1.H===\'1k\'){a=11}R;U 17:7(1.H===\'20\'){a=11}R;U 18:7(1.H===\'21\'){a=11}R}}B a};C.w.1Y=4(){2 c=1.1o;7(c){2 a=1.1d;2 b=1.z.G();B c.9>a.9&&c.9<a.9+b.1X&&c.s>a.s&&c.s<a.s+b.1L}1c{B I}};C.w.1u=4(){7(1.z&&1.O&&1.1Y()){2 a=1.z.G();1.8.3.9=0+\'L\';1.8.3.s=0+\'L\';1.8.3.Q=a.1X-(1.N.9+1.N.13)+\'L\';1.8.3.1t=a.1L-(1.N.s+1.N.T)+\'L\';1.8.3.K=\'1V\';1.1x=A(1.8.3.Q,10)-(1.15.9+1.15.13);1.1v=A(1.8.3.1t,10)-(1.15.s+1.15.T)}1c{1.8.3.K=\'P\'}};C.w.1B=4(e){2 a=1;7(1.z&&!1.O&&1.22(e)){a.O=11;a.1u();5.6.t.1f(a,\'2R\')}};C.w.1s=4(e){2 a=o(e);2 p=J 5.6.19();p.x=a.9-1.1d.9-1.N.9;p.y=a.s-1.1d.s-1.N.s;p.x=D.Y(p.x,1.1x);p.y=D.Y(p.y,1.1v);p.x=D.1T(p.x,0);p.y=D.1T(p.y,0);B p};C.w.2e=4(e){7(1.z&&1.O){1.1d=l(1.z.G());1.X=11;1.E=1.F=1.1s(e);2 a=1.1j.1S();2 b=a.1r(1.E);5.6.t.1f(1,\'2P\',b)}};C.w.2b=4(e){1.1n=11};C.w.28=4(e){1.1o=o(e);7(1.X){1.F=1.1s(e);2 b=D.Y(1.E.x,1.F.x);2 a=D.Y(1.E.y,1.F.y);2 c=D.1l(1.E.x-1.F.x);2 d=D.1l(1.E.y-1.F.y);1.v.3.9=b+\'L\';1.v.3.s=a+\'L\';1.v.3.Q=c+\'L\';1.v.3.1t=d+\'L\';1.v.3.K=\'1V\';5.6.t.1f(1,\'2M\',J 5.6.19(b,a+d),J 5.6.19(b+c,a))}1c 7(!1.1n){1.1u()}};C.w.26=4(e){1.1n=I;7(1.X){2 i=D.Y(1.E.x,1.F.x);2 c=D.Y(1.E.y,1.F.y);2 j=D.1l(1.E.x-1.F.x);2 a=D.1l(1.E.y-1.F.y);2 k=1.1j.1S();2 g=l(1.z.G());2 d=l(1.1j.2K().2W);i=i+(g.9-d.9);c=c+(g.s-d.s);2 b=k.1r(J 5.6.19(i,c+a));2 h=k.1r(J 5.6.19(i+j,c));2 f=J 5.6.2I(b,h);1.z.2H(f);1.X=I;1.v.3.K=\'P\';5.6.t.1f(1,\'2Z\',f)}};C.w.1z=4(e){7(1.z&&1.O){1.O=I;1.X=I;1.v.3.K=\'P\';1.8.3.K="P";5.6.t.1f(1,\'2G\')}};5.6.1m.w.2F=4(a){1.1b=J C(1,a)};5.6.1m.w.2C=4(){2 d=1.1b;7(d){5.6.t.14(d.1y);5.6.t.14(d.2d);5.6.t.14(d.2a);5.6.t.14(d.27);5.6.t.14(d.1A);5.6.t.14(d.1D);1.G().1O(d.v);1.G().1O(d.8);1.1b=M}};5.6.1m.w.2B=4(){B 1.1b!==M};5.6.1m.w.2z=4(){B 1.1b}})();',62,196,'|this|var|style|function|google|maps|if|paneDiv_|left|||||||||||||||||||top|event|document|boxDiv_|prototype|||map_|parseInt|return|DragZoom|Math|startPt_|endPt_|getDiv|key_|false|new|display|px|null|borderWidths_|hotKeyDown_|none|width|break|undefined|bottom|case|currentStyle|typeof|dragging_|min|addDomListener||true|documentElement|right|removeListener|boxBorderWidths_||||Point|border|dragZoom_|else|mapPosn_|opacity|trigger|scrollTop|scrollLeft|posY|prjov_|shift|abs|Map|mouseDown_|mousePosn_|body|defaultView|fromDivPixelToLatLng|getMousePoint_|height|setPaneVisibility_|boxMaxY_|backgroundColor|boxMaxX_|mouseDownListener_|onKeyUp_|keyUpListener_|onKeyDown_|borderBottomWidth|keyDownListener_|offsetParent|offsetTop|appendChild|offsetLeft|absolute|borderTopWidth|position|offsetHeight|clientX|white|removeChild|switch|pageX|getComputedStyle|getProjection|max|window|block|init_|offsetWidth|isMouseOnMap_|createElement|ctrl|alt|isHotKeyDown_|div|mousedown|borderRightWidth|onMouseUp_|mouseUpListener_|onMouseMove_|thin|mouseMoveListener_|onMouseDownDocument_|borderLeftWidth|mouseDownListenerDocument_|onMouseDown_|for|keyup|keydown|while|default|boxStyle|FF0000|solid|transparent|6px|MozUserSelect|10001|zIndex|hidden|clientY|overflow|thick|paneStyle|crosshair|cursor|getDragZoomObject|pageY|keyDragZoomEnabled|disableKeyDragZoom|onselectstart|4px|enableKeyDragZoom|deactivate|fitBounds|LatLngBounds|ownerDocument|getPanes|toLowerCase|drag|key|medium|dragstart|setMap|activate|onRemove|draw|onAdd|OverlayView|mapPane|keyCode|ctrlKey|dragend|altKey|shiftKey|2px|100|alpha|filter|mouseup|mousemove|hasOwnProperty|in'.split('|'),0,{}))
        
        enableKeyDragZoom = function() {
          map.enableKeyDragZoom({
            boxStyle: {
              border: '3px solid #cc9900'
            }
          });
        };
      })();

      enableKeyDragZoom();

      function inEasternOrWesternHemisphere(lng) {
        if (lng < 0) {
          return 'western';
        } else {
          return 'eastern';
        }
      }
      
      if (!initialBounds) {
        initialBounds = map.getBounds();
      }
      
      if (!initialCenter) {
        initialCenter = map.getCenter();
      }
      
      if (!initialZoom) {
        initialZoom = map.getZoom();
      }
      
      if (NPMap.config.restrictToBoundingBox) {
        google.maps.event.addListener(map, 'center_changed', function() {
          if (!bounds.contains(map.getCenter())) {
            var c = map.getCenter(),
                lat = c.lat(),
                lng = c.lng(),
                maxX = bounds.getNorthEast().lng(),
                maxY = bounds.getNorthEast().lat(),
                minX = bounds.getSouthWest().lng(),
                minY = bounds.getSouthWest().lat();
            
            if (lng < minX) {
              lng = minX;
            }
            
            if (lng > maxX) {
              lng = maxX;
            }
            
            if (lat < minY) {
              lat = minY;
            }
            
            if (lat > maxY) {
              lat = maxY;
            }
            
            map.setCenter(new google.maps.LatLng(centerLat, centerLng));
          }
        });
      }
      
      /*
      if (NPMap.config.restrictZoom) {
        if (NPMap.config.restrictZoom.max) {
          var max;
      
          if (NPMap.config.restrictZoom.max === 'auto') {
            max = initialZoom;
          } else {
            max = NPMap.config.restrictZoom.max;
          }
           
          map.setOptions({
            maxZoom: max
          });
        }
        
        if (NPMap.config.restrictZoom.min) {
          var min;
          
          if (NPMap.config.restrictZoom.min === 'auto') {
            min = initialZoom;
          } else {
            min = NPMap.config.restrictZoom.min;
          }
          
          map.setOptions({
            minZoom: min
          });
        }
      }
      
      if (NPMap.config.restrictZoom) {
        max = NPMap.config.restrictZoom.max;
        
        if (NPMap.config.restrictZoom.min === 'auto') {
          min = initialZoom;
        } else {
          min = NPMap.config.restrictZoom.min;
        }
        
        google.maps.event.addListener(NPMap.Map.Google.Map, 'zoom_changed', function() {
          var currentZoom = NPMap.Map.Google.Map.getZoom();
          
          if (currentZoom < min) {
            NPMap.Map.Google.Map.setZoom(min);
          } else if (currentZoom > max) {
            NPMap.Map.Google.Map.setZoom(max);
          }
        });
      }
      */
      
      /*
      google.maps.event.addListener(NPMap.Map.Google.Map, 'center_changed', function() {
        var bounds = NPMap.Map.Google.Map.getBounds(),
            center = NPMap.Map.Google.Map.getCenter(),
            ne = bounds.getNorthEast(),
            sw = bounds.getSouthWest(),
            neHemisphere = inEasternOrWesternHemisphere(ne.lng()),
            swHemisphere = inEasternOrWesternHemisphere(sw.lng());
        
        if (swHemisphere === 'eastern' && neHemisphere === 'western') {
          var plus;
          
          if (sw.lng() > 0) {
             plus = 180 - sw.lng();
          } else {
             plus = 180 + sw.lng();
          }
          
          plus++;
          
          NPMap.Map.Google.Map.setCenter(new google.maps.LatLng(center.lat(), center.lng() + plus));
        }
      });
      */
      
      google.maps.event.addListener(map, 'center_changed', function() {
        if (NPMap.InfoBox.visible) {
          NPMap.InfoBox.reposition();
        }
      });
      google.maps.event.addListener(map, 'click', function(e) {
        doubleClicked = false;
        
        setTimeout(function() {
          if (!doubleClicked) {
            NPMap.Event.trigger('NPMap.Map', 'click', e);
          }
        }, 250);
      });
      google.maps.event.addListener(map, 'dblclick', function(e) {
        doubleClicked = true;
        NPMap.Event.trigger('NPMap.Map', 'doubleclick', e);
      });
      google.maps.event.addListener(map, 'drag', function() {
        if (NPMap.InfoBox.visible) {
          NPMap.InfoBox.reposition();
        }
      });
      google.maps.event.addListener(map, 'zoom_changed', function(e) {
        var zoom = map.getZoom();
        
        if (zoom != oldZoom) {
          if (zoom === max) {
            map.disableKeyDragZoom();
          } else {
            enableKeyDragZoom();
          }
          
          if (NPMap.InfoBox.visible) {
            if (clustered || tiled) {
              NPMap.InfoBox.hide();
            } else {
              NPMap.InfoBox.reposition();
            }
          }

          NPMap.Event.trigger('NPMap.Map', 'zoomchanged');
        }
        
        oldZoom = zoom;
      });
      
      var intHtml = setInterval(function() {
            var a = $('a[title="Click to see this area on Google Maps"]');
            
            if (a.length > 0) {
              var d = $(a.parent().next().children()[0]),
                  attribution = $(d).html();
              
              function setAttribution(attr) {
                NPMap.Map.setAttribution(attr);
              }
              
              clearInterval(intHtml);
              
              a.parent().hide();
              d.hide();
              
              setAttribution(attribution);
              
              intHtml = setInterval(function() {
                a = $(d).html();
                
                if (a !== attribution) {
                  setAttribution(a);
                  attribution = a;
                }
              }, 500);
            }
          }, 500),
          intOverlay = setInterval(function() {
            if (!overlay) {
              try {
                overlay = new google.maps.OverlayView();
                overlay.draw = function() {};
                overlay.setMap(map);
              } catch(e) {
                
              }
            } else {
              clearInterval(intOverlay);
            }
          }, 100);
      
      Map._init();
      
      NPMap.Map.Google._isReady = true;
    }
  }, 5);

  return NPMap.Map.Google = {
    // Is the map loaded and ready to be interacted with programatically?
    _isReady: false,
    // The google.maps.Map object.
    map: map,
    /**
     * Adds a base layer to the map.
     * @param baseLayer An object with code, name, and visible properties.
     */
    addBaseLayer: function(baseLayer) {
      if (baseLayer.visible) {
        this.switchBaseLayer(baseLayer.code);
      }
      
      return baseLayer;
    },
    /**
     * Adds a shape to the map.
     * @param {Object} shape The shape to add to the map. This can be a google.maps.Marker, Polyline, Polygon, Rectangle, or Circle object.
     */
    addShape: function(shape) {
      shape.setMap(map);
    },
    /**
     * Zooms to the center and zoom provided. If zoom isn't provided, the map will zoom to level 17.
     * @param {google.maps.LatLng} latLng
     * @param {Number} zoom
     */
    centerAndZoom: function(latLng, zoom) {
      if (zoom) {
        map.setZoom(zoom);
      } else {
        map.setZoom(17);
      }
      
      map.setCenter(latLng);
    },
    /**
     *
     */
    convertLineOptions: function(options) {

    },
    /**
     * Valid Google Maps options: animation, clickable, cursor, draggable, flat, icon, map, optimized, position, raiseOnDrag, shadow, shape, title, visible, zIndex
     */
    convertMarkerOptions: function(options) {
      var o = {};

      if (options.url) {
        var anchor = options.anchor,
            height = options.height,
            width = options.width;

        if (!anchor) {
          anchor = {
            x: width / 2,
            y: 0
          };
        }

        // TODO: If you don't have the height/width here, you need to load image and calculate height/width before moving on.
        o.icon = new google.maps.MarkerImage(options.url, new google.maps.Size(width, height), null, new google.maps.Point(anchor.x, anchor.y));
      }

      return o;
    },
    /**
     * Valid Google Maps options: clickable, editable, fillColor, fillOpacity, geodesic, map, paths, strokeColor, strokeOpacity, strokeWeight, visible, zIndex
     */
    convertPolygonOptions: function(options) {
      var o = {};

      if (options.fillColor) {
        o.fillColor = options.fillColor;
      }

      if (options.fillOpacity) {
        o.fillOpacity = convertOpacity(options.fillOpacity);
      }

      if (options.strokeColor) {
        o.strokeColor = options.strokeColor;
      }

      if (options.strokeOpacity) {
        o.strokeOpacity = convertOpacity(options.strokeOpacity);
      }
      
      if (options.strokeWidth) {
        o.strokeWeight = options.strokeWidth;
      }
      
      return o;
    },
    /**
     * Creates a google.maps.Polyline object.
     * @param {Array} latLngs An array of google.maps.LatLng objects.
     * @param {Object} options (Optional) Any additional options to apply to the polygon.
     * @return {google.maps.Polygon}
     */
    createLine: function(latLngs, options) {
      var line;

      options = options || {};
      options.path = latLngs;
    },
    /**
     * Creates a google.maps.Marker object.
     * @param {Object} latLng Where to place the marker.
     * @param {Object} options (Optional) Any additional options to apply to the marker.
     * @return {google.maps.Marker}
     */
    createMarker: function(latLng, options) {
      var marker;

      options = options || {};
      options.position = latLng;
      marker = new google.maps.Marker(options);

      hookUpShapeClickHandler(marker);

      return marker;
    },
    /**
     * Creates a google.maps.Polygon object.
     * @param {Array} latLngs An array of google.maps.LatLng objects.
     * @param {Object} options Any additional options to apply to the polygon.
     * @return {google.maps.Polygon}
     */
    createPolygon: function(latLngs, options) {
      var polygon;

      options = options || {};
      options.paths = latLngs;
      polygon = new google.maps.Polygon(options);

      hookUpShapeClickHandler(polygon);

      return polygon;
    },
    /**
     * Gets a shape from an event object.
     * @param {Object} e
     */
    eventGetShape: function(e) {
      return e.shape;
    },
    /**
     * Gets a latLng from an event object.
     * @param {Object} e
     */
    eventGetLatLng: function(e) {
      return e.latLng;
    },
    /**
     * Gets the center {google.maps.LatLng} of the map.
     * @return {google.maps.LatLng}
     */
    getCenter: function() {
      return map.getCenter();
    },
    /**
     * Gets the latLng (google.maps.LatLng) of the #npmap-clickdot div element.
     * @return {google.maps.LatLng}
     */
    getClickDotLatLng: function() {
      var position = $('#npmap-clickdot').position();
      
      return this.getLatLngFromPixel(new google.maps.Point(position.left, position.top));
    },
    /**
     * Gets the container div.
     */
    getContainerDiv: function() {
      return map.getDiv();
    },
    /**
     * Gets a {google.maps.LatLng} from a {google.maps.Point}.
     * @param {google.maps.Point} point
     * @return {google.maps.LatLng}
     */
    getLatLngFromPixel: function(point) {
      return overlay.getProjection().fromContainerPixelToLatLng(point);
    },
    /**
     * Gets the anchor of a marker.
     * @param {} (Required) The Pushpin to get the anchor for.
     * @return {Object} An object with x and y properties.
     */
    getMarkerAnchor: function(marker) {
      
    },
    /**
     * Gets the icon for a marker.
     */
    getMarkerIcon: function(marker) {
      
    },
    /**
     * Gets the latLng {google.maps.LatLng} of the marker.
     * @param {Object} marker The marker to get the latLng for.
     * @return {Object}
     */
    getMarkerLatLng: function(marker) {
      return marker.getPosition();
    },
    /**
     * Gets the maximum zoom level for this map.
     * @return {Number}
     */
    getMaxZoom: function() {
      return max;
    },
    /**
     * Gets the minimum zoom level for this map.
     * @return {Number}
     */
    getMinZoom: function() {
      return min;
    },
    /**
     * Returns a google.maps.Point object for a given latLng.
     * @param latLng {google.maps.LatLng} (Required)
     */
    getPixelFromLatLng: function(latLng) {
      return overlay.getProjection().fromLatLngToContainerPixel(latLng);
    },
    /**
     * Gets the zoom level of the map.
     * @return {Float}
     */
    getZoom: function() {
      return map.getZoom();
    },
    /**
     * Handles any necessary sizing and positioning for the map when its div is resized.
     */
    handleResize: function() {
      google.maps.event.trigger(map, 'resize');
    },
    /**
     * Tests to see if a latLng is within the map's current bounds.
     * @param latLng {Object/String} {Required} The latitude/longitude, either a {google.maps.LatLng} object or a string in "latitude,longitude" format, to test.
     * @return {Boolean}
     */
    isLatLngWithinMapBounds: function(latLng) {
      return map.getBounds().contains(latLng);
    },
    /**
     * Tests the equivalency of two {google.maps.LatLng} objects.
     * @param latLng1 {google.maps.LatLng} The first Location object.
     * @param latLng2 {google.maps.LatLng) The second Location object.
     * @returns {Boolean}
     */
    latLngsAreEqual: function(latLng1, latLng2) {
      
    },
    /**
     * Converts an API latLng object to an NPMap latLng object.
     * @param latLng {google.maps.LatLng} The object to convert.
     * @return {Object}
     */
    latLngFromApi: function(latLng) {
      return {
        lat: latLng.lat(),
        lng: latLng.lng()
      };
    },
    /**
     * Converts a lat/lng string ("latitude/longitude") or object ({x:lng,y:lat}) to an API latLng object.
     * @param {String/Object} latLng
     * @return {Object}
     */
    latLngToApi: function(latLng) {
      var lat,
          lng;

      if (typeof latLng === 'string') {
        latLng = latLng.split(',');
        lat = latLng[0];
        lng = latLng[1];
      } else {
        lat = latLng.lat;
        lng = latLng.lng;
      }
      
      return new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    },
    /**
     * Iterates through the default base layers and returns a match if it exists.
     * @param {Object} baseLayer The baseLayer object.
     * @return {Object}
     */
    matchBaseLayer: function(baseLayer) {
      for (var i = 0; i < DEFAULT_BASE_LAYERS.length; i++) {
        if (DEFAULT_BASE_LAYERS[i].code === baseLayer.code) {
          return DEFAULT_BASE_LAYERS[i];
        }
      }
      
      return null;
    },
    /**
     * Pans the map horizontally and vertically based on the pixels passed in.
     * @param {Object} pixels
     */
    panByPixels: function(pixels) {
      if (pixels.x !== 0) {
        pixels.x = -pixels.x;
      }
      
      if (pixels.y !== 0) {
        pixels.y = -pixels.y;
      }
      
      map.panBy(pixels.x, pixels.y);
    },
    /**
     * Positions the #npmap-clickdot div on top of the pushpin, lat/lng object, or lat/lng string that is passed in.
     * @param {google.maps.Marker} OR {google.maps.LatLng} OR {String} to The Pushpin, Location, or latitude/longitude string to position the div onto.
     */
    positionClickDot: function(to) {
      var offset = NPMap.Util.getMapDivOffset(),
          pixel = this.getPixelFromLatLng((function() {
            var latLng = null;

            if (typeof(to) === 'string') {
              to = to.split(',');
              latLng = new google.maps.LatLng(parseFloat(to[0]), parseFloat(to[1]));
            } else {
              if (typeof to.lat === 'number') {
                latLng = new google.maps.LatLng(to.lat, to.lng);
              } else if (typeof to.lat === 'function') {
                latLng = to;
              } else {
                latLng = to.getPosition();
              }
            }
            
            return latLng;
          })());

      $('#npmap-clickdot').css({
        left: pixel.x,
        top: pixel.y
      });
    },
    /**
     * A google.maps.MapCanvasProjection object.
     */
    projection: null,
    /**
     * Removes a shape to the map.
     * @param {Object} shape The shape to remove from the map. This can be a google.maps.Marker, Polyline, Polygon, Rectangle, or Circle object.
     */
    removeShape: function(shape) {
      shape.setMap(null);
    },
    /**
     * Sets the marker's icon.
     * @param {Object} marker
     * @param {String} The url of the marker icon.
     */
    setMarkerIcon: function(marker, url) {
      
    },
    /**
     * Switches the base map.
     * @param {Object} type The base layer to switch to. Currently only the default Google Maps base maps are supported here.
     */
    switchBaseLayer: function(baseLayer) {
      map.setMapTypeId(google.maps.MapTypeId[baseLayer.code.toUpperCase()]);
    },
    /**
     * Zooms and/or pans the map to its initial extent.
     */
    toInitialExtent: function() {
      this.centerAndZoom(initialCenter, initialZoom);
    },
    /**
     * Zooms the map in by one zoom level.
     * @param toDot {Boolean} (Optional) If true, center and zoom will be called. Center is based on #npmap-clickdot location.
     */
    zoomIn: function(toDot) {
      if (toDot) {
        var position = $('#npmap-clickdot').position(),
            latLng = this.projection.fromContainerPixelToLatLng(new google.maps.Point(position.left, position.top));
        
        this.centerAndZoom(latLng.lat() + ',' + latLng.lng(), map.getZoom() + 1);
      } else {
        map.setZoom(map.getZoom() + 1);
      }
    },
    /**
     * Zooms the map out by one zoom level.
     */
    zoomOut: function() {
      map.setZoom(map.getZoom() - 1);
    },
    /**
     * Set the center and then zoom level of the map back to the initial extent. The initial extent is automatically set when the map loads, but NPMap.Map.Google.initialCenter and NPMap.Map.Google.initialZoom can be overriden at anytime.
     */
    zoomToExtent: function() {
      map.setCenter(this.initialCenter);
      map.setZoom(this.initialZoom);
    },
    /**
     * Zooms the map to a lat/lng.
     * @param {Object} latLng The {google.maps.LatLng} object to zoom the map to.
     */
    zoomToLatLng: function(latLng) {
      this.centerAndZoom(latLng, 16);
    },
    /**
     * Zooms the map to the extent of an array of lat/lng objects.
     * @param {Array} latLngs The array of google.maps.LatLng objects.
     */
    zoomToLatLngs: function(latLngs) {
      var bounds = new google.maps.LatLngBounds();

      $.each(latLngs, function(i, v) {
        bounds.extend(v);
      });

      map.fitBounds(bounds);
    }
  };
});