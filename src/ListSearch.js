import { popup } from "./Map"

//fournir un tableau de features
export function list_search(features) {
    const resultList = document.getElementById("listSearch");
    resultList.innerHTML = "";

    for(var i=0,c=features.length;i<c;i++) {
        const feat = features[i];
        let child = document.createElement("div")
        child.innerHTML= "<div>"+
            features[i].get("address")+"<br>"+
            (features[i].get("place") || "")+
            "</div>";
        child.className = "listSearch-item"
        child.addEventListener("click",(e)=>{
            popup.show(feat.getGeometry().flatCoordinates, feat.get("address")+"<br>"+feat.getGeometry().flatCoordinates.toString());
        })
        resultList.appendChild(child)
        //separateur
        let hr = document.createElement("hr")
        let divhr = document.createElement("div")
        divhr.appendChild(hr)
        resultList.appendChild(divhr)
    }
}