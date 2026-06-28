# Caching-Proxy

A CLI tool that starts a caching proxy server. Forwards HTTP requests to an origin server, caches the responses, and returns cached responses on repeat requests — with `X-Cache` headers indicating whether the response was a cache hit or miss.

Built with Node.js, Express, and axios.

---

## How It Works

```

Client → Caching Proxy → Origin Server

                ↓

           Cache (memory + disk)

```

First request to a path → proxy forwards to origin, caches the response (`X-Cache: MISS`)  

Same request again → proxy returns cached response directly (`X-Cache: HIT`)

Cache persists to disk (`my-cache.json`) and survives server restarts.

---

## Installation

```bash

git clone https://github.com/NewlAsh/caching-proxy

cd caching-proxy

npm install

npm link

```

`npm link` registers the `caching-proxy` command globally so you can run it from anywhere in your terminal.

---

## Usage

### Start the proxy server

```bash

caching-proxy --port <number> --origin <url>

```

**Example:**

```bash

caching-proxy --port 3000 --origin https://dummyjson.com

```

The proxy starts on port 3000 and forwards all requests to `https://dummyjson.com`.

```bash

# First request — fetched from origin

GET http://localhost:3000/products

# Response header → X-Cache: MISS

# Same request again — served from cache

GET http://localhost:3000/products

# Response header → X-Cache: HIT

```

### Clear the cache

```bash

caching-proxy --clear-cache

```

Wipes `my-cache.json`. Next request to any path will be a cache miss.

---

## Options

| Flag | Description |

|------|-------------|

| `-p, --port <number>` | Port to run the proxy server on (default: 3000) |

| `-o, --origin <url>` | Target origin server URL to forward requests to |

| `--clear-cache` | Clear the persistent cache and exit |

---

## Response Headers

Every response includes an `X-Cache` header:

| Value | Meaning |

|-------|---------|

| `HIT` | Response was served from cache |

| `MISS` | Response was fetched from origin and cached |

---

## Project Structure

```

caching-proxy/

├── server.js        # Entry point — CLI parsing, proxy logic, cache layer

├── my-cache.json    # Auto-generated persistent cache file

├── package.json

└── README.md

```

---

## Tech Stack

- **Node.js** — runtime

- **Express** — HTTP server

- **axios** — server-side HTTP requests to origin

- **commander** — CLI argument parsing

- **fs** — persistent cache storage

---

## Notes

- Cache is keyed by `METHOD:PATH?QUERY` — different query strings are cached separately

- Origin response headers are forwarded to the client

- Cache persists across server restarts via `my-cache.json`

- `--clear-cache` can be run while the server is stopped — it operates on the file directly
