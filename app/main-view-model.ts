import {Device, isAndroid, Observable} from '@nativescript/core'
import {Bluetooth, ReadResult} from "@nativescript-community/ble";
import * as Perms from "@master.technology/permissions";
import {Status} from "nativescript-perms";

export class HelloWorldModel extends Observable {

  private _bluetooth = new Bluetooth();
  textDecoder = new TextDecoder();

  // depends on your PC (when using ble_server_test tool)
  // to find it I've used LightBlue free app (from Play Store)
  private macAddress: string = "3C:22:FB:06:49:7E"
  private serviceUUID: string = "0000EC00-0000-1000-8000-00805F9B34FB"
  private characteristicUUID: string = "0000EC0E-0000-1000-8000-00805F9B34FB"

  constructor() {
    super()
    this.checkBluetoothPermission();
  }

  async onConnectTap() {
    try {
      console.log("-------------- CONNECTING --------------")
      await this.connect();
      console.log("-------------- CONNECTED --------------")
    } catch (e) {
      console.log("AN ERROR OCCURRED WHILE CONNECTING");
      console.log(e);
    }
  }

  async connect() {
    let connected = false;
    return await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!connected) {
          reject(new Error('Device not found!'));
        }
      }, 3000);
      this._bluetooth
        .connect({
          UUID: this.macAddress,
          onConnected: (peripheral) => {
            connected = true;
            console.log(peripheral.UUID)
            console.log(peripheral.name)
            clearTimeout(timeoutId);
            resolve(peripheral);
          }
        })
        .then(() => {})
        .catch((error) => {
          reject(error);
        });
    });
  }

  async onReadTap() {
    if (!(await this._bluetooth.isConnected({ UUID: this.macAddress }))) {
      console.log("----------------- DEVICE IS NOT CONNECTED -----------------")
      return;
    }

    try {
      const res = await this._bluetooth.read({
        peripheralUUID: this.macAddress,
        serviceUUID: this.serviceUUID,
        characteristicUUID:this.characteristicUUID
      });
      this.logData(res);

    } catch (e) {
      console.log("AN ERROR OCCURRED WHILE READING");
      console.log(e);
    }
  }

  onWriteTap() {}

  private logData(res: ReadResult) {
    const data = new Uint8Array(res.value);
    console.log("------------------------ DATA READ------------------------");
    console.log(`'${this.textDecoder.decode(data)}'`);
  }

  private async checkBluetoothPermission(): Promise<void> {
    const res = await this.getBluetoothPermissionStatus();
    if (res == 'undetermined') await this.askBluetoothPermission();
    else if (isAndroid && res == 'denied') await this.askBluetoothPermission();
  }

  public async askBluetoothPermission(): Promise<void> {
    if (parseInt(Device.osVersion) >= 12) {
      await Perms.requestPermission("android.permission.BLUETOOTH_CONNECT");
    } else {
      try {
        await this._bluetooth.requestLocationPermission();
      } catch (e) {}
    }
  }

  private async getBluetoothPermissionStatus(): Promise<Status> {
    let res;
    if (parseInt(Device.osVersion) < 12)
      res = await this._bluetooth.hasLocationPermission();
    else
      res = Perms.hasPermission("android.permission.BLUETOOTH_CONNECT");
    return res ? 'authorized' : 'denied';
  }
}
