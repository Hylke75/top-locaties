// Statusendpoint (gelinkt vanuit /.well-known/api-catalog als rel="status").
export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify({ status: 'ok', service: 'top-locaties', time: new Date().toISOString() }));
}
