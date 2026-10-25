const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/yukih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{for(const size of [180,192,512])await sharp(path.join(__dirname,'dist/app-icon.svg')).resize(size,size).png().toFile(path.join(__dirname,`dist/icon-${size}.png`));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/manifest.webmanifest'),'utf8'));
manifest.name='制動力計算';manifest.short_name='制動力計算';manifest.icons=manifest.icons.map(icon=>({...icon,src:icon.src+'?v=20261025'}));
fs.writeFileSync(path.join(__dirname,'dist/manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');console.log('Shared SVG exported to 180/192/512px PNGs.');})();
