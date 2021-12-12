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
import $ from 'jquery';

///////////////////////////////////////

//var DREAMWIDTH_URL = 'https://dreamwidth.org';
var DREAMWIDTH_URL = 'http://aspidistra:6887'; // FIXME temporary

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

    var cookieString = await SecureStore.getItemAsync('cookies');

    return new Promise((resolve, reject) => {

        var result = {};

        console.log("Sending cookies: "+cookieString);

        fetch(grok_url, {
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
                'Cookie': cookieString,
            },
        }).then((response) => {

            var html = $('<html>').append(
                $.parseHTML(response.data));

            result['auth'] = html.find('[name="lj_form_auth"]').
                attr('value');

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

        }).catch((error) => {
            result['success'] = false;
            result['message'] = error;

            callback(result);
        });
    });
}
