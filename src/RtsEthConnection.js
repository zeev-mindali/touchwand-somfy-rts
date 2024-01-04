/* eslint-disable @typescript-eslint/no-unused-vars */
import { createConnection } from 'net';
//import { FgRed, BgGreen, FgGreen, FGBlack } from '../../colors';
//import {FgRed} from '../../colors';
import { inherits } from 'util';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

const Client = createConnection;
/**
 * @class - RTS controller unit constructor
 *
 * @param {string} id - unit's general id.
 * @param {object} settings - settings
 * @param {string} settings.uid - unit's somfy id.
 * @param {string} settings.type - type of connection(direct-rs485/ethernet adapter).
 * @param {string} settings.ip - unit's somfy id.
 * @param {string} settings.port - unit's somfy id.
 * @param {boolean} settings.connect - open connection on unit creation.
 */
function RtsEthConnection(id, settings) {
  EventEmitter.call(this);

  this.type = 'rts';
  this.id = id;
  this.socket = null;
  this.settings = settings;
  this.ip = settings.ip;
  this.port = settings.port;
  this.isConnected = false;
  this.enable = false;
  this.pingInterval = null;

  this.setUID(settings.uid);
  this.setSender(settings.sender);
  this.setEnable(settings.enable);
}

inherits(RtsEthConnection, EventEmitter);

RtsEthConnection.prototype.setEnable = function (enable) {
  if (enable) {
    this.enable = true;
    this.connect();
  } else {
    this.enable = false;
    this.disconnect();
  }
};

RtsEthConnection.prototype.setUID = function (uid, callback) {
  try {
    this.uid = Buffer.from(uid, 'hex');
  } catch (error) {
    this.emit(
      'error',
      'setUID: Error while parsing unit id: must contain valid hex number 6 bytes!',
      'somfy',
    );
  }
};

RtsEthConnection.prototype.setSender = function (sender, callback) {
  try {
    this.sender = Buffer.from(sender, 'hex') || Buffer.from([0xff, 0xff, 0xfe]);
  } catch (error) {
    this.emit(
      'error',
      'setSender: Error while parsing sender id: must contain valid hex number 6 bytes!',
      'somfy',
    );
  }
};

RtsEthConnection.prototype.connect = function (cmd, callback) {
  //var self = this;
  var alreadyExist = this.socket !== null && typeof this.socket !== 'undefined';

  if (alreadyExist) {
    this.socket.end();
    this.isConnected = false;
    this.socket = null;
  }

  this.socket = Client(this.port, this.ip);
  this.setSocketListeners();

  //console.log(' ------> Somfy connecting to: ' + self.ip + ' port: ' + self.port, 'somfy', BgGreen);
};

RtsEthConnection.prototype.setSocketListeners = function () {
  this.socket.setKeepAlive(true, 3000);

  this.socket.on('connect', (data) => {
    this.isConnected = true;
    this.emit('connected', {
      id: this.id,
      ip: this.ip,
      port: this.port,
      msg: 'connected!',
    });
  });

  this.socket.on('error', (data) => {
    try {
      this.socket && this.socket.end();
      this.emit('ERROR', { id: this.id, msg: data });
    } catch (e) {
      //console.log('----> ' + e.stack, 'somfy', FgRed);
    }
  });

  this.socket.on('data', (data) => {
    this.isConnected = true;
    this.emit('data', { id: this.id, msg: data });
  });

  this.socket.on('timeout', (data) => {
    this.isConnected = false;
    this.emit('disconnected', { id: this.id, msg: data });
  });

  this.socket.on('close', (data) => {
    this.isConnected = false;
    this.emit('disconnected', { id: this.id, msg: data });
  });

  this.socket.on('end', (data) => {
    this.isConnected = false;
    this.emit('disconnected', { id: this.id, msg: data });
  });
};

RtsEthConnection.prototype.disconnect = function () {
  if (this.socket) {
    this.socket.end();
    this.socket = null;
  }
};

/**   Const       Calc        ??        Var/Const          Var          Const      Const       Calc
 * ----------------------------------------------------------------------------------------------------
 * | CMD Type |  Length  | Unknown | Sender address | Motor address | Channel#  |  CMD ID  | Checksum |
 * ----------------------------------------------------------------------------------------------------
 * | <1 Byte> | <1 Byte> | <0xFA>  |    <3 Byte>    |    <3 Byte>   | <1 Bytes> | <1 Byte> | <2 Byte> |
 * ----------------------------------------------------------------------------------------------------
 *
 * @function Builds and sends command to rts unit with parameter and it's value.
 *
 * @param {object} data - Command data, contains channel#, action and step size in case of tilt action.
 * @param {function} callback - Callback
 */
