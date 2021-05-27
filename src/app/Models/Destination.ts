import {Marker} from "mapbox-gl";

export class Destination {
  public volume: number|undefined =0;
  public id: string|undefined;
  public marker: Marker|undefined;
  public lat: number|undefined;
  public long: number|undefined;
  constructor() {}
}
