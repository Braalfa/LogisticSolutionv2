import {AfterViewInit, Component, DoCheck, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Cluster} from "../Models/Cluster";
import {Destination} from "../Models/Destination";
import {MapService} from "../map.service";

@Component({
  selector: 'app-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.css']
})
export class ClusterComponent implements AfterViewInit {

  clusters: Cluster[] = [{destinations: [], color:'#3FB1CE'}];
  blockChecking = false;
  constructor(private mapService: MapService) { }

  ngAfterViewInit(): void {
    this.onAddDestination(0)
  }

  updateMarkerTag(numCluster: number, numDestination: number){
    let destination = this.clusters[numCluster].destinations[numDestination]
    console.log(destination)
    if(!destination.id){
      destination.id = ""
    }
    if(destination.marker){
      this.mapService.setTextToMarker(destination.marker, destination.id, this.clusters[numCluster].color)
    }
  }

  updateMarkerPos(numCluster: number, numDestination: number){
    this.blockChecking = true;
    let destination = this.clusters[numCluster].destinations[numDestination]
    if(destination.marker && destination.lat && destination.long){
      this.mapService.updateMarkerPos(destination.marker, destination.long, destination.lat)
    }
    this.blockChecking = false;
  }


  onAddDestination(numCluster: number): void{
    // @ts-ignore
    let destinations = this.clusters[numCluster].destinations;
    destinations.push(new Destination())
    let destination = destinations.slice(-1)[0]
    destination.id = ''+this.clusters[numCluster].destinations.length
    destination.marker = this.mapService.addMarker(destination.id, this.clusters[numCluster].color)
    destination.long = destination.marker.getLngLat().lng
    destination.lat = destination.marker.getLngLat().lat
    destination.marker.on('drag', () => {
      // @ts-ignore
      destination.long = destination.marker.getLngLat().lng;
      // @ts-ignore
      destination.lat = destination.marker.getLngLat().lat;
    });

  }


  onAddCluster(): void{
    this.clusters.push(new Cluster())
    this.onAddDestination(this.clusters.length-1)
  }

  onDeleteCluster(numCluster: number):void{
    this.clusters[numCluster].destinations.forEach((d,i)=> this.removeMarker(numCluster,i))
    this.clusters.splice(numCluster,1)
  }

  onDeleteDestination(numCluster: number, numDestination: number):void{
    this.removeMarker(numCluster, numDestination)
    this.clusters[numCluster].destinations.splice(numDestination,1)
    this.clusters[numCluster].destinations.forEach((d,i)=>d.id=(i+1).toString())
  }

  removeMarker(numCluster: number, numDestination: number){
    let destination = this.clusters[numCluster].destinations[numDestination]
    if(destination.marker){
      this.mapService.deleteMarker(destination.marker)
    }
  }
}
