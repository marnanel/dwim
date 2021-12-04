![dwim](doc/dwim-with-name.png)

Welcome to dwim 0.1 (ridequat)!

dwim is a [Dreamwidth](https://www.dreamwidth.org) mobile client. At present, it does very little: it allows you to log in to Dreamwidth, and nothing more.
There will be more soon.

# How to build

I've only tested this on Linux. It will probably work on the Mac. It might work on Windows for all I know.

* `git clone https://gitlab.com/marnanel/dwim`
* `npm install`
* `webpack`

Then to run on a connected Android device

* `cordova platform add android`
* `cordova run android --device`

Or you can run it in the browser-- but first read the section below about `fake-dw`.

* `cordova platform add browser`
* `cordova run browser`

# `fake-dw`

You can run dwim in the browser, for testing.
However, [modern browsers don't allow](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
JavaScript to make connections to random websites. Therefore, we need a workaround.

`fake-dw/fake-dw.py` is a daemon written in Python 3. It listens on port 6887
(i.e. "DW"). If dwim runs in the browser, it will automatically connect to `fake-dw`
instead of the real Dreamwidth.

`fake-dw` has two modes. In *gateway* mode (`--gateway`) it will forward requests
to the real Dreamwidth, and return its responses.

Mostly, though, you'll be using *ersatz* mode (`--ersatz`), which supplies a site
just enough like the real Dreamwidth to fool dwim. In ersatz mode, the only valid
login name is `wombat`, with password `hunter2`.

Use `python fake-dw/fake-dw.py --help` for more information.

# Thanks

Thanks go to Denise Paolucci and Mark Smith for bringing us this beautiful site.

The background photo is currently
[Lavender Dream](https://commons.wikimedia.org/wiki/File:Lavender_Dream_(Interplant_1985%29.jp%67)
by Huhu. It's public domain.
