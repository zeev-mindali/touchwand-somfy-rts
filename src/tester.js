const RtsEthConnection = require("./RtsEthConnection");

console.log("creating a connection to somfy....");
var settings = {
    uid : "05DA12",
    type: "eth",
    ip: "192.168.1.206",
    port: "1001",
    connect: true,
    sender: "fffffe",
}

var somfy = new RtsEthConnection("RTS-somfy", settings);
somfy.disconnect();
somfy.connect("zeev",(res)=>{
    console.log(res);
});

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
 * data{
 *    action: UP, DOWN, STOP, IP, TILT_UP, TILT_DOWN,PROG_SHORT,PROG_LONG
 * 
 * }
 * @param {function} callback - Callback    
 */

cmd = {
    action: "DOWN",
    ch: 1,
    repeat : 1,
    step_size: 1
}
somfy.write(cmd);
console.log("finished");
somfy.disconnect();

