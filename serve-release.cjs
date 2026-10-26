const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.join(__dirname,'dist'),port=8788;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(port,'127.0.0.1',()=>{
 console.log('PC: http://localhost:'+port+'/');
 for(const network of Object.values(os.networkInterfaces()).flat())if(network&&network.family==='IPv4'&&!network.internal)console.log('Local network: http://'+network.address+':'+port+'/');
});

