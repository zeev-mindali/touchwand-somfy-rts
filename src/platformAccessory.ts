import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { TouchwandSomfyRtsPlatform } from './platform';
import RtsEthConnection from './RtsEthConnection';
//const RtsEthConnection = require ('./)

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TouchwandSomfyRtsPlatformAccessory {
  //private service: Service;
  private somfy: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private somfyState = {
    currentPosition: 0,
    positionState: 0,
    targetPosition: 0,
  };

  private settings = {
    uid: '05DA12',
    type: 'eth',
    ip: '192.168.1.206',
    port: '1001',
    connect: true,
    sender: 'fffffe',
  };

  //connecting to somfy
  private somfyRTS = new RtsEthConnection('RTS-somfy', this.settings);

  constructor(
    private readonly platform: TouchwandSomfyRtsPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SomfyRts')
      .setCharacteristic(this.platform.Characteristic.Model, 'waveshare')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'twsw1');

    //services
    this.somfy =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.somfy.setCharacteristic(
      this.platform.Characteristic.Name,
      this.accessory.displayName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.somfy
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.somfySetOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.somfyGetOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async somfySetOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    //this.somfyState.targetPosition= value as number;
    this.platform.log.debug('Set Characteristic On ->', value);
    if (value === false) {
      return;
    }
    const deviceId = this.accessory.context.device.somfyUniqueId.split('-');
    this.platform.log.debug('ch:', deviceId[1], ' command:', deviceId[0]);
    const channel = deviceId[1];
    const command = deviceId[0];
    //somfyUp somfyDown somfyStop somfyIp somfyStepUp somfyStepDown
    switch (command) {
      case 'somfyUp':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyCommand(channel, 'UP');
        break;
      case 'somfyDown':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyCommand(channel, 'DOWN');
        break;
      case 'somfyStop':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyCommand(channel, 'STOP');
        break;
      case 'somfyIp':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyCommand(channel, 'IP');
        break;
      case 'somfyStepUp':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyStepCommand(channel, 'UP');
        break;
      case 'somfyStepDown':
        this.platform.log.debug('somfy command ->', command);
        this.makeSomfyStepCommand(channel, 'DOWN');
        break;
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   */
  async somfyGetOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.somfyState.currentPosition;

    const deviceContext = this.accessory.context; //somfyUniqueId
    this.platform.log.debug(
      'Get Characteristic the operation :) ->',
      deviceContext.device.somfyUniqueId,
    );

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  async makeSomfyCommand(ch: string, command: string) {

    const cmd = {
      action: command,
      ch: Number(ch),
      repeat : 1,
      step_size: 1,
    };
    this.somfyRTS.connect();
    this.somfyRTS.write(cmd, ()=>{
      //this is for removing callback....
    });
    this.somfyRTS.disconnect();

  }

  async makeSomfyStepCommand(ch:string, command:string){
    const cmd = {
      action: command,
      ch: Number(ch),
      repeat : 1,
      step_size: 1,
    };
    this.somfyRTS.connect();
    this.somfyRTS.write(cmd, ()=>{
      //this is for removing callback....
    });
    this.somfyRTS.disconnect();
  }
}
