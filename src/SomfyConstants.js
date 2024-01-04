/**
 * create on: 11.03.2019.
 * create by: Vitaly O.
 * description: Somfy constants.
 */

/********************************
 *         RTS Constants        *
 ********************************/
let CONST = {};
import { Buffer } from 'buffer';

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

//module.exports.RTS_CONSTANTS = RTS_CONSTANTS;
export default RTS_CONSTANTS;