const express = require('express');
const axios = require('axios');
const {program} = require('commander');
const fs = require('fs');

program
.option('-p, --port <number>', 'Port to run the proxy server', '3000')
.option('-o, --origin <url>', 'The target origin server URL')
.option('--clear-cache', 'clear the persistent file cache');


program.parse(process.argv);
const options = program.opts();


if(options.clearCache) {
    fs.writeFileSync('my-cache.json', '{}');
    console.log("cache cleared successfully! you can start fresh.");
    process.exit(0);
}

const PORT = options.port || process.env.PORT;
let originUrl = options.origin || process.env.originUrl;

// Forcing origin to HTTPS if it isn't already, dummyjson requires SSL
if (originUrl && originUrl.startsWith('http://')) {
    originUrl = originUrl.replace('http://', 'https://');
}

const app = express();
let urlCache;
if (fs.existsSync('my-cache.json')) {
    const fileText = fs.readFileSync('my-cache.json', 'utf8');
    const jsonText = JSON.parse(fileText);
    urlCache = new Map(Object.entries(jsonText));
} else {
    urlCache = new Map();
}


app.use(express.json());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Expose-Headers', 'X-Cache');
  next();
});

app.use(async (req, res) => {
    console.log(
        `Method: ${req.method}\nPath: ${req.url}`
    );

    const targetUrl = `${originUrl}${req.url}`;
    const targetHost = new URL(originUrl).host;

    try {
        let forwardedResponse, responseToReturn;
        const cacheKey = `${req.method}:${req.url}`;
        if (urlCache.has(cacheKey)) {
            //we have got the hit
            responseToReturn = urlCache.get(cacheKey);
            res.set('X-Cache', 'HIT');
        } else {
            //we have got a miss
            forwardedResponse = await axios({
                method: req.method,
                url: targetUrl,
                headers: {
                    'host': targetHost,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'accept-encoding': 'identity',
                },
            });
            res.set('X-Cache', 'MISS');
            responseToReturn = {
                status: forwardedResponse.status,
                data: forwardedResponse.data,
            }
            // storing the response at the end anyway
            urlCache.set(cacheKey, responseToReturn);
            const plainObject = Object.fromEntries(urlCache);
            fs.writeFileSync('my-cache.json', JSON.stringify(plainObject));
        }

        return res
            .status(responseToReturn.status)
            .json(responseToReturn.data);

    } catch (err) {
        console.log(err.message);

        return res.status(500).json({
            message: "Error forwarding request"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
    console.log(`Target Destination: ${originUrl}`);
});
