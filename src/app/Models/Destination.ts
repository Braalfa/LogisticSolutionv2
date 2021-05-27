import {Marker} from "mapbox-gl";

export class Destination {
  public volume: number = 0;
  public id: string|undefined;
  public marker: Marker|undefined;
  public lat: number|undefined;
  public long: number|undefined;
  public nameTouched: boolean = false;
  constructor() {}
}
