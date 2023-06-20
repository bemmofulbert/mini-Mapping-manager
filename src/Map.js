import {Map, View,Feature} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { apply } from 'ol-mapbox-style';
import LayerGroup from 'ol/layer/Group';
import { toLonLat,fromLonLat,transform, Projection } from 'ol/proj'
import { PointMap } from './Point.js'
import { Route,MouseRouteListenner } from './Route'
import olPopup from 'ol-popup';
import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { geocode,reverseGeocode } from "@esri/arcgis-rest-geocoding";
import VectorLayer from "ol/layer/Vector";
import GeoJSONFeature from "ol/format/GeoJSON"
import VectorSource from "ol/source/Vector";
import { Circle, Style,Fill,Text,Stroke } from "ol/style";
import { apiKey } from './config.js';
import { CircleSearch } from './CircleSearch.js';
import { list_search } from './ListSearch.js';




const baseUrl = "https://basemaps-api.arcgis.com/arcgis/rest/services/styles";
const url = (name) => `${baseUrl}/${name}?type=style&token=${apiKey}`;

//Creation de la carte
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 6
  })
});


const placesLayer = new VectorLayer({
  source: new VectorSource(),
  style: (feature) =>
            new Style({
              image: new Circle({
                radius: 5,
                fill: new Fill({ color: feature.get("color")|| "lightgreen" }),
                stroke: new Stroke({ color: "hsl(220, 80%, 40%)", width: 2 })
              }),
              text: new Text({
                font: "14px sans-serif",
                textAlign: "left",
                text: feature.get("address") || feature.name || "Proche",
                offsetX: 8, // bouge le texte vers la droite
                offsetY: 2, // bouge le texte vers le bas
                fill: new Fill({ color: "hsl(220, 80%, 40%)" }),
                stroke: new Stroke({ color: "white" })
              })
            }),
          declutter: true
});
const searchArea = new VectorLayer();
//---------------------Routes
let route  = new Route(map) 
MouseRouteListenner(map,route)
const setBasemap = (name) => {
	map.setLayerGroup(new LayerGroup());
 
	apply(map, url(name)).then((map)=> {
    //new PointMap(map,11.516667, 3.866667)

    route.onSetBaseMap()
    map.addLayer(placesLayer);
    map.addLayer(searchArea)   
  })
  
};
  setBasemap(document.getElementById("basemaps").value);  
const basemapsSelectElement = document.getElementById("basemaps");
basemapsSelectElement.addEventListener("change", (e) => {
setBasemap(e.target.value);
});


export const popup = new olPopup({
  element: document.getElementById("ol-popup"),
     autoPan: true,
     autoPanAnimation: {
         duration: 250
     }
});
map.addOverlay(popup);

//------------------------------Reverse Geocode-----------------------------------

map.on("click", (e) => {

  const coords = transform(e.coordinate, "EPSG:3857", "EPSG:4326");
  const verifUserpermitInfoOnclick = document.getElementById("showInfo").checked
  if(verifUserpermitInfoOnclick)
    reverseGeocodeNow(e.coordinate,coords)
  else popup.hide();
})

var reverseGeocodeNow = (coordinate,coords) =>{
  const authentication = ApiKeyManager.fromKey(apiKey);
  reverseGeocode(coords, {
    authentication
  })
  .then((result) => {
    const message =
      `${result.address.LongLabel}<br>` + `${result.location.x.toLocaleString()}, ${result.location.y.toLocaleString()}`;

    popup.show(coordinate, message);
  })
  .catch((error) => {
    popup.hide();
    console.error(error);
  });
}
//------------------------------FinD Places-----------------------------------


