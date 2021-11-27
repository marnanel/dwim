import {
        grok_login1,
} from './grok.js';

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
        console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

        var login1 = grok_login1();
        console.log(login1);
}
