/**
 * TOTP.js
 * Written by: Jay Simons
 * https://Cloudulus.Media
 * 
 * A javascript class for calculating a TOTP (Time-based One Time Password) based on a provided 16-character key (secret).
 * This is the open-source algorithm that Google Authenticator and other 2FA-enabled apps utilize.
 * This script is based on a code snippet published by user "russ" on http://blog.tinisles.com.
 * 
 * This class requires sha.js, which can be found here: http://caligatio.github.io/jsSHA/sha.js
 * 
 * Usage Example:
 * 
 * var totp = new TOTP('user secret', 'optional user name for display'); // Instantiates object and keeps it alive in DOM
 * 
 * Getters:
 * 
 * totp.getOTP() // Returns current OTP
 * totp.getQR() // Returns URL to Google Charts QR Code (for scanning into Google Authenticator)
 * totp.getCountDown() // Returns time (in seconds) until next OTP update
 * 
 * Setters:
 * 
 * totp.setKey(secretKey) // Sets 16-digit user secret (key)
 * totp.setLog(true|false) // Sets logging output to console.log()
 * totp.getUser(username) // Sets username display (for QR code), default is "user@example.com" if not set
 */

var googleChartsURL = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=otpauth://totp/';
var defaultUser = "user@example.com";

class TOTP
{
    constructor(key, user)
    {
        this.key = key;
        this.error_mess = "";
        this.otp = 0;
        this.countDown = 0;
        this.log = false;

        if (typeof user === typeof undefined) user = defaultUser;
        this.user = user;

        this.update();

        var me = this;
        this.interval = setInterval(function(){
            var epoch = Math.round(new Date().getTime() / 1000.0);
            me.countDown = 30 - (epoch % 30);
            if (epoch % 30 == 0) me.update();
            if (me.log) console.log('Update OTP in ' + me.countDown + ' seconds...');
        }, 1000);
    }

    dec2hex(s)
    {
        return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
    }

    hex2dec(s)
    {
        return parseInt(s, 16);
    }

    leftpad(str, len, pad)
    {
        if (len + 1 >= str.length)
        {
            str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    }

    base32tohex(base32)
    {
        var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = "";
        var hex = "";
        for (var i = 0; i < base32.length; i++)
        {
            var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += this.leftpad(val.toString(2), 5, '0');
        }
        for (var i = 0; i+4 <= bits.length; i+=4)
        {
            var chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16) ;
        }
        return hex;
    }

    update()
    {        
        var key = this.base32tohex(this.key);
        var epoch = Math.round(new Date().getTime() / 1000.0);
        var time = this.leftpad(this.dec2hex(Math.floor(epoch / 30)), 16, '0');

        // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
        var shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(key, "HEX");
        shaObj.update(time);
        var hmac = shaObj.getHMAC("HEX");

        var offset = 0;

        if (hmac == 'KEY MUST BE IN BYTE INCREMENTS') {
            this.error_mess = hmac;
            return false;
        }else{
            offset = this.hex2dec(hmac.substring(hmac.length - 1));
        }

        var otp = (this.hex2dec(hmac.substr(offset * 2, 8)) & this.hex2dec('7fffffff')) + '';
        otp = (otp).substr(otp.length - 6, 6);
        this.otp = otp;
        if (this.log) console.log('New OTP: '+ this.otp);
        return true;
    }

    getOTP()
    {
        return this.otp;
    }

    getCountDown()
    {
        return this.countDown;
    }

    getQR()
    {
        var url = googleChartsURL + this.user + '%3Fsecret%3D' + this.key;
        return url;
    }

    setKey(k)
    {
        this.key = k;
        return true;
    }

    setUser(u)
    {
        this.user = u;
        return true;
    }

    setLog(bool)
    {
        this.log = bool;
        return true;
    }
}