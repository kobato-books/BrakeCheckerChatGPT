import assert from 'node:assert/strict';
import {evaluate} from './dist/engine.mjs';
import {displayRows} from './dist/result-order.mjs';
import {DEFAULT_SETTINGS,friendlyLabel} from './dist/settings.mjs';
import {renderReport} from './dist/report.mjs';
const input={type:'general',unit:'N',massMode:'record',axes:[{mass:'855',left:'2500',right:'2400'},{mass:'500',left:'1000',right:'950',rear:true}],parkTotal:'2750',hold:'yes'};
const r=evaluate(input), rows=displayRows(r.rows);
assert.deepEqual(rows.map(x=>friendlyLabel(x.label,DEFAULT_SETTINGS)),['前輪制動力差','後輪制動力差','後輪制動力','総制動力','サイドブレーキ制動力']);
assert.equal(r.rows[0].label,'主ブレーキ 総和'); // 純粋な表示変更
const park=rows.at(-1);assert.equal(park.force,'2750');assert.equal(park.fullFormula,'2750 ÷ (855 + 500)');assert.equal(park.value,'2.02');assert.equal(park.threshold,'1.96');
assert.equal(evaluate({...input,parkTotal:'2655.8'}).rows.at(-1).numericStatus,'pass');
assert.equal(evaluate({...input,parkTotal:'2655.799999'}).rows.at(-1).numericStatus,'fail');
assert.equal(evaluate({...input,parkTotal:''}).status,'input');
const html=renderReport(r,input,DEFAULT_SETTINGS,'now');assert.ok(html.includes('2750 N'));let previous=-1;for(const row of rows){const at=html.indexOf('<th>'+friendlyLabel(row.label,DEFAULT_SETTINGS)+'<small>',html.indexOf('3．計算式'));assert.ok(at>previous);previous=at;}
console.log('v3: single parking total, boundary, display/print order passed');
