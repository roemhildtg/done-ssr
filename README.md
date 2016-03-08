<!--
@page done-ssr
@group done-ssr.node 0 Node
@group done-ssr.client 1 Client
@group done-ssr.helpers 2 Helpers
@group done-ssr.assets 3 Assets
-->

[![Build Status](https://travis-ci.org/donejs/done-ssr.svg?branch=master)](https://travis-ci.org/donejs/done-ssr)
[![npm version](https://badge.fury.io/js/done-ssr.svg)](http://badge.fury.io/js/done-ssr)

# done-ssr

Server-side rendering for CanJS.

## Server

To start a full server that hosts your application run:

```
npm install done-ssr  
node_modules/.bin/can-serve --port 3030
```

In your application folder.

Available options:

- __-p, --port__ - Set the port the server should run on
- __-d, --develop__ - Also starts a live-reload server
- __-r, --proxy__ <url> - Proxy a local path (default: `/api`) to the given URL (e.g. `http://api.myapp.com`)
- __-t, --proxy-to <path>__ - Set the proxy endpoint (default: `/api`)
- __--proxy-no-cert-check__ - Turn off SSL certificate verification

## Usage

`done-ssr` can be used either as Express middleware or programatically.

### Express Middleware

Use the provided middleware to add server-side rendering to an existing Express server:

```js
var ssr = require('done-ssr/middleware');

app.use('/', ssr({
  config: __dirname + '/public/package.json!npm'
}));
```

The middleware includes a live-reload utility that can automatically refresh the cache for server-rendered responses. Use the `liveReload` option to enable this feature:

```js
app.use('/', ssr({
  config: __dirname + '/public/package.json!npm',
  liveReload: true
}));
```

__Note:__ Make sure the ssr middleware is the last middleware in the chain but before the error handler. Errors when rendering the application will be passed to your Express error handler. Error status codes (e.g. 404s or others set via `appState.status()`) will be rendered with the application.

### Use Programatically

**done-ssr** takes a system configuration object (the same object used by steal-tools to configure building) and returns a function that will render requests.

Pass your request into the render function and pipe the resulting stream into the response.

```js
var http = require("http");
var ssr = require("done-ssr");
var render = ssr();

var server = http.createServer(function(request, response){
	render(request).pipe(response);
});

server.listen(8080);
```

### Your app

done-ssr exports your code to look like:

```js
module.exports = function(request){
  // Do whatever is needed to render
};
```

More can be found in the [main module docs](https://github.com/donejs/done-ssr/blob/master/docs/main.md).

## License

MIT
