#!/bin/python

import http.server
import socketserver
from http import HTTPStatus
import requests
import argparse
import os
import random

class GatewayHandler(http.server.BaseHTTPRequestHandler):

    server_version = 'fake-dw-gateway/0.0.1'

    keep_headers = [
            'content-type',
            'content-length',
            ]

    def do_HEAD(self):
        r = requests.get(
                self.request_url(),
                )

        self.transfer_status_and_headers(r)

    def do_OPTIONS(self):
        r = requests.get(
                self.request_url(),
                )

        self.transfer_status_and_headers(r)

    def do_GET(self):
        r = requests.get(
                self.request_url(),
                stream = True,
                )

        self.transfer_status_and_headers(r)

        try:
            for chunk in r.iter_content(chunk_size=1024):
                self.wfile.write(chunk)
        except ConnectionError as e:
            print(e)

    def request_url(self):
        result = f'{self.server.upstream}{self.path}'
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

class ErsatzHandler(http.server.BaseHTTPRequestHandler):

    server_version = 'fake-dw-ersatz/0.0.1'

    def do_GET(self):
        fields = {
                'content-type': 'text/html',
                'status': 200,
                }

        if self.path=='/login':
            session = hex(random.randint(0, 65535))
            self.server.session_id = session
            fields['template-name']= 'login'
            fields['set-cookie'] = f"ljuniq={session}; domain=localhost; path=/; expires=Sun, 23-Jan-2200 19:18:56 GMT"
            fields['session'] = session
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

    with TCPServerWithSettings(
            ("", args.port),
            args.handler,
            settings = args,
            ) as httpd:

        httpd.allow_reuse_address = True
        print(f"Now serving {args.handler} at port {args.port}.")

        httpd.serve_forever()

if __name__=='__main__':
    main()

