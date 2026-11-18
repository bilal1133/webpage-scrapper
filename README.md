# Webpage Scraper API

A small Express + Puppeteer service that loads any web page in headless Chrome (so JavaScript-rendered content is included) and returns its HTML or visible text as JSON. A single browser instance is reused across requests for speed, and it is ready to deploy on Heroku.

## Quick start

```bash
npm install      # also downloads Puppeteer's Chrome
npm start        # http://localhost:3000
```

Set `PORT` to change the port. On Heroku, set `CHROME_BIN` to the Chrome buildpack's binary path.

## API

### `GET /scrape`

| Query param | Required | Description |
| --- | --- | --- |
| `url` | yes | Page to load |
| `type` | no | `text` for visible text, anything else (default) for full `body` HTML |

```bash
curl "http://localhost:3000/scrape?url=https://example.com&type=text"
```

```json
{
  "success": true,
  "url": "https://example.com",
  "type": "text",
  "content": "Example Domain ..."
}
```

Errors return `400` when `url` is missing and `500` when the page fails to load, with `success: false` and a `message`.

### `GET /`

Health check that returns a short usage message.

## Notes

- Pages are loaded with `waitUntil: "networkidle2"`, so slow sites may take a few seconds.
- The browser closes cleanly on `SIGINT` / `SIGTERM`.
- Only scrape sites you have permission to access, and respect their terms and `robots.txt`.
