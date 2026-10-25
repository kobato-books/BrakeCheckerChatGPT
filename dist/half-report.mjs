import {resultLayoutPlan} from './result-layout.mjs';
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderReport(result,input,settings,date,demo=false){
 if(result.errors.length||!result.weight)return '<p>入力を確認し、再計算してください。</p>';
 const groups=resultLayoutPlan(result,input,settings);
 const rows=new Map(result.rows.map(row=>[row.label,row]));
 const notes=[];
 if(input.wet)notes.push('ローラ濡れ条件あり');
 // 適否や適合扱いは印刷しない。確認された条件の事実だけを短く残す。
 input.axes.forEach((axis,i)=>{if(axis.lock)notes.push(`第${i+1}軸：全車輪ロック・追加計測困難`);});
 if(input.parkLock)notes.push('駐車：全装着車輪ロック・追加計測困難');
 if(input.type==='low')notes.push(`低速特例・総重量 ${input.gross} kg・最高速度 ${input.speed} km/h`);
 if(input.type==='trailer')notes.push('被牽引車・支持荷重を含む重量を使用');
 const content=groups.map(group=>`<section class="slip-group"><h2>${escape(group.title)}</h2><div class="slip-grid">${group.cells.map(cell=>{
  const source=cell.rowKey?rows.get(cell.rowKey):cell;
  return `<div class="slip-cell" style="grid-column:${cell.column};grid-row:${cell.line}"><span class="slip-label">${escape(cell.label)}</span><strong>${escape(source.value)}</strong><small>${escape(cell.rowKey?source.ratioUnit:source.unit)}</small></div>`;
 }).join('')}</div></section>`).join('');
 return `<div class="half-sheet"><article class="calculation-slip"><header class="slip-header"><h1>制動力 計算記録</h1><span>${escape(date)}</span></header><div class="slip-meta"><span>車両番号・管理番号：${escape(input.vehicleRef||'未記入')}</span><span>${demo?'入力例・実車記録には使用しない':'計算値の確認・転記用'}</span></div><div class="slip-weight">審査時車両重量 ${escape(result.weight)} kg ／ アプリ追加加算 ${escape(result.massAudit.addedTotal)} kg</div>${content}${notes.length?`<p class="slip-notes">計測条件：${escape(notes.join(' ／ '))}</p>`:''}<div class="slip-footer"><span>計算記録（指定整備記録簿の代替ではありません）</span><span>KOBATO BOOKS</span></div></article></div>`;
}
export function fitA4(root,doc=document){
 const page=root.querySelector('.calculation-slip');if(!page)return;
 const saved=root.getAttribute('style');
 root.style.cssText='display:block!important;position:fixed!important;left:-10000px!important;top:0!important;width:210mm!important;height:auto!important;visibility:hidden!important;';
 root.style.setProperty('--slip-scale','1');
 const meter=doc.createElement('div');meter.style.cssText='height:132.5mm;width:1px;position:absolute;';root.append(meter);
 const available=meter.getBoundingClientRect().height,actual=page.getBoundingClientRect().height;
 meter.remove();if(saved===null)root.removeAttribute('style');else root.setAttribute('style',saved);
 root.style.setProperty('--slip-scale',String(Math.min(1,(available-2)/actual)));
}