let geocodeProcessing = (categorie,nombre)=>{
    const authentication = ApiKeyManager.fromKey(apiKey);
    let point = transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
      //GEOCODING
      geocode({
        authentication,
        outFields: "Place_addr,PlaceName,description",
    
        params: {
          category: categorie,
          location: point.join(","),
          maxLocations: nombre
        }
      })
      .then((response) => {
        const features = new GeoJSONFeature({ featureProjection: map.getView().getProjection() }).readFeatures(response.geoJson);

        placesLayer.getSource().clear();
        placesLayer.getSource().addFeatures(features);
        list_search(placesLayer.getSource().getFeatures());
        console.log(categorie)
      })
      .catch((error) => {
        alert("Un probleme est survenu pendant l'utilisation du Geocoder");
        console.error(error);
      });
}

/////////////////////////////////Circle Search --------------////////////
var circleSearch = new CircleSearch(map,searchArea,placesLayer,750)
function showPlaces() {
  // verifions si la precision est activee
  const precis = document.getElementById("checkCircleSearch").checked
  if(precis) {
    circleSearch.FindPlaces();
    return;
  }
  //-----------
  const categorie = document.getElementById("places-select").value;
  const nombre = document.getElementById("numPlace").value;
  if(nombre != null && nombre != undefined){
    geocodeProcessing(categorie,nombre)
  }
}
document.getElementById("places-select").addEventListener("change", showPlaces);
document.getElementById("numPlace").addEventListener("change", showPlaces);

//------------------------GO TO SPECIFIC Position---------------------------------
var goToSpecificPosition = ()=>{
  var lon = document.getElementById("lon").value
  var lat = document.getElementById("lat").value
  var zoom = document.getElementById("zoom").value
  if(route.exists(lon) && route.exists(lat) && route.exists(zoom)){
    const size = map.getSize();
    //map.getView().setCenter(fromLonLat([lon,lat]))
    //map.getView().setZoom(zoom)
    map.getView().animateInternal({
      center:fromLonLat([lon,lat]),
      zoom: zoom
    })


    const authentication = ApiKeyManager.fromKey(apiKey);
  reverseGeocode(([lon,lat]), {
    authentication
  })
  .then((result) => {
    const message =
      `${result.address.LongLabel}` + `${result.location.x.toLocaleString()}, ${result.location.y.toLocaleString()}`;

    document.title = message
    
  })
  .catch ((error)=>{
    alert("un probleme est survenu lors de l'utilisation du reverse geocoder")
    console.log(error)
  })
   
  }
}
goToSpecificPosition()
document.getElementById("lon").addEventListener("click",goToSpecificPosition)
document.getElementById("lat").addEventListener("click",goToSpecificPosition)
document.getElementById("zoom").addEventListener("click",goToSpecificPosition)

// Reactivite rien de plus
map.on('moveend', function(e) {
  var newZoom = map.getView().getZoom();
  if (document.getElementById("zoom").value != newZoom) {
    document.getElementById("zoom").value = newZoom
  }

  var newCoords = transform( map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
  var newLon = newCoords[0]
  var newLat = newCoords[1]
  if (document.getElementById("lon").value != newLon) {
    document.getElementById("lon").value = newLon
  }
  if (document.getElementById("lat").value != newLat) {
    document.getElementById("lat").value = newLat
  }
});
document.getElementById("butMarker").addEventListener("click",(e)=>{
  var lon = document.getElementById("lon").value
  var lat = document.getElementById("lat").value
  if(route.exists(lon) && route.exists(lat))
    new PointMap(map,lat,lon,"","green")
})

//--- Ma Position -------------------
document.getElementById("myPos").addEventListener("click",(e)=>{
  if (!navigator.geolocation) {
      console.log('Geolocation API not supported by this browser.');
    } else {
      console.log('Checking location...');
      navigator.geolocation.getCurrentPosition((position)=>{
        //GET YOUR LOCATION
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      new PointMap(map,lon, lat)
      document.getElementById("lon").value = lon;
      document.getElementById("lat").value = lat;
      goToSpecificPosition()
      },
      ()=>{
        alert("Impossible d'acceder a votre position")
      });
    }
})





