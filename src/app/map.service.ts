import { Injectable } from '@angular/core';
import * as mapboxgl from "mapbox-gl";
import {LngLat, Marker} from "mapbox-gl";
import {mark} from "@angular/compiler-cli/src/ngtsc/perf/src/clock";
import {Cluster} from "./Models/Cluster";
import {Destination} from "./Models/Destination";
import {Dic} from "./Models/Dic";
import {Route} from "./Models/Route";

@Injectable({
  providedIn: 'root'
})
export class MapService {

  map: any ;
  markers :Marker[] = [];

  build() {
    let mapC = document.getElementById("map");
    let coordinates = document.getElementById("coordinates")

    // @ts-ignore
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWxmYWJyeWFuMTIiLCJhIjoiY2tvNnJ4eXVlMTZxaDJ3bWw0anFhbWQ1aSJ9.CONtvR3H-AQijuy2K6rMoA';
    if(mapC) {
      this.map = new mapboxgl.Map({
        container: mapC,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-84.09137324928379, 9.930471187495298],
        zoom: 9
      });
    }
    this.map.addControl(new mapboxgl.NavigationControl());
  }

  addMarker(tag: string, color: string) {
    var popup = new mapboxgl.Popup()
      .setText('Description')
      .addTo(this.map);

    var marker = new mapboxgl.Marker({
      draggable: true,
      color: color
    })
      .setLngLat(this.map.getCenter())
      .addTo(this.map)
      .setPopup(new mapboxgl.Popup({closeButton: false, closeOnClick: false}).setHTML("<h5 style='color:"+ color+"'>"+tag+"</h5>"));
    marker.togglePopup(); // toggle popup open or closed
    this.markers.push(marker)
    return marker;
  }

  setTextToMarker(marker: Marker, tag: string, color: string){
    marker.getPopup().setHTML("<h5 style='color:"+ color+"'>"+tag+"</h5>");
  }

  updateMarkerPos(marker: Marker, long: number, lat:number) {
    marker.setLngLat(new LngLat(long, lat))
  }


  deleteMarker(marker: Marker) {
    marker.remove()
    let index = this.markers.findIndex((m:any)=>m==marker);
    this.markers.splice(index,1)
  }

  calcularDistancia(d1: Destination, d2:Destination) {
    console.log('https://api.mapbox.com/directions/v5/mapbox/driving/'+d1.long+','+d1.lat+';'+d2.long+','+d2.lat
      +'?annotations=distance&geometries=geojson&access_token=pk.eyJ1IjoiYWxmYWJyeWFuMTIiLCJhIjoiY2tvNnJ4eXVlMTZxaDJ3bWw0anFhbWQ1aSJ9.CONtvR3H-AQijuy2K6rMoA')

    return fetch('https://api.mapbox.com/directions/v5/mapbox/driving/'+d1.long+','+d1.lat+';'+d2.long+','+d2.lat
      +'?annotations=distance&geometries=geojson&access_token=pk.eyJ1IjoiYWxmYWJyeWFuMTIiLCJhIjoiY2tvNnJ4eXVlMTZxaDJ3bWw0anFhbWQ1aSJ9.CONtvR3H-AQijuy2K6rMoA')
  }

  make2dArray(size:number) {
    var arr = [];
    for(let i = 0; i < size; i++) {
      arr.push(new Array(size));
    }
    return arr;
  }

  async calcularDistanciasAux(k:number, j:number, d1:Destination, d2:Destination, distances:any, weights:any, dic:any){
    return new Promise(resolve => {
      this.calcularDistancia(d1, d2).then(res => {
        res.json().then((val) => {
            distances[j][k] = val.routes[0].distance;
            distances[k][j] = val.routes[0].distance;
            weights[j][k] = val.routes[0].distance / d2.volume;
            weights[k][j] = val.routes[0].distance / d1.volume

            dic.push({
              origin: d1.id,
              destination: d2.id,
              dist: val.routes[0].distance,
              weight: val.routes[0].distance / d2.volume
            })
            dic.push({
              origin: d2.id,
              destination: d1.id,
              dist: val.routes[0].distance,
              weight: val.routes[0].distance / d1.volume
            })
          resolve("ok")
        });
      });
    })
  }

  minRoute(dics: Dic[], names: string[]):Route{
    let currentWeight = Number.MAX_SAFE_INTEGER
    let currentRoute = new Route();
    for (let i = 0; i < names.length; i++) {
      const nextNames = names.slice();
      nextNames.splice(i, 1);
      const tempRoute = this.minRouteAux(dics, names[i], nextNames);
      if (tempRoute.weight < currentWeight) {
        currentWeight = tempRoute.weight;
        currentRoute = tempRoute;
      }
    }
    return currentRoute;
  }
  minRouteAux(dics: Dic[], current: string, remaining: string[]): Route{
    let currentRoute = new Route();
    if(remaining.length>0) {
      let currentWeight = Number.MAX_SAFE_INTEGER
      for (let i = 0; i < remaining.length; i++) {
        const nextRemaining = remaining.slice();
        nextRemaining.splice(i, 1);
        const tempRoute = this.minRouteAux(dics, remaining[i], nextRemaining);
        tempRoute.path.unshift(current)

        let next = remaining[i];
        let dic = dics.find((d:any) => d.origin===current && d.destination === next)

        if(dic){
          tempRoute.weight+= dic.weight;
        }
        if (tempRoute.weight < currentWeight) {
          currentWeight = tempRoute.weight;
          currentRoute = tempRoute;
        }
      }
    }else{
      currentRoute = {weight: 0, path: [current]}
    }
    return currentRoute
  }

  async calcularDistancias(clusters: Cluster[]) {
    const allDistances = [];
    const allWeigths = [];
    const allDics: Dic[][] = [];

    for(let i = 0 ; i<clusters.length; i++){

      const cluster = clusters[i];
      const destinations = cluster.destinations;
      const distances = this.make2dArray(destinations.length)
      const weights = this.make2dArray(destinations.length)
      const dic: Dic[] = []

      allDistances.push(distances)
      allWeigths.push(weights)
      allDics.push(dic)

      for(let j = 0; j<destinations.length; j++){
        const d1 = destinations[j];
        for(let k = j+1; k<destinations.length; k++) {
          if (k != j) {
            const d2 = destinations[k];
            await this.calcularDistanciasAux(k, j, d1, d2, distances, weights, dic)
          } else {
            distances[j][k] = 0;
            weights[j][k] = 0;
          }
        }
      }
    }
    return {allDistances, allWeigths, allDics}
  }
}

// then(res => {
//   res.json().then((val)=> {
//       this.map.addSource('route', {
//         'type': 'geojson',
//         'data': {
//           'type': 'Feature',
//           'properties': {},
//           'geometry': {
//             'type': 'LineString',
//             'coordinates': val.routes[0].geometry.coordinates
//           }
//         }
//       });
//       this.map.addLayer({
//         'id': 'route',
//         'type': 'line',
//         'source': 'route',
//         'layout': {
//           'line-join': 'round',
//           'line-cap': 'round'
//         },
//         'paint': {
//           'line-color': '#888',
//           'line-width': 8
//         }
//       });
//     }
//   );
//
// });
