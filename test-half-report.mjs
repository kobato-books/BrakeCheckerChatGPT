import assert from 'node:assert/strict';
import {renderReport} from './dist/half-report.mjs';
import {evaluate} from './dist/engine.mjs';
import {DEFAULT_SETTINGS} from './dist/settings.mjs';
const input={type:'general',unit:'N',massMode:'record',axes:[{mass:'895',right:'3730',left:'3550'},{mass:'780',right:'2280',left:'2350',rear:true}],parkTotal:'3460',hold:'unknown',vehicleRef:'<test>'};
for(const variant of [{},{wet:true},{parkLock:true},{hold:'no'},{axes:[{...input.axes[0],left:'0',lock:true},input.axes[1]]}]){
 const data={...input,...variant},result=evaluate(data),html=renderReport(result,data,DEFAULT_SETTINGS,'2026/10/25');
 for(const word of ['適合','不適合','未判定','要確認','基準値','基準 '])assert(!html.includes(word),word);
 assert(html.includes('&lt;test&gt;'));assert(!html.includes('<test>'));
 for(const row of result.rows)assert(html.includes('>'+row.value+'<'));
 if(data.wet)assert(html.includes('ローラ濡れ条件あり'));
}
assert(!renderReport(evaluate({...input,parkTotal:''}),input,DEFAULT_SETTINGS,'now').includes('calculation-slip'));
console.log('Half-page print values, no verdict/criteria, condition notes, escaping and invalid-input checks passed.');
