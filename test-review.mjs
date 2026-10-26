import fs from 'node:fs';
import assert from 'node:assert/strict';
import {evaluate} from './dist/engine.mjs';
import {renderReport,fitA4} from './dist/half-report.mjs';
import {renderReport as beforeReport} from './baseline/half-report.mjs';
import {resultLayoutPlan} from './dist/result-layout.mjs';
import {resultLayoutPlan as beforePlan} from './baseline/result-layout.mjs';
import {DEFAULT_SETTINGS} from './dist/settings.mjs';
import {groupNumber} from './dist/input-feedback.mjs';

for(const name of ['engine.mjs','settings.mjs','print.mjs','half-report.mjs','half-report.css','report.mjs','report.css','style.css','result-prototype.css','result-order.mjs','result-tabs.mjs','compact-workflow.mjs','app-navigation.css','manifest.webmanifest']){
 assert.deepEqual(fs.readFileSync('dist/'+name),fs.readFileSync('baseline/'+name),name+' unchanged');
}
const app=fs.readFileSync('dist/app.mjs','utf8').replace("import {arrangeInputSequence} from './input-sequence.mjs';\n",'').replace('  arrangeInputSequence(form,settings);\n','');
assert.equal(app,fs.readFileSync('baseline/app.mjs','utf8'),'Only input presentation hook added to existing application');
const section=s=>s.match(/<section id="settings-panel"[\s\S]*?<\/section>/)[0];
assert.equal(section(fs.readFileSync('dist/index.html','utf8')),section(fs.readFileSync('baseline/index.html','utf8')),'Settings form unchanged');
for(const [raw,expected] of [['5300','5,300'],['3400','3,400'],['0','0'],['1234567.120','1,234,567.120'],['0.10','0.10']])assert.equal(groupNumber(raw),expected);
for(const unit of ['N','daN','kN','kgf'])for(const type of ['general','low','trailer'])for(const axisCount of [2,3,4]){
 const settings={...DEFAULT_SETTINGS,unit,type,axisCount,rearAxes:Array.from({length:axisCount},(_,i)=>i>0)};
 const input={type,unit,massMode:type==='trailer'?'measured':'record',axes:Array.from({length:axisCount},(_,i)=>({mass:i?'780':'895',right:'5300',left:'5200',rear:i>0})),parkTotal:'3400',hold:'yes',gross:'2000',empty:'1675',speed:'70',trailerWeight:'1675',breakaway:'4000'};
 const result=evaluate(input);
 assert.deepEqual(resultLayoutPlan(result,input,settings),beforePlan(result,input,settings));
 assert.equal(renderReport(result,input,settings,'2026/10/26'),beforeReport(result,input,settings,'2026/10/26'),'Print snapshot unchanged');
}
for(const actual of [300,700,1800]){
 let removed=false,restored=false;const styles=new Map(),available=132.5*96/25.4;
 const root={querySelector:()=>({getBoundingClientRect:()=>({height:actual})}),getAttribute:()=>null,removeAttribute:()=>{restored=true},style:{setProperty:(k,v)=>styles.set(k,v)},append:()=>{}};
 fitA4(root,{createElement:()=>({style:{},getBoundingClientRect:()=>({height:available}),remove:()=>{removed=true}})});
 assert(actual*Number(styles.get('--slip-scale'))<=available-2+1e-8);assert(removed&&restored);
}
console.log('Review preservation, formatting, 36 unit/type/axle print comparisons and current half-print sizing passed.');

const navigation=fs.readFileSync('dist/app-navigation.mjs','utf8').replace(/\n \/\/ Release 4\.1\.0 history start[\s\S]*? \/\/ Release 4\.1\.0 history end\n/,'');
assert.equal(navigation,fs.readFileSync('baseline/app-navigation.mjs','utf8'),'Only release history added to navigation');
