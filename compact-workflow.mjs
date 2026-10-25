export function installCompactWorkflow(){
 const form=document.getElementById('measurement-form');
 const original=form.querySelector('.conditions'),heading=original.querySelector('.conditions-heading');
 const conditions=document.createElement('details');conditions.className='conditions collapsible-conditions';conditions.open=false;
 const summary=document.createElement('summary');summary.append(heading);
 summary.addEventListener('click',event=>{event.preventDefault();conditions.open=!conditions.open;});
 const state=document.createElement('span');state.className='conditions-state';state.setAttribute('aria-live','polite');summary.append(state);
 conditions.append(summary,...original.childNodes);original.replaceWith(conditions);
 function refresh(){
  const checked=id=>document.getElementById(id)?.checked;
  const locks=[...document.querySelectorAll('#lock-conditions input')];
  const confirmed=locks.filter(input=>input.checked).map(input=>input.parentElement.textContent.replace('の全車輪がロックし、追加計測困難',''));
  const hold={unknown:'未確認',yes:'機械的保持を確認',no:'液圧等を利用'}[document.getElementById('hold').value];
  state.textContent=`濡れ：${checked('wet')?'あり':'なし'} ／ 車軸ロック：${confirmed.length?confirmed.join('・')+'確認済み':'未確認'} ／ 駐車ロック：${checked('parkLock')?'確認済み':'未確認'} ／ 駐車保持：${hold}${checked('exception')?' ／ 適用除外あり':''}`;
 }
 form.addEventListener('change',refresh);
 document.getElementById('demo').addEventListener('click',()=>{conditions.open=false;refresh();});
 document.getElementById('settings-form').addEventListener('submit',()=>{conditions.open=false;refresh();});
 const next=document.getElementById('new-vehicle');
 next.addEventListener('click',()=>{conditions.open=false;refresh();});
 const actions=document.createElement('div');actions.className='result-bottom-actions';
 const print=document.createElement('button');print.type='button';print.id='print-bottom';print.textContent='A4上半分に印刷';
 const printTop=document.getElementById('print');print.disabled=printTop.disabled;print.addEventListener('click',()=>printTop.click());
 new MutationObserver(()=>{print.disabled=printTop.disabled;}).observe(printTop,{attributes:true,attributeFilter:['disabled']});
 const nextBottom=document.createElement('button');nextBottom.type='button';nextBottom.id='new-vehicle-bottom';nextBottom.textContent='次の車両';nextBottom.addEventListener('click',()=>next.click());
 actions.append(print,nextBottom);document.getElementById('result').append(actions);refresh();
}
