var tough = require('tough-cookie');

var DREAMWIDTH_URL = 'https://dreamwidth.org';
export var grok_url = DREAMWIDTH_URL;

export function grok_set_url(url) {
        console.log("Requests will go to: "+url);
        grok_url = url;
}

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
                        grok_url,
                        cookie,
                )
        }
}

export function grok_login1(callback) {

        var result = {};

        cordova.plugin.http.get(grok_url,
                {},
                {},
                function(response) {

                        var html = $('<html>').append(
                                $.parseHTML(response.data));

                        result['auth'] = html.find('[name="lj_form_auth"]').
                                attr('value');

                        set_cookies(grok_url, response);

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

        cordova.plugin.http.post(grok_url,
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

                        var html = $('<html>').append(
                                $.parseHTML(response.data));

                        var h1 = html.find('h1').html()

                        if (h1.includes('Welcome back')) {
                                result['success'] = true;
                        } else {
                                result['success'] = false;

                                var blockquote = html.find('blockquote').html();

                                if (blockquote.includes('wrong password')) {
                                        result['message'] = 'Wrong password.';
                                } else if (blockquote.includes('This account name')) {
                                        result['message'] = 'Unknown username.';
                                } else {
                                        result['message'] = 'Unknown error from site.';
                                }

                                console.log('Error from site:');
                                console.log(blockquote);
                        }

                        callback(result);
                },
                function(response) {
                        result['success'] = false;
                        result['message'] = response.error;
                        callback(result);
                });
}
