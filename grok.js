import React from 'react';

import {
    SafeAreaView,
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
} from 'react-native';

import * as SecureStore from 'expo-secure-store';
import tough from 'tough-cookie';
import DOMParser from 'react-native-html-parser';

///////////////////////////////////////

//var DREAMWIDTH_URL = 'https://dreamwidth.org';
var DREAMWIDTH_URL = 'https://marnanel.org'; // FIXME temporary

export var grok_url = DREAMWIDTH_URL;

///////////////////////////////////////

async function cookie_string(response) {

    var cookies;

    console.log('Setting cookies from: '+response);

    if (!response.headers['set-cookie']) {
        console.log("    -- no cookies to set");
        return;
    }

    if (response.headers['set-cookie'] instanceof Array)
        cookies = response.headers['set-cookie'].map(Cookie.parse);
    else
        cookies = [Cookie.parse(response.headers['set-cookie'])];

    console.log("    -- received cookies: "+cookies)

    var result = cookies.cookieString();
    console.log("    -- using cookies: "+result)
    return result;
}

function make_post_body(params) {
    var f = [];
    for (var key in params) {
        var encKey = encodeURIComponent(key);
        var encValue = encodeURIComponent(params[key]);
        f.push(encodedKey + '=' + encodedValue);
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

        fetch(grok_url, {
            method: 'GET',
        }).then((response) => {

            var parser = new DOMParser.DOMParser();
            var doc = parser.parseFromString(
                response.text(), 'text/html');

            result['auth'] = doc.querySelectorAll(
                'name="lj_form_auth"]')[0].
                getAttribute('value');

            result['cookies'] = cookie_string(response);

            resolve(result);

        }).catch((error) => {
            reject(error);
        });
    });
};

export async function grok_login2(auth, username, password) {

    return new Promise((resolve, reject) => {

        var result = {};

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

            var parser = new DOMParser();
            var doc = parser.parseFromString(
                response.data, 'text/html');

            var h1 = doc.querySelectorAll(
                'h1')[0].
                innerHTML();

            if (h1.includes('Welcome back')) {
                result['success'] = true;
            } else {
                result['success'] = false;

                var blockquote = doc.querySelectorAll(
                    'blockquote'
                )[0].innerHTML();

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
            reject(error);
        });
    });
}
