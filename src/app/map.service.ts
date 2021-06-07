import { Injectable } from '@angular/core';
import * as mapboxgl from "mapbox-gl";
import {LngLat, Marker} from "mapbox-gl";
import {mark} from "@angular/compiler-cli/src/ngtsc/perf/src/clock";
import {Cluster} from "./Models/Cluster";
import {Destination} from "./Models/Destination";
import {Dic} from "./Models/Dic";
import {Route} from "./Models/Route";
import {min} from "rxjs/operators";
import length from '@turf/length';
import * as turf from '@turf/helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
            weights[k][j] = val.routes[0].distance / d1.volume;

            dic.push({
              origin: d1.id,
              destination: d2.id,
              dist: val.routes[0].distance,
              weight: val.routes[0].distance / d2.volume,
              originVolume: d1.volume,
              destinationVolume: d2.volume,
              originLat: d1.lat,
              originLong: d1.long,
              destinationLat: d2.lat,
              destinationLong: d2.long
            })
            dic.push({
              origin: d2.id,
              destination: d1.id,
              dist: val.routes[0].distance,
              weight: val.routes[0].distance / d1.volume,
              originVolume: d2.volume,
              destinationVolume: d1.volume,
              originLat: d2.lat,
              originLong: d2.long,
              destinationLat: d1.lat,
              destinationLong: d1.long
            })
          resolve("ok")
        });
      });
    })
  }

  minRoute2(dics: Dic[], names: string[]):Route{
    let currentWeight = Number.MAX_SAFE_INTEGER
    let currentRoute = new Route();
    for (let i = 0; i < names.length; i++) {
      const nextNames = names.slice();
      nextNames.splice(i, 1);
      const tempRoute = this.minRoute2Aux(dics, names[i], nextNames);
      if (tempRoute.weight < currentWeight) {
        currentWeight = tempRoute.weight;
        currentRoute = tempRoute;
      }
    }
    return currentRoute;
  }
  minRoute2Aux(dics: Dic[], current: string, remaining: string[]): Route{
    let currentRoute = new Route();
    if(remaining.length>0) {
      let currentWeight = Number.MAX_SAFE_INTEGER
      for (let i = 0; i < remaining.length; i++) {
        const nextRemaining = remaining.slice();
        nextRemaining.splice(i, 1);
        const tempRoute = this.minRoute2Aux(dics, remaining[i], nextRemaining);
        tempRoute.path.unshift(current)

        let next = remaining[i];
        let dic = dics.find((d:any) => d.origin===current && d.destination === next)
        if(dic){
          tempRoute.weight+= dic.dist;
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
        for(let k = j; k<destinations.length; k++) {
          if (k != j) {
            const d2 = destinations[k];
            await this.calcularDistanciasAux(k, j, d1, d2, distances, weights, dic)
          } else {
            distances[j][k] = 0;
            weights[j][k] = 0;
          }
        }
      }
      let maximums = distances.map(d=>Math.max.apply(Math,d));
      let totalVolume = destinations.map(d=>d.volume).reduce((a, b) => a + b, 0);
      dic.forEach(d=>{
        d.weight = (1/((d.destinationVolume/totalVolume)*(1/(d.dist))));
      })
      for(let k =0; k<weights.length; k++){
        for(let j = 0; j<weights.length; j++){
          weights[k][j] = (1/((destinations[j].volume/totalVolume)*(1/(distances[k][j]))));
        }
      }
    }
    return {allDistances, allWeigths, allDics}
  }


  interClusterDistances(clusters: Cluster[], allDistributionCenters: { lat: number; long: number; }[]){
    let distances = []
    for(let i =0; i<clusters.length; i++){
      for(let j =i; j<clusters.length; j++){
        if(j!=i){
          let line = turf.lineString([[allDistributionCenters[i].long, allDistributionCenters[i].lat],
            [allDistributionCenters[j].long, allDistributionCenters[j].lat]]);
          distances.push({origin: i, destination: j, distance: length(line, {units: 'kilometers'})});
        }
      }
    }
    return distances;
  }

  analize(clusters: Cluster[]):{ allMidPoints: { origin: string; destination: string; lat: number; long: number; weight: number; distributionDistance: number }[][]; allDistributionCenters: { lat: number; long: number }[] }{
    var allMidPoints: { origin: string; destination: string; lat: number; long: number; weight: number; distributionDistance: number; }[][] = [];
    var allDistributionCenters: { lat: number; long: number; }[] = [];
    this.calcularDistancias(clusters).then(result=>{
      let minRoutes: Route[] = []
      // Calcular las rutas
      for(let i = 0; i< result.allDics.length; i++){
        minRoutes.push(this.minRoute(result.allDics[i], clusters[i].destinations.map(d=>d.id) as string[]))
      }
      console.log(result.allDics)

      let listLitros: any[] = [];
      for(let i = 0; i<minRoutes.length; i++){
        let route = minRoutes[i]
        let dics = result.allDics[i]
        let cluster = clusters[i].destinations
        let totalLitros = 0;
        for(let j = 0; j< cluster.length; j++){
          totalLitros += cluster[j].volume;
        }
        let acumulado = 0;
        let litros = 0;
        for(let j = 0; j<route.path.length-1; j++) {
          let dic = dics.find((d: any) => d.origin === route.path[j] && d.destination === route.path[j + 1])
          // @ts-ignore
          acumulado += dic.originVolume;
          if (dic) {
            litros += dic.dist*(0.301+((totalLitros-acumulado)*0.301*0.01/45))
          }
        }
        listLitros.push(litros)
      }

      // Calcular los centros cluster por cluster
      for(let i = 0; i<minRoutes.length; i++){
        let dics = result.allDics[i]
        let route = minRoutes[i]
        console.log(result.allWeigths)
        console.log(route.path)
        console.log(route.weight)
        let midpoints = []
        let distributionCenter = {
          lat: 0,
          long: 0
        }
        // Calculo intracluster
        for(let j = 0; j<route.path.length-1; j++) {
          let dic = dics.find((d: any) => d.origin === route.path[j] && d.destination === route.path[j + 1])
          if (dic) {
            midpoints.push({
              origin: dic.origin,
              destination: dic.destination,
              lat: (dic.originLat + dic.destinationLat) / 2,
              long: (dic.originLong + dic.destinationLong) / 2,
              weight: (dic.originVolume + dic.destinationVolume) / 2,
              distributionDistance: dic.dist
            })
            distributionCenter.lat += (dic.originLat + dic.destinationLat) / 2;
            distributionCenter.long += (dic.originLong + dic.destinationLong) / 2;
          }
        }
        distributionCenter.lat = distributionCenter.lat/(route.path.length-1)
        distributionCenter.long = distributionCenter.long/(route.path.length-1)
        allMidPoints.push(midpoints);
        allDistributionCenters.push(distributionCenter);

        clusters[i].destinations.forEach(d=>
        {
          if(d.long && d.lat) {
            let line = turf.lineString([[distributionCenter.long, distributionCenter.lat],
              [d.long, d.lat]]);
            d.distanceCenter = length(line, {units: 'kilometers'});
          }
        })

        let marker = this.addMarker("Centro "+(i+1), clusters[i].color)
        marker.setLngLat(new LngLat(distributionCenter.long, distributionCenter.lat))
        marker.setDraggable(false)
        let destination = new Destination();
        destination.id = "Centro "+(i+1);
        destination.marker = marker;
        destination.nameTouched = true;
        destination.long = distributionCenter.long;
        destination.lat = distributionCenter.lat;
        destination.center = true;
        destination.volume = 0;
        clusters[i].destinations.push(destination)
      }


      var wb = XLSX.utils.book_new();
      wb.Props = {
        Title: "Logistica Nueva",
        Subject: "Logistica Nueva",
        Author: "EAB",
        CreatedDate: new Date()
      };
      wb.SheetNames.push("Logistica Nueva");
      var ws_data:any = [];  //a row with 2 columns


      clusters.forEach((c,i)=>{
        ws_data.push(['Cluster:', (i+1).toString()]);
        ws_data.push([]);
        ws_data.push(['Distancias']);
        ws_data.push(c.destinations.map(d=>d.id));
        result.allDistances[i].forEach(da=>{
          ws_data.push(da)
        })
        ws_data.push([]);
        ws_data.push(['Pesos']);
        ws_data.push(c.destinations.map(d=>d.id));
        result.allWeigths[i].forEach(wa=>{
          ws_data.push(wa)
        })
        ws_data.push([]);
        ws_data.push(['Nombre' , 'Volumen', 'Latitud', 'Longitud']);
        // @ts-ignore
        c.destinations.forEach(d=>ws_data.push([d.id, d.volume, d.lat, d.long]));
        ws_data.push([]);
        ws_data.push(['Puntos medios:']);
        ws_data.push(['Ruta' , 'Volumen Prom', 'Latitud Prom', 'Longitud Prom', 'Distancia']);
        // @ts-ignore
        if(i<allMidPoints.length) {
          allMidPoints[i].forEach(m => ws_data.push([m.origin + '-' + m.destination, m.weight, m.lat, m.long, m.distributionDistance]));
        }
        ws_data.push([]);
        ws_data.push([]);
        ws_data.push(['Litros:', listLitros[i]]);
      })

      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      wb.Sheets["Logistica Nueva"] = ws;
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});

      function s2ab(s:any) {
        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        var view = new Uint8Array(buf);  //create uint8array as viewer
        for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;
      }

      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'analisisnuevo.xlsx');

    })


    return {allMidPoints, allDistributionCenters}
  }

  analizeSimple(clusters: Cluster[]):{ allMidPoints: { origin: string; destination: string; lat: number; long: number; weight: number; distributionDistance: number }[][]; allDistributionCenters: { lat: number; long: number }[] }{
    var allMidPoints: { origin: string; destination: string; lat: number; long: number; weight: number; distributionDistance: number; }[][] = [];
    var allDistributionCenters: { lat: number; long: number; }[] = [];
    this.calcularDistancias(clusters).then(result=>{
      let minRoutes: Route[] = []
      // Calcular las rutas
      for(let i = 0; i< result.allDics.length; i++){
        minRoutes.push(this.minRoute2(result.allDics[i], clusters[i].destinations.map(d=>d.id) as string[]))
      }
      console.log(result.allDics)

      let listLitros: any[] = [];
      for(let i = 0; i<minRoutes.length; i++){
        let route = minRoutes[i]
        let dics = result.allDics[i]
        let cluster = clusters[i].destinations
        let totalLitros = 0;
        for(let j = 0; j< cluster.length; j++){
          totalLitros = cluster[j].volume;
        }
        let acumulado = 0;
        let litros = 0;
        for(let j = 0; j<route.path.length-1; j++) {
          let dic = dics.find((d: any) => d.origin === route.path[j] && d.destination === route.path[j + 1])
          // @ts-ignore
          acumulado += dic.originVolume;
          if (dic) {
            litros += dic.dist*(0.301+((totalLitros-acumulado)*0.301*0.01/45.0))
          }
          console.log(litros)
        }
        listLitros.push(litros)
      }

      // Calcular los centros cluster por cluster
      for(let i = 0; i<minRoutes.length; i++){
        let dics = result.allDics[i]
        let route = minRoutes[i]
        console.log(result.allWeigths)
        console.log(route.path)
        console.log(route.weight)
        let midpoints = []
        let distributionCenter = {
          lat: 0,
          long: 0
        }
        // Calculo intracluster
        for(let j = 0; j<route.path.length-1; j++) {
          let dic = dics.find((d: any) => d.origin === route.path[j] && d.destination === route.path[j + 1])
          if (dic) {
            midpoints.push({
              origin: dic.origin,
              destination: dic.destination,
              lat: (dic.originLat + dic.destinationLat) / 2,
              long: (dic.originLong + dic.destinationLong) / 2,
              weight: (dic.originVolume + dic.destinationVolume) / 2,
              distributionDistance: dic.dist
            })
            distributionCenter.lat += (dic.originLat + dic.destinationLat) / 2;
            distributionCenter.long += (dic.originLong + dic.destinationLong) / 2;
          }
        }
        distributionCenter.lat = distributionCenter.lat/(route.path.length-1)
        distributionCenter.long = distributionCenter.long/(route.path.length-1)
        allMidPoints.push(midpoints);
        allDistributionCenters.push(distributionCenter);

        clusters[i].destinations.forEach(d=>
        {
          if(d.long && d.lat) {
            let line = turf.lineString([[distributionCenter.long, distributionCenter.lat],
              [d.long, d.lat]]);
            d.distanceCenter = length(line, {units: 'kilometers'});
          }
        })

        let marker = this.addMarker("Centro "+(i+1), clusters[i].color)
        marker.setLngLat(new LngLat(distributionCenter.long, distributionCenter.lat))
        marker.setDraggable(false)
        let destination = new Destination();
        destination.id = "Centro "+(i+1);
        destination.marker = marker;
        destination.nameTouched = true;
        destination.long = distributionCenter.long;
        destination.lat = distributionCenter.lat;
        destination.center = true;
        destination.volume = 0;
        clusters[i].destinations.push(destination)
      }


      var wb = XLSX.utils.book_new();
      wb.Props = {
        Title: "Logistica Vieja",
        Subject: "Logistica Vieja",
        Author: "EAB",
        CreatedDate: new Date()
      };
      wb.SheetNames.push("Logistica Vieja");
      var ws_data:any = [];  //a row with 2 columns


      clusters.forEach((c,i)=>{
        ws_data.push(['Cluster:', (i+1).toString()]);
        ws_data.push([]);
        ws_data.push(['Distancias']);
        ws_data.push(c.destinations.map(d=>d.id));
        result.allDistances[i].forEach(da=>{
          ws_data.push(da)
        })
        ws_data.push([]);
        ws_data.push(['Nombre' , 'Volumen', 'Latitud', 'Longitud']);
        // @ts-ignore
        c.destinations.forEach(d=>ws_data.push([d.id, d.volume, d.lat, d.long]));
        ws_data.push([]);
        ws_data.push(['Puntos medios:']);
        ws_data.push(['Ruta' , 'Volumen Prom', 'Latitud Prom', 'Longitud Prom', 'Distancia']);
        // @ts-ignore
        if(i<allMidPoints.length) {
          allMidPoints[i].forEach(m => ws_data.push([m.origin + '-' + m.destination, m.weight, m.lat, m.long, m.distributionDistance]));
        }
        ws_data.push([]);
        ws_data.push([]);
        ws_data.push(['Litros:', listLitros[i]]);
      })

      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      wb.Sheets["Logistica Vieja"] = ws;
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});

      function s2ab(s:any) {
        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        var view = new Uint8Array(buf);  //create uint8array as viewer
        for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;
      }

      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'analisisviejo.xlsx');

    })


    return {allMidPoints, allDistributionCenters}
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
