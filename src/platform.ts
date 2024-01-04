import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TouchwandSomfyRtsPlatformAccessory } from './platformAccessory';
import { SomfyDevices } from './clsDevices';

export class TouchwandSomfyRtsPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public somfyCommands:SomfyDevices[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    //log.debug('config data ->', this.config);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  discoverDevices() {
    //get devices from config file
    const somfyConfig = this.config;
    for (let counter=1;counter<=16;counter++){
      const channelInfo = `channel${counter}`;
      this.log.debug(`value of channel ${counter}->${somfyConfig[channelInfo]}`);
      if (somfyConfig[channelInfo]){
        this.log.debug('adding shutter channel->', counter);
        this.somfyCommands.push(
          new SomfyDevices(`somfyUp-${counter}`, `UP #${counter}`, `${counter}`),
          new SomfyDevices(`somfyDown-${counter}`, `DOWN #${counter}`, `${counter}`),
          new SomfyDevices(`somfyStop-${counter}`, `STOP #${counter}`, `${counter}`),
          new SomfyDevices(`somfyIp-${counter}`, `IP #${counter}`, `${counter}`),
          new SomfyDevices(`somfyStepUp-${counter}`, `STEP UP #${counter}`, `${counter}`),
          new SomfyDevices(`somfyStepDown-${counter}`, `STEP DOWN #${counter}`, `${counter}`),
        );
      }
    }


    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of this.somfyCommands) {
      const uuid = this.api.hap.uuid.generate(device.getSomfyUniqueId);

      const existingAccessory = this.accessories.find(
        (accessory) => accessory.UUID === uuid,
      );

      if (existingAccessory) {
        // the accessory already exists
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName,
        );

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new TouchwandSomfyRtsPlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.getSomfyDisplayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(
          device.getSomfyDisplayName,
          uuid,
        );

        accessory.context.device = device;

        new TouchwandSomfyRtsPlatformAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }
  }
}
