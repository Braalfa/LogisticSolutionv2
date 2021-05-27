import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  map: any;
  markers: any;
  constructor() { }

  ngOnInit(): void {
    var mapC = document.getElementById("map");
    var coordinates = document.getElementById("coordinates")
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

  addMarker() {
    var marker = new mapboxgl.Marker({
      draggable: true
    })
      .setLngLat(this.map.getCenter())
      .addTo(this.map);
    this.markers.push(marker)
  }

  deleteMarker() {
    this.markers.forEach((m:any)=>m.remove());
    this.markers = [];
  }

  calcular() {
    var a = this.markers[0].getLngLat().lng;
    var b = this.markers[0].getLngLat().lat;
    var c = this.markers[1].getLngLat().lng;
    var d = this.markers[1].getLngLat().lat;

    fetch('https://api.mapbox.com/directions/v5/mapbox/driving/'+a+','+b+';'+c+','+d+'?annotations=distance&geometries=geojson&access_token=pk.eyJ1IjoiYWxmYWJyeWFuMTIiLCJhIjoiY2tvNnJ4eXVlMTZxaDJ3bWw0anFhbWQ1aSJ9.CONtvR3H-AQijuy2K6rMoA')
      .then(res => {
        res.json().then((val)=> {
            this.map.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': val.routes[0].geometry.coordinates
                }
              }
            });
            this.map.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#888',
                'line-width': 8
              }
            });
          }
        );


      });

  }
}
