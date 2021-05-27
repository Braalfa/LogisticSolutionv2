import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Cluster} from "../Models/Cluster";

@Component({
  selector: 'app-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.css']
})
export class ClusterComponent implements OnInit {

  clusters: Cluster[] = [{destinations:[{volume:100, id:1}], id:20},{destinations:[{volume:100, id:1}], id:20}];
  constructor() { }

  ngOnInit(): void {
  }

}
