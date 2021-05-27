import {Component, Input, OnInit} from '@angular/core';
import {Destination} from "../Models/Destination";


@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.css']
})
export class DestinationComponent implements OnInit {

  @Input('clusterNum') clusterNum: number|undefined;
  @Input() destinations: Destination[] = [new Destination(),
                                          new Destination(),
                                          new Destination()]
  constructor() { }

  ngOnInit(): void {
  }

}
