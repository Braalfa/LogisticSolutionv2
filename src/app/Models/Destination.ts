import {Marker} from "mapbox-gl";

export class Destination {
  public volume: number = 1;
  public id: string|undefined;
  public marker: Marker|undefined;
  public lat: number|undefined;
  public long: number|undefined;
  public nameTouched: boolean = false;
  public center: boolean = false;
  constructor() {}
}
