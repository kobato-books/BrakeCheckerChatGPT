const DISPLAY_KEY='brake-check:result-display:v1';
function savedView(){try{const view=window.localStorage.getItem(DISPLAY_KEY);return ['standard','large'].includes(view)?view:'large';}catch{return 'large';}}
export function applyResultView(){
  const root=document.getElementById('result');
  const standard=root.dataset.resultView==='standard';
  root.classList.toggle('standard-view',standard);
  root.querySelectorAll('[data-result-view]').forEach(button=>{const active=(button.dataset.resultView==='standard')===standard;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  const normal=root.querySelector('.result-standard'),large=root.querySelector('.result-large');
  if(normal)normal.hidden=!standard;if(large)large.hidden=standard;
  document.getElementById('results').setAttribute('aria-labelledby',standard?'result-tab-standard':'result-tab-large');
}
export function installResultTabs(){
 const root=document.getElementById('result');root.dataset.resultView=savedView();
 const tabs=document.createElement('div');tabs.className='result-display-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','判定結果の表示方法');
 for(const [view,label] of [['standard','標準表示'],['large','大きく表示']]){
  const button=document.createElement('button');button.type='button';button.id='result-tab-'+view;button.dataset.resultView=view;button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls','results');
  button.addEventListener('click',()=>{root.dataset.resultView=view;applyResultView();try{window.localStorage.setItem(DISPLAY_KEY,view);}catch{/* 保存不可でも表示の切り替えは維持する。 */}});
  button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const buttons=[...tabs.children];const index=event.key==='Home'?0:event.key==='End'?1:1-buttons.indexOf(button);buttons[index].click();buttons[index].focus();}});tabs.append(button);
 }
 root.querySelector('.panel-heading').insertBefore(tabs,document.getElementById('print'));
 document.getElementById('results').setAttribute('role','tabpanel');applyResultView();
}
