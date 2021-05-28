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
  result: any;
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
    destination.nameTouched = true
  }

  updateMarkerPos(numCluster: number, numDestination: number){
    this.blockChecking = true;
    this.removeCenters(numCluster);
    let destination = this.clusters[numCluster].destinations[numDestination]
    if(destination.marker && destination.lat && destination.long){
      this.mapService.updateMarkerPos(destination.marker, destination.long, destination.lat)
    }
    this.blockChecking = false;
  }


  onAddDestination(numCluster: number): void{
    this.removeCenters(numCluster);
    let destinations = this.clusters[numCluster].destinations;
    destinations.push(new Destination())
    let destination = destinations.slice(-1)[0]
    destination.id = ''+(this.clusters[numCluster].destinations.length-1)
    destination.marker = this.mapService.addMarker(destination.id, this.clusters[numCluster].color)
    destination.long = destination.marker.getLngLat().lng
    destination.lat = destination.marker.getLngLat().lat
    destination.marker.on('drag', () => {
      if(destination.marker) {
        destination.long = destination.marker.getLngLat().lng;
        destination.lat = destination.marker.getLngLat().lat;
        this.removeCenters(numCluster);
      }
    });

  }


  onAddCluster(): void{
    console.log("adding cluster")
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
    this.clusters[numCluster].destinations.forEach((d,i)=>{if(!d.nameTouched){d.id=(i).toString()}})
    this.removeCenters(numCluster);
  }


  removeMarker(numCluster: number, numDestination: number){
    let destination = this.clusters[numCluster].destinations[numDestination]
    if(destination.marker){
      this.mapService.deleteMarker(destination.marker)
    }
  }

  analize():void{
    for(let i = 0; i<this.clusters.length; i++){
      this.removeCenters(i);
    }
    this.mapService.analize(this.clusters)
  }

  analizeSimple():void{
    for(let i = 0; i<this.clusters.length; i++){
      this.removeCenters(i);
    }
    this.mapService.analizeSimple(this.clusters)
  }


  removeCenters(numCluster: number){
    let destinations = this.clusters[numCluster].destinations;
    for(let i =0; i<destinations.length; i++){
      if(destinations[i].center){
        this.removeMarker(numCluster, i)
        this.clusters[numCluster].destinations.splice(i,1)
        this.clusters[numCluster].destinations.forEach((d,i)=>{if(!d.nameTouched){d.id=(i).toString()}})
      }
    }
  }

  trackByFn(i: number) {
    return i
  }

}
