import {
        grok_login1,
        grok_login2,
} from './grok.js';

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
        console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
        $("#submitlogin").click(function() {
                console.log("login: part 1: here we go!");
                grok_login1(handle_login1);
        });
}

function handle_login1(login1) {
        console.log("login: part 2");
        grok_login2(
                handle_login2,
                login1['auth'],
                'wombat',
                'hunter2',
        )
}

function handle_login2(login2) {
        console.log("login: done");
        console.log(login2);
}
