# TUNE - SPA Vanilla JS Only

## Description
Simple artists/tracks single page application made using html, css and javascript only. Different routes in pages are handled through netlify redirects(<em>see netlify.toml</em>). Environment variables are injected during build time. Built using Last.fm and spotify API. Spotify API was required since last.fm does not provide pictures.

## Preview URL
[Preview Demo](https://main--kumang-tune.netlify.app/)

### Build command for netlify
```
echo -e "export const API_key = 'Api key';\n\nexport const CLIENT_ID = 'Spotify client id';\n\nexport const CLIENT_SECRET = 'Spotify client secret';" > config.js
```

### Basic node server configuration for development

```js
const express = require('express');
const path = require('path');

const app = express();

app.use("/",express.static(path.resolve(__dirname,"..","frontend")))

app.all("*", (req, res) => {
    res.sendFile(path.resolve(__dirname,"..","frontend/index.html"))
})

app.listen(3000, () => console.log("Server is running on port 3000"));
```
Please note: My folder structure is as follows:  

    ├── server -> server.js 
    ├── frontend
    │   ├── index.html
    │   ├── styles.css
    │   └── index.js
    └── ...