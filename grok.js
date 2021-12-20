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

//var DREAMWIDTH_URL = 'https://dreamwidth.org';
var DREAMWIDTH_URL = 'http://192.168.1.64:6887'; // FIXME temporary

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
    console.log(f.join('&'));
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
                            if (attributes['name'] == "lj_form_auth") {
                                result['auth'] = attributes['value'];
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

        console.log("2");

        fetch(grok_url+'/login', {
            redirect: 'follow',
            mode: 'cors',
            method: 'POST',
            headers: {
                "Cookie": cookies,
                "Content-Type": "multipart/form-data",
            },
            body: make_post_body(
                {
                    'lj_form_auth': auth,
                    'user': username,
                    'password': password,
                    'remember_me': 1,
                    'login': 'Log+in',
                }),
        }).then((response) => {

            console.log('----');
            console.log(response.headers);
            response.text().then(function(text) {

                console.log('----');
                console.log(response.data);

                var interesting_tags = {blockquote:1, h1:1};
                var reading_for_tag = null;
                var read_for_tag = {}

                const parser = new htmlparser2.Parser({
                    onopentag(name, attributes) {

                        if (interesting_tags.hasOwnProperty(name)) {
                            reading_for_tag = name;

                            if (!read_for_tag.hasOwnProperty(name)) {
                                read_for_tag[name] = '';
                            }
                        }
                    },
                    onclosetag(name) {
                        if (name==reading_for_tag) {
                            reading_for_tag = null;
                        }
                    },
                    ontext(text) {
                        if (reading_for_tag!=null) {
                            read_for_tag[reading_for_tag] += text;
                        }
                    },
                });
                parser.write(text);
                parser.end();
                console.log("--- Read these:");
                console.log(read_for_tag);

                if (read_for_tag.h1.includes('Welcome back')) {
                    result['success'] = true;
                } else {
                    result['success'] = false;

                    if (read_for_tag.blockquote.includes('wrong password')) {
                        result['message'] = 'Wrong password.';
                    } else if (read_for_tag.blockquote.includes('This account name')) {
                        result['message'] = 'Unknown username.';
                    } else {
                        result['message'] = 'Unknown error from site.';
                    }

                    console.log('Error from site:');
                    console.log(read_for_tag.blockquote);
                }

                if (result['success']) {
                    resolve(result);
                } else {
                    reject(result);
                }
            }).catch((error) => {
                console.log("fetch body fails");
                console.log(error);
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
}
