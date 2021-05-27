import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {MapSourceDataEvent} from "mapbox-gl";
import {MapService} from "../map.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  map: any;
  markers: any;
  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.mapService.build()
  }
}
