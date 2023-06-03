import { Geometry, Point } from "ol/geom";
import {Feature} from 'ol';
import VectorSource from "ol/source/Vector";
import { Circle, Style,Fill,Stroke,Text } from "ol/style";

import VectorLayer from "ol/layer/Vector";
import { fromLonLat,transform } from 'ol/proj'
import olPopup from 'ol-popup';


export class PointMap {
    map
    features;
    vectorSource;
    vectorLayer;
    lat;
    lon;
    popup = new olPopup();
    message;

    constructor(map,latitude,longitude,message="Ici",couleur='red') {
        this.lat = latitude
        this.lon = longitude
        this.map = map
        this.message = message
        this.features = [
          new Feature({
             geometry : new Point(fromLonLat([longitude, latitude ]))
          })
        ]
      
        this.vectorSource = new VectorSource({
            features : this.features
          });

        this.vectorLayer = new VectorLayer({
          source: this.vectorSource,
          style: ()=>new Style({
              image: new Circle({
                radius: 6,
                fill: new Fill({color: couleur})
              }),
              text: new Text({
                font: "8px sans-serif",
                textAlign: "left",
                text: message,
                //offsetX: 2, // bouge le texte vers la droite
                offsetY: 8, // bouge le texte vers le bas
                fill: new Fill({ color: "hsl(220, 80%, 40%)" }),
                stroke: new Stroke({ color: "hsl(220, 80%, 40%)", width: 2 })
              })
            }),
          declutter: true
        });
        
        this.map.getLayerGroup().getLayers().push(this.vectorLayer)
        
        //this.map.addOverlay(this.popup);
        //this.popup.show(fromLonLat([latitude, longitude]), "<span style='color:green'>"+message+"</span>");          
        
    }
}

