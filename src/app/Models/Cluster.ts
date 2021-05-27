import {Destination} from "./Destination";

export class Cluster {
  public destinations: Destination[] = [];
  public color: string ;

  constructor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    this.color=color;
  }
}

