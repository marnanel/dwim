import * as htmlparser2 from 'htmlparser2';
import React from 'react';

import {
    SafeAreaView,
    StyleSheet,
    View,
    Text,
} from 'react-native';

import * as SecureStore from 'expo-secure-store';
import tough from 'tough-cookie';

///////////////////////////////////////

var DREAMWIDTH_URL = 'https://dreamwidth.org';
//var DREAMWIDTH_URL = 'https://marnanel.org'; // FIXME temporary

export var grok_url = DREAMWIDTH_URL;

///////////////////////////////////////

function cookie_string(response) {

    console.log('Setting cookies.');

    console.log(response.headers);
    console.log(response.headers['set-cookie']);

    if (!response.headers.has('set-cookie')) {
        console.log("    -- no cookies to set");
        return null;
    }

    var result = ""+tough.Cookie.parse(response.headers.get('set-cookie'));

    console.log("    -- using cookies: "+result)
    return result;
}

function make_post_body(params) {
    var f = [];
    for (var key in params) {
        var encKey = encodeURIComponent(key);
        var encValue = encodeURIComponent(params[key]);
        f.push(encKey + '=' + encValue);
    }
    return f.join('&');
}

///////////////////////////////////////

export function grok_set_url(url) {
    console.log("Requests will go to: "+url);
    grok_url = url;
}

export async function grok_login1() {

    return new Promise((resolve, reject) => {

        var result = {};
        console.log("grok_login1 begins...");

        fetch(grok_url+'/login', {
            method: 'GET',
        }).then((response) => {

            if (!response.ok) {
                console.log("    -- fetch failed");
                result['success'] = false;
                result['error'] = Response.statusText;
                reject(result);
                return;
            }

            response.text().then(function(text) {

                console.log("    -- fetch succeeded");

                var hd;
                try {
                    hd = htmlparser2.parseDocument(text);
                } catch(err) {
                    console.log("parser failed:");
                    console.log(err);
                    return;
                }

                console.log("2");

                const parser = new htmlparser2.Parser({
                        onopentag(name, attributes) {
                            if (attributes['name'] == "chal") {
                                console.log("   -- it's chal");
                                console.log(attributes['value']);
                                result['chal'] = attributes['value'];
                            }
                        },
                });
                parser.write(text);
                parser.end();

                result['cookies'] = cookie_string(response);

                console.log(result);

                resolve(result);

            }, function(error) {

                console.log("parse fails");
                console.log(JSON.stringify(error));

                result['success'] = false;
                result['error'] = error;
                reject(result);
            });

        }).catch((error) => {

            console.log("fetch fails");
            console.log(error);
            console.log(JSON.stringify(error));

            result['success'] = false;
            result['error'] = error;
            reject(result);


        });
    });
};

export async function grok_login2(
    auth,
    username,
    password,
    cookies,
) {

    return new Promise((resolve, reject) => {

        var result = {};

        console.log("grok_login2 begins...");

        fetch(grok_url,
            {
                method: 'POST',
                body: make_post_body(
                    {
                        'lj_form_auth': auth,
                        'user': username,
                        'password': password,
                        'remember_me': 1,
                        'login': 'Log+in',
                    }),
                headers: {
                    'Cookie': cookies,
                },
            },
        ).then((response) => {

            console.log('----');
            console.log(response.headers);
            console.log('----');
            console.log(response.data);

            var doc = cheerio.load(text);
            var h1 = cheerio('h1').html();

            if (h1.includes('Welcome back')) {
                result['success'] = true;
            } else {
                result['success'] = false;

                var blockquote = doc.querySelect(
                    'blockquote'
                ).innerHTML();

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

            resolve(result);

        }).catch((error) => {
            console.log("grok_login2 fails");
            console.log(JSON.stringify(error));
            reject(error);
        });
    });
}