RtsEthConnection.prototype.write = function (data, callback) {
  if (!this.uid) {
    this.emit('error', { id: this.id, msg: 'The rts has no valid unit id!' });
    return;
  } else if (!this.socket) {
    this.emit('error', {
      id: this.id,
      msg: 'There is no connection socket! Maybe the connection is disabled in settings?',
    });
    return;
  } else if (
    typeof data.ch === 'undefined' ||
    typeof data.action === 'undefined'
  ) {
    this.emit('error', {
      id: this.id,
      msg: 'Not valid channel number or action',
    });
    return;
  }

  var cmd = Buffer.concat([
    Buffer.from([0xfa]),
    this.calcRealAddress(this.sender),
    this.calcRealAddress(this.uid),
    Buffer.from([0xff - data.ch]),
  ]);

  if (typeof cmd !== 'undefined' && cmd !== null) {
    var action = data.action.toUpperCase();
    switch (action) {
      case 'UP':
      case 'DOWN':
      case 'STOP':
      case 'IP':
        cmd = Buffer.concat([
          CONST.TYPE[action],
          CONST.LENGTH[action],
          cmd,
          CONST.ID[action],
        ]);
        break;
      case 'TILT_UP':
      case 'TILT_DOWN':
        data.repeat && (data.step_size *= data.repeat);
        var step_size = data.step_size ? 0xff - data.step_size : 0xfe;
        cmd = Buffer.concat([
          CONST.TYPE[action],
          CONST.LENGTH[action],
          cmd,
          CONST.ID[action],
          Buffer.from([step_size]),
        ]);
        break;
      case 'PROG_SHORT':
      case 'PROG_LONG':
        cmd = Buffer.concat([CONST.TYPE[action], CONST.LENGTH[action], cmd]);
        break;
      default:
        //console.log('Unknown somfy command: ' + action, 'somfy', FgRed);
        return;
    }

    cmd = Buffer.concat([cmd, this.calcChecksum(cmd)]);
    cmd = this.wrapFF(cmd);

    //console.log(FGBlack);
    this.socket.write(cmd);
  } else {
    //console.log('Error: Not valid cmd for rts unit with uid ->' + self.uid + '<-', 'somfy', FgRed );
  }
};

/**
 * @function - calculates check sum of given data buffer.
 *
 * @description Contains the lower two bytes of the summation of all the previous bytes of the message, in big-endian order.
 * @param {Buffer} buf - hex array with payload data.
 */
RtsEthConnection.prototype.calcChecksum = function (buf) {
  var sum = null;
  var res = Buffer.allocUnsafe(2);

  for (var i = 0; i < buf.length; i++) {
    sum = sum + buf[i];
  }
  0;
  res.writeInt16BE(sum, 0);

  return res;
};

/**
 * @function - calculates a real id hex number.
 *
 * @description Reverse the order of the bytes and flip every bit.
 * @param {Buffer} buf - hex array with payload data.
 */
RtsEthConnection.prototype.calcRealAddress = function (buf) {
  return Buffer.from(
    Array.from(buf)
      .reverse()
      .map((x) => ~x),
  );
};

/**
 * @function - Multiply 0xff's.
 *
 * @description
 * @param {Buffer} buf - buffer.
 */
RtsEthConnection.prototype.wrapFF = function (buf) {
  var arr = [];
  for (let index = 0; index < buf.length; index++) {
    var byte = buf[index];
    arr.push(byte);
    byte === 0xff && arr.push(byte);
  }
  return Buffer.from(arr);
};

RtsEthConnection.prototype.ping = function (interval) {
  this.clearInterval(this.pingInterval);

  if (!this.ip) {
    this.isConnected = false;
    this.emit('ping', {
      sucsess: false,
      msg: 'Ping error: ip missing',
      id: this.id,
    });
    return;
  }

  if (!interval && this.pingInterval) {
    this.pingInterval = null;
    this.emit('ping', {
      succsess: false,
      msg: 'Ping has stopped',
      id: this.id,
    });
    return;
  }

  if (interval > 0) {
    this.pingInterval = this.setInterval(() => {
      exec('ping ' + this.ip + ' -c 2', (error, stdout, stderr) => {
        if (error) {
          this.isConnected = false;
          this.emit('ping', { succsess: false, msg: error, id: this.id });
          return;
        }

        var rows = stdout.split('\n');
        var res = parseInt(rows.slice(rows.length - 3)[0].split(',')[2]); // Lost packets

        if (res < 100) {
          //self.emit('ping', {succsess: true, msg: res + "% of packet loss", id: self.id});
        } else {
          this.isConnected = false;
          this.emit('ping', { succsess: false, msg: error, id: this.id });
        }
      });
    }, interval);
  } else {
    this.emit('ping', {
      succsess: false,
      msg: 'Invalid interval time',
      id: this.id,
    });
  }

  
};
let CONST = {};
//somfy const
CONST.TYPE = {
  UP : Buffer.from([0x7f]),
  DOWN : Buffer.from([0x7f]),
  STOP : Buffer.from([0x7f]),
  TILT_UP : Buffer.from([0x7e]),
  TILT_DOWN : Buffer.from([0x7e]),
  IP : Buffer.from([0x7f]),
  PROG_SHORT : Buffer.from([0x68]),
  PROG_LONG :  Buffer.from([0x67]),
};

CONST.ID = {
  UP :  Buffer.from([0xfe]),
  DOWN :  Buffer.from([0xfd]),
  STOP :  Buffer.from([0xfc]),
  TILT_UP :  Buffer.from([0xff]),
  TILT_DOWN :  Buffer.from([0xfe]),
  IP :  Buffer.from([0xfb]),
};

CONST.LENGTH = {
  UP : Buffer.from([0xf2]),
  DOWN : Buffer.from([0xf2]),
  STOP : Buffer.from([0xf2]),
  TILT_UP : Buffer.from([0xf1]),
  TILT_DOWN : Buffer.from([0xf1]),
  IP : Buffer.from([0xf2]),
  PROG_SHORT : Buffer.from([0xf3]),
  PROG_LONG :  Buffer.from([0xf3]),
};

export default RtsEthConnection;
