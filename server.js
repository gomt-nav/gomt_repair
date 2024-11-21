const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;

  // 預設路徑處理
  if (filePath === './') {
    filePath = './index.html';
  }

  // 當請求 /notifications 時，返回 notifications.json
  if (filePath === './notifications') {
    // 始終返回最新的 notifications.json
    fs.readFile('./crawler/notifications.json', 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unable to read notifications.json' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      }
    });
    return;
  }

  // 獲取文件擴展名
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.svg': 'application/image/svg+xml',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // 讀取並返回靜態檔案
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile('./404.html', (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
        res.end();
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
