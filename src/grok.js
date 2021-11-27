var JSSoup = require('jssoup').default;

export function grok_login1() {

        var result = {};

        cordova.plugin.http.get('http://127.0.0.1:6887/login',
                {},
                {},
                function(response) {
                        var soup = new JSSoup(response.data);

                        // jssoup apparently doesn't let you search
                        // by id at present
                        for (var tag of soup.findAll('input')) {
                                if (tag.attrs.name=='lj_form_auth') {
                                        result['auth'] = tag.attrs.value;
                                        break;
                                }
                        }

                        result['success'] = true;

                },
                function(response) {
                        result['success'] = false;
                        result['message'] = response.error;
                });

        return result;
}
