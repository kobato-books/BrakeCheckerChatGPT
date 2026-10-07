import assert from 'node:assert/strict';
import {printScale, fitA4} from './dist/print.mjs';
const height=274*96/25.4;
// A4に収まる内容は縮小しない。長い記録は全体が印刷領域以内になる。
assert.equal(printScale(800,height),1);
for(const content of [height,1200,1800,2400]){const scale=printScale(content,height);assert.ok(scale>0&&scale<=1);assert.ok(content*scale<=height-2+1e-9)}
for(const n of [0,-1,NaN,Infinity])assert.equal(printScale(n,height),1);
// 記録内容そのものを消去・書換えずにサイズのみ調整。計測用のCSS・要素を残さない。
const styles=new Map([['--print-scale','0.8']]);let removed=false;const report={getBoundingClientRect:()=>({height:1800})};
const root={querySelector:()=>report,getAttribute:()=> '--print-scale:0.8',style:{setProperty:(k,v)=>styles.set(k,v)},append:()=>{},setAttribute:(k,v)=>{assert.equal(k,'style');assert.equal(v,'--print-scale:0.8')},removeAttribute:()=>{throw Error('既存styleを消してはいけない')}};
const doc={createElement:()=>({style:{},getBoundingClientRect:()=>({height}),remove:()=>{removed=true}})};
fitA4(root,doc);assert.equal(removed,true);assert.equal(Number(styles.get('--print-scale')),printScale(1800,height));
console.log('A4 sizing: 3 checks passed');
