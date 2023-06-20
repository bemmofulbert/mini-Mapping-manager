import { Feature } from "ol";
import { Circle,Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { findPlacesNearPoint } from "@esri/arcgis-rest-places";
import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { apiKey } from './config.js';
import { transform } from 'ol/proj'
import { list_search } from "./ListSearch.js";




export class CircleSearch {
    activeCategory = "16000"
    userLocation
    clickedPoint
    searchRadius = 1000
    unitSearchRadius = 100
    map
    area
    posI
    posF
    currentStatus = "end"
    centerSearch
    coordinate
    placesLayer
    

    constructor(map,area,placesLayer,searchRadius){
        this.map = map
        this.area = area
        this.searchRadius = searchRadius
        this.placesLayer = placesLayer

        document.getElementById("checkCircleSearch").addEventListener("click",(e)=>{
          if (!e.target.checked){
            this.centerSearch.getGeometry().setRadius(0)
          this.area.setSource(new VectorSource());
          this.currentStatus = "end"
          }

        })

        map.on("click",(e)=>{
          if(this.currentStatus == "end")
          this.coordinate = e.coordinate
        },true)
        map.getTargetElement().addEventListener('click', this.ListenerPressed)
    }
    
   

    ListenerPressed = (e) => {
      console.log("rocky")
      if(document.getElementById("checkCircleSearch").checked) {
        if (this.currentStatus == "end") {
          let userLocation = e.coordinate;
          this.posI = { x: e.pageX, y: e.pageY };
          this.centerSearch = new Feature({
            geometry: new Circle(this.coordinate, this.searchRadius*1.1)
          });
          this.map.getTargetElement().addEventListener("mousemove", this.ListenerMove)
          this.currentStatus = "middle"
        }
        else if (this.currentStatus == "middle"){
            this.map.getTargetElement().removeEventListener("mousemove",this.ListenerMove)
            this.FindPlaces()
            this.currentStatus = "begin"

            

        }else {
          this.centerSearch.getGeometry().setRadius(0)
          this.area.setSource(new VectorSource());
          this.currentStatus = "end"
        }
      }
      return true;
    }

    ListenerMove = (ev)=>{
      this.posF = { x: ev.pageX, y: ev.pageY };
      const point = this.centerSearch
      this.searchRadius = ((this.unitSearchRadius+(4*(this.posF.x-this.posI.x)))*1.1)*this.map.getView().getZoom()
      console.log()
      //On borne le radius
      if(this.searchRadius > 10000) this.searchRadius = 10000;
      if(this.searchRadius < this.unitSearchRadius) this.searchRadius = this.unitSearchRadius

      point.getGeometry().setRadius(this.searchRadius)
      this.area.setSource(new VectorSource({
          features: [point]
      }));
      //searchArea.getUpdateWhileAnimating()
      return true;
    }

    FindPlaces() {
      console.log("--------------"+this.currentStatus);
      const authentication = ApiKeyManager.fromKey(apiKey);
      const activeCategory = document.getElementById("places-select").value
      console.log("id"+this.cIds[activeCategory]+" - Radius"+this.searchRadius)
      const lngLat = transform(this.coordinate, "EPSG:3857", "EPSG:4326");
        findPlacesNearPoint({
            x: lngLat[0],
            y: lngLat[1],
            categoryIds: [this.cIds[activeCategory]],
            radius:this.searchRadius,
            authentication
        })
        .then((response) => {
          this.placesLayer.getSource().clear();

            const places = [];

            response.results.forEach((result)=>{
                const location = transform([result.location.x,result.location.y], "EPSG:4326", "EPSG:3857");
                const marker = new Feature({
                    geometry: new Point(location),
                });
                marker.set("address",result.name+"\nDistance: "+(result.distance / 1000).toFixed(1)+"km")
                marker.set("place","placeId: "+result.placeId+", <br>categorie: "+result.categories[0].label)
                
                places.push(marker);

            });
            console.log("--------------"+"termine");
            const ICI = new Feature({
              geometry: new Point(this.coordinate),
            });
            ICI.set("address","ICI\nDistance: 0km")
            ICI.set("color","red")
            places.push(ICI);
            list_search(places);
            const source = new VectorSource({features: places});
            this.placesLayer.setSource(source)
        })
        .catch((error) => {
          alert("Un probleme est survenu pendant l'utilisation du Geocoder");
          console.error(error);
        });
    }
    
    cIds = {
      "Travel Agency" : 19055,
      "Marketplace" : 14009,
      "Government Building" : 12064,
      "Drugstore" : 17035,
      "Sports & Recreation" : 18000,
      "Volcano" : 16051,
      "River" : 16043,
      "Mountain" : 16027,
      "Monument" : 16026,
      "Park" : 16032,
      "Arts & Entertainment" : 10000,
      "Parking" : 19020,
      "Police Station" : 12072,
      "Hotel" : 19014,
      "Restaurant" : 13065,
      "Fuel Station" : 19007,
      "Hospital" : 15014
    }
}