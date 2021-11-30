var tough = require('tough-cookie');

var url = 'http://127.0.0.1:6887/login';

function set_cookies(url, response) {

        var cookies;

        console.log('Setting cookies from: ');
        console.log(response);

        for (var h of response.headers) {
                console.log("    -- "+h+" = "+response.headers[h]);
        }

        if (!response.headers['set-cookie']) {
                console.log("    -- no cookies to set");
                return;
        }

        if (response.headers['set-cookie'] instanceof Array) {
                cookies = response.headers['set-cookie'].map(Cookie.parse);
        } else {
                cookies = [Cookie.parse(response.headers['set-cookie'])];
        }

        for (var cookie of cookies) {
                console.log("Setting cookie: "+cookie.key+" = "+cookie.value)
                cordova.plugin.http.setCookie(
                        url,
                        cookie,
                )
        }
}

export function grok_login1(callback) {

        var result = {};

        cordova.plugin.http.get(url,
                {},
                {},
                function(response) {

                        var html = $('<html>').append(
                                $.parseHTML(response.data));

                        result['auth'] = html.find('[name="lj_form_auth"]').
                                attr('value');

                        set_cookies(url, response);

                        result['success'] = true;

                        callback(result);
                },
                function(response) {
                        result['success'] = false;
                        result['message'] = response.error;

                        callback(result);
                });
}

export function grok_login2(callback, auth, username, password) {

        var result = {};

        cordova.plugin.http.post(url,
                {
                        'lj_form_auth': auth,
                        'user': username,
                        'password': password,
                        'remember_me': 1,
                        'login': 'Log+in',
                },
                {},
                function(response) {
                        console.log('----');
                        console.log(response.headers);
                        console.log('----');
                        console.log(response.data);
                        result['success'] = true;

                        callback(result);
                },
                function(response) {
                        result['success'] = false;
                        result['message'] = response.error;
                        callback(result);
                });
}
