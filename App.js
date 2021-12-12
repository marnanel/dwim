import React from 'react';
import {
    StyleSheet, Text, View, TextInput,
    Image,
    Button,
} from 'react-native';
import {
    grok_set_url,
    grok_login1,
    grok_login2,
    grok_url,
} from './grok.js';
import logo from './assets/images/logo.png';
import $ from 'jquery';

export default class App extends React.Component {

    state = {
        username: '',
        password: '',
        message: '...',
        server: grok_url,
    };

    constructor(props) {
        super(props);
    };

    start_login() {
        console.log('Start login!');
        console.log(this.state);
        this.setState({
            message: 'Connecting...',
        });

        grok_set_url(this.state.server);

        grok_login1(this.handle_login1)
            .then((login1) => {

                this.ui_login_show_message("Logging in...");

                grok_login2(
                    this.handle_login2,
                    login1['auth'],
                    this.state.username,
                    this.state.password,
                    login1['cookies'],
                ).then(() => {
                    this.ui_login_show_message("Success!");
                }).catch((error) => {
                    this.ui_login_show_message(error);
                });
            }
            ).catch((error) => {
                this.ui_login_show_message(error);
            });
    };

    ui_login_show_message(message) {
        $("#login-message").show().text(message);
        console.log(message);
    };

    render() {
        return (
            <View style={styles.container}>

            <View style={styles.innerBox}>
            <Image source={logo} style={styles.logo} />

            <Text>Welcome to dwim!</Text>

            <Text>Username:</Text>
            <TextInput type="text" name="username"
            onChangeText={(text) => { this.state.username = text} }
            style={styles.input}
            />

            <Text>Password:</Text>
            <TextInput type="password" name="password"
            onChangeText={(text) => { this.state.password = text} }
            secureTextEntry={true}
            style={styles.input}
            />

            <Button
            onPress={() => this.start_login()}
            style={styles.button}
            title="Log in"
            />

            <Text
            name="login_message"
            style={styles.login_message}> {this.state.message} </Text>

            <Text>Server (for debugging):</Text>
            <TextInput type="text" name="server"
            onChangeText={(text) => { this.state.server = text} }
            style={styles.input}
            value={grok_url}
            />

            </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#8a0000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerBox: {
        flex: 1,
        backgroundColor: '#fffdd0',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        width: '70%',
        height: '50%',
    },
    logo: {
        marginBottom: 10,
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: '80%',
    },
    button: {
        height: 40,
        width: "50%",
        margin: 12,
        borderWidth: 1,
        borderRadius: 5,
        padding: 20,
        backgroundColor: "#8a0000",
        fontSize: 20,
        color: '#fff',
    }, 
    login_message: {
        fontWeight: "bold",
        fontSize: 14,
        marginTop: 20,
        color: '#000',
    }, 
});
