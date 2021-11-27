var JSSoup = require('jssoup').default;

export function grok_login1() {

        var result = {};

        cordova.plugin.http.get('http://127.0.0.1:6887/login',
                {},
                {},
                function(response) {
                        console.log(response.status);
                        console.log(response.data);
                        var soup = new JSSoup(response.data);
                        var tag = soup.find('head');
                        console.log(tag)

                },
                function(response) {
                        console.error(response.error);
                });

        return result;
}
