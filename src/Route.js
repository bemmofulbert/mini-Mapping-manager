
import { toLonLat,fromLonLat,transform } from 'ol/proj'
import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { solveRoute } from '@esri/arcgis-rest-routing';
import VectorLayer from "ol/layer/Vector";
import GeoJSONFeature  from 'ol/format/GeoJSON.js';
import VectorSource from "ol/source/Vector";
import { Circle, Style,Fill,Text,Stroke } from "ol/style";
import { apiKey } from './config.js';

const geojson = new GeoJSONFeature({
    defaultDataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857"
});

export function MouseRouteListenner(map,route){
    let currentStep = "start";
   
    map.on("click", (e) => {
        if(document.getElementById("SearchRoute").checked){
            const coordinates = transform(e.coordinate, "EPSG:3857", "EPSG:4326");

            if (currentStep === "start") {

                route.startCoords = coordinates;
                route.drawStart()
        
                // supprimer la fin des coordonnees si la route a deja ete defini
                if (route.endCoords) {
                    route.endCoords = null;
                    route.endLayer.getSource().clear();
        
                }
        
                currentStep = "end";
            } else {
        
                
                route.endCoords = coordinates;
                route.drawEnd();
                currentStep = "start";
                route.updateRoute(route.startCoords,route.endCoords)    
            }
        }
    });

    
}

export class Route {
    startLayer
    endLayer
    routeLayer
    routeLayer
    map
    startCoords = null
    endCoords = null
    addCircleLayers = ()=> {

        this.startLayer = new VectorLayer({
          style: new Style({
            image: new Circle({
              radius: 6,
              fill: new Fill({ color: "white" }),
              stroke: new Stroke({ color: "black", width: 2 })
            }),
            text: new Text({
                font: "10px sans-serif",
                textAlign: "left",
                text: "start",
                offsetX: 8, // bouge le texte vers la droite
                offsetY: 2, // bouge le texte vers le bas
                fill: new Fill({ color: "hsl(220, 80%, 40%)" }),
                stroke: new Stroke({ color: "white" })
              })
          })
        });
        this.map.addLayer(this.startLayer);

        this.endLayer = new VectorLayer({
          style: new Style({
            image: new Circle({
              radius: 7,
              fill: new Fill({ color: "black" }),
              stroke: new Stroke({ color: "white", width: 2 })
            }),
            text: new Text({
                font: "10px sans-serif",
                textAlign: "left",
                text: "end",
                offsetX: 8, // bouge le texte vers la droite
                offsetY: 2, // bouge le texte vers le bas
                fill: new Fill({ color: "hsl(220, 80%, 40%)" }),
                stroke: new Stroke({ color: "white" })
              })
          })
        });

        this.map.addLayer(this.endLayer);

      }
    

    addRouteLayer = () =>{
        this.routeLayer = new VectorLayer({
          style: new Style({
            stroke: new Stroke({ color: "hsl(205, 100%, 50%)", width: 4, opacity: 0.6 })
          })
        });

        this.map.addLayer(this.routeLayer);
      }

    constructor(map) {
        this.map = map;

        this.addCircleLayers();
        this.addRouteLayer();
        
    }

    updateRoute = () => {
        if(this.exists(this.startCoords) && this.exists(this.endCoords) ){
            const authentication = ApiKeyManager.fromKey(apiKey);

            solveRoute({
                stops: [this.startCoords, this.endCoords],
                authentication
            })
            .then((response) => {
                this.routeLayer.setSource(
                new VectorSource({
                    features: geojson.readFeatures(response.routes.geoJson)
                })
                );
            })
            .catch((error) => {
                alert("Un probleme est survenu durant l'utilisation du routing geocoder");
                console.error(error);
            });
        }

      }
    drawStart(){
        if(this.exists(this.startCoords) && this.exists(this.startLayer) ){
            let coordinates = this.startCoords
            const point = {
                type: "Point",
                coordinates
            };
            this.startLayer.setSource(
                new VectorSource({
                    features: geojson.readFeatures(point)
                })
            );
        }
    }
    exists(obj){
        if(obj !== null && obj!==undefined) return true;
        else return false;
    }
    drawEnd(){
        if(this.exists(this.endCoords) && this.exists(this.endLayer) ){
            let coordinates = this.endCoords
            const point = {
                type: "Point",
                coordinates
            };
            this.endLayer.setSource(
                new VectorSource({
                    features: geojson.readFeatures(point)
                })
            );
        }
    }
    onSetBaseMap(){
        this.addCircleLayers();
        this.addRouteLayer();
        this.drawStart();
        this.drawEnd();
        this.updateRoute();
    }
}