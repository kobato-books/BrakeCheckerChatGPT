const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/yukih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseline=fs.readFileSync(path.join(__dirname,'../backups/brake-staging-rc1-before-menu-20261025/dist/index.html'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const checks=[];
 const factory={schema:2,unit:'N',type:'general',vehicleClass:'普通・小型・軽',axisCount:2,wheels:4,massMode:'record',rearAxes:[false,true]};
 for(const [name,width,height] of [['desktop',1280,900],['iphone',390,844],['small',320,568]]){
  const context=await browser.newContext({viewport:{width,height}});await context.addInitScript(s=>{if(!localStorage.getItem('brake-check:factory:v2'))localStorage.setItem('brake-check:factory:v2',JSON.stringify(s));},factory);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:8766/');
  assert.equal(await page.locator('.brand h1').innerText(),'制動力計算');assert(await page.locator('#app-menu-toggle').isVisible());
  assert(await page.locator('.app-icon').evaluate(img=>img.complete&&img.naturalWidth===180),'Header icon loaded from the same PNG as Apple icon');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const header=await page.locator('.screen-app>header').evaluate(el=>[...el.querySelectorAll('img,h1,button')].map(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})));for(let i=1;i<header.length;i++)assert(header[i].left>=header[i-1].right-1);
  const content=await page.evaluate(before=>{const doc=new DOMParser().parseFromString(before,'text/html');return ['#usage','.sources','.release-info'].map(selector=>({same:document.querySelector(selector).innerHTML===doc.querySelector(selector).innerHTML}));},baseline);assert(content.every(x=>x.same),'Explanations and links byte-preserved in DOM');
  await page.locator('#demo').click();await page.locator('#vehicle-ref').fill('確認車両 <A>');await page.locator('#calculate').click();
  const results=await page.locator('#results').innerText(),print=await page.locator('#print-report').innerHTML(),right=await page.locator('#right-0').inputValue();
  for(const route of ['guide','reference','about','history']){
   await page.locator('#app-menu-toggle').click();assert(await page.locator('#app-menu').isVisible());
   assert.deepEqual(await page.locator('#app-menu nav button').allTextContents(),['初めて使う方へ・入力方法','計算式・端数処理・公式資料','アプリ情報','更新履歴']);
   await page.locator(`[data-page="${route}"]`).click();assert(await page.locator('#info-'+route).isVisible());assert(await page.locator('#calculator-view').isHidden());
   assert.equal(await page.locator('#right-0').inputValue(),right);assert.equal(await page.locator('#vehicle-ref').inputValue(),'確認車両 <A>');
   if(route==='reference'){const links=await page.locator('#info-reference a').evaluateAll(nodes=>nodes.map(n=>({href:n.getAttribute('href'),target:n.target})));assert.equal(links.length,4);assert(links.every(x=>x.target==='_blank'));}
   if(route==='about'){assert((await page.locator('#info-about').innerText()).includes('4.0.0-rc.1（公開前確認版）'));}
   await page.screenshot({path:path.join(__dirname,'checks',name+'-'+route+'.png'),fullPage:true});
   await page.locator('#info-'+route+' .information-heading button').click();assert(await page.locator('#calculator-view').isVisible());
   assert.equal(await page.locator('#results').innerText(),results);assert.equal(await page.locator('#print-report').innerHTML(),print);
  }
  await page.locator('#app-menu-toggle').click();await page.locator('[data-page="guide"]').click();await page.goBack();assert(await page.locator('#calculator-view').isVisible());
  await page.locator('#app-menu-toggle').click();await page.keyboard.press('Escape');assert(await page.locator('#app-menu').isHidden());
  await page.locator('#settings-toggle').click();await page.locator('#set-unit').selectOption('daN');await page.locator('#settings-form button[type="submit"]').click();await page.reload();assert((await page.locator('#factory-summary').innerText()).includes('daN'));
  const manifest=await page.evaluate(async()=>JSON.parse(await(await fetch('/manifest.webmanifest')).text()));assert.equal(manifest.name,'制動力計算');assert.deepEqual(manifest.icons.map(i=>i.sizes),['192x192','512x512']);
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('sizes'),'180x180');
  await page.screenshot({path:path.join(__dirname,'checks',name+'-new-header.png'),fullPage:true});assert.deepEqual(errors,[]);checks.push({name,width,header:true,navigation:true,contentPreserved:true,inputsAndResultsPreserved:true,settingsPersisted:true,pwa:true});await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(__dirname,'checks/navigation-checks.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
