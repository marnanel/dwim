#!/bin/python

import http.server
import socketserver
import socket
from http import HTTPStatus
from urllib.parse import parse_qs
import requests
import argparse
import os
import random

LJ_FORM_AUTH_FORMAT = "c0:1637780400:1136:86400:5Asn7kYkEd-0-09Z5PuIllU4vZho:%(session)s"
USERNAME = 'wombat'
PASSWORD = 'hunter2'

class GatewayHandler(http.server.BaseHTTPRequestHandler):

    server_version = 'fake-dw-gateway/0.0.1'

    name = 'gateway'

    keep_headers = [
            'content-type',
            'content-length',
            'set-cookie',
            ]

    def do_HEAD(self):
        r = requests.get(
                self.request_url(),
                )

        self.transfer_status_and_headers(r)

    def do_OPTIONS(self):
        r = requests.options(
                self.request_url(),
                headers = self.outgoing_headers(),
                )

        self.transfer_status_and_headers(r)

    def do_GET(self):
        r = requests.get(
                self.request_url(),
                headers = self.outgoing_headers(),
                stream = True,
                )

        self.transfer_status_and_headers(r)
        self.transfer_body(r)

    def do_POST(self):

        length = int(self.headers["Content-Length"])
        payload = self.rfile.read(length)

        print(payload)

        r = requests.post(
                self.request_url(),
                headers = self.outgoing_headers(),
                data = payload,
                stream = True,
                )

        self.transfer_status_and_headers(r)
        self.transfer_body(r)

    def request_url(self):
        result = f'{self.server.settings.upstream}{self.path}'
        print(result)
        return result

    def transfer_status_and_headers(self, r):

        print('Received: ',r.status_code)

        self.send_response(r.status_code)

        self.send_header(
                'Access-Control-Allow-Origin',
                '*',
                )

        for f,v in r.headers.items():
            if f.lower() in self.keep_headers:
                print(f, v)
                self.send_header(f, v)
            else:
                print(f, v, '-- dropped')

        self.end_headers()

    def transfer_body(self, r):
        length = int(r.headers["Content-Length"])
        try:
            for chunk in r.iter_content(chunk_size=length):
                with open('/tmp/g','ab') as f:
                    f.write(chunk)
                self.wfile.write(chunk)

        except ConnectionError as e:
            print('transfer_body error:', e)

    def outgoing_headers(self):
        SAFE_HEADERS = [
                'user-agent', 'accept', 'accept-language',
                'accept-encoding',
                'content-type', 'content-length',
                'cookie', 'upgrade-insecure-requests',
                ]
        result = {}

        for f,v in self.headers.items():
            fl = f.lower()
            if fl in SAFE_HEADERS:
                result[f] = v
            elif fl=='origin':
                result[f] = self.request_url()

        return result

class ErsatzHandler(http.server.BaseHTTPRequestHandler):

    server_version = 'fake-dw-ersatz/0.0.1'

    def do_GET(self):
        self.send_stuff(
                method='GET',
                )

    def do_POST(self):
        self.send_stuff(
                method='POST',
                )

    def send_stuff(self, method):

        fields = {
                'content-type': 'text/html',
                'status': 200,
                }

        if method=='POST':
            length = int(self.headers["Content-Length"])
            payload = self.rfile.read(length)

            query = parse_qs(payload)
            print('Query -->', query)
            print('Headers -->', self.headers)

        if self.path=='/':

            fields['template-name'] = 'front-page'

        elif self.path=='/login':

            if method=='GET':

                session = hex(random.randint(0, 65535))
                self.server.session_id = session
                fields['template-name']= 'login'
                fields['set-cookie'] = f"ljuniq={session}; "+\
                        f"domain={self.server.settings.host}; path=/; "+\
                        f"expires=Sun, 23-Jan-2200 19:18:56 GMT"

                fields['session'] = session
                self.server.lj_form_auth = LJ_FORM_AUTH_FORMAT % fields

            elif method=='POST':

                fields['template-name'] = self.check_headers(query,
                        [
                            ('user', USERNAME, 'Unknown user',
                                'login-fail-username'),
                            ('password', PASSWORD, 'Wrong password',
                                'login-fail-password'),
                            ('lj_form_auth', self.server.lj_form_auth,
                                'Wrong auth string',
                                'login-fail-username'), # apparently
                            ],
                        )
            else:
                self.send_error(405, 'Unknown method')

        else:
            self.send_error(404)
            return

        with open(
                os.path.join(
                    os.path.dirname(__file__),
                    'templates',
                    fields['template-name'],
                    ),
                'r',
                ) as template:
            content = template.read() % fields

        self.send_response(fields['status'])
        self.send_header(
                'Content-Type',
                fields['content-type'],
                )
        self.send_header(
                'Content-Length',
                len(content),
                )
        self.send_header(
                'Access-Control-Allow-Origin',
                '*',
                )

        for f in [
                'Set-Cookie',
                ]:
            if f.lower() in fields:
                self.send_header(f, fields[f.lower()])

        self.end_headers()

        self.wfile.write(
                bytes(
                    content,
                    encoding='UTF-8',
                    ))

    def check_headers(self, query, checks):

        for (field, value, message, failure_template) in checks:

            field = bytes(field, encoding='ascii')

            if field not in query:
                print(f'{message}: {field} missing')
                return failure_template

            received = str(query[field][0],
                    encoding='ascii')

            if field in [b'user']:
                received = received.lower()

            if received!=value:
                print(f'{message}: got {received}, wanted {value}')
                return failure_template

        return 'login-success'

class TCPServerWithSettings(socketserver.TCPServer):

    def __init__(
            self,
            *args,
            **kwargs,
            ):

        self.settings = kwargs['settings']
        del kwargs['settings']

        super().__init__(*args, **kwargs)

def main():

    parser = argparse.ArgumentParser(
            description="act as a server for testing dwim",
            )
    parser.add_argument('-g', '--gateway',
            action='store_const',
            dest='handler',
            const=GatewayHandler,
            help='Forward requests to the real Dreamwidth.',
            )
    parser.add_argument('-e', '--ersatz',
            action='store_const',
            dest='handler',
            const=ErsatzHandler,
            help='Pretend to be Dreamwidth.',
            )
    parser.add_argument('-H', '--host',
            type=str,
            default=None,
            help='Host to listen on. Defaults to gethostname().',
            )
    parser.add_argument('-p', '--port',
            type=int,
            default=6887,
            help='Port to listen on. Defaults to 6887.',
            )
    parser.add_argument('-u', '--upstream',
            type=str,
            default='https://dreamwidth.org',
            help='URL of upstream server, for gateway mode',
            )
    args = parser.parse_args()

    if not args.handler:
        parser.print_usage()
        return

    if args.host is None:
        args.host = socket.gethostname()

    with TCPServerWithSettings(
            (args.host, args.port),
            args.handler,
            settings = args,
            ) as httpd:

        httpd.allow_reuse_address = True
        print(f"-- Now serving: --")
        print(f"Handler: {args.handler.__name__}")
        print(f"Address: http://{args.host}:{args.port} "
                "-- note, not https")
        if args.handler==ErsatzHandler:
            print(f"Username: {USERNAME}")
            print(f"Password: {PASSWORD}")
        print(f"Use ctrl-C to abort.")
        print()

        httpd.serve_forever()

if __name__=='__main__':
    main()

