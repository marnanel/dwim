import {
        grok_login1,
        grok_login2,
        grok_set_url,
        grok_url,
} from './grok.js';

var FAKE_DW_URL = 'http://127.0.0.1:6887/login';

document.addEventListener('deviceready', onDeviceReady, false);

function ui_login_show_message(message) {
        $("#login-message").show().text(message);
        console.log(message);
}

function onDeviceReady() {
        console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

        if (cordova.platformId=='browser') {
                ui_login_show_message("Running on browser; connections will go to localhost");
                grok_set_url(FAKE_DW_URL);
        }

        $("#submit-login").click(function() {
                ui_login_show_message("Connecting...");
                grok_login1(handle_login1);
        });
}

function handle_login1(login1) {
        ui_login_show_message("Logging in...");
        console.log("login: part 2");
        grok_login2(
                handle_login2,
                login1['auth'],
                $('#username').val(),
                $('#password').val(),
        )
}

function handle_login2(login2) {
        ui_login_show_message("Success!");
        console.log(login2);
}
