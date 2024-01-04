export class SomfyDevices{
  private somfyUniqueId:string;
  private somfyDisplayName:string;
  private somfhChannel:string;

  constructor(somfyUniqueId:string, somfyDisplayName:string, somfhChannel:string){
    this.somfyUniqueId = somfyUniqueId;
    this.somfyDisplayName = somfyDisplayName;
    this.somfhChannel = somfhChannel;
  }

  get getSomfyUniqueId(){
    return this.somfyUniqueId;
  }

  get getSomfyDisplayName(){
    return this.somfyDisplayName;
  }

  get getSomfyChannel(){
    return this.somfhChannel;
  }
}