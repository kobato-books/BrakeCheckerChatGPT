import {dec,formatDecimal} from './engine.mjs?v=3';
const number=value=>{const [whole,fraction]=formatDecimal(value).split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');};
export function updateInputFeedback(form,settings){
  let total=0n,complete=true;
  for(let index=0;index<settings.axisCount;index++){
    const right=form.querySelector(`#right-${index}`),left=form.querySelector(`#left-${index}`);
    let box=right.closest('.axis-row').querySelector('.axis-feedback');
    if(!box){box=document.createElement('div');box.className='axis-feedback';box.setAttribute('aria-live','polite');right.closest('.axis-row').append(box);}
    let difference='—',sum='—';
    try{const r=dec(right.value),l=dec(left.value);difference=number(r>l?r-l:l-r);sum=number(r+l);total+=r+l;}catch{complete=false;}
    box.replaceChildren();
    const row=document.createElement('div');row.className='axis-feedback-line';
    for(const text of ['左右差',difference,settings.unit,'／','合計',sum,settings.unit]){const span=document.createElement('span');span.textContent=text;row.append(span);}
    box.append(row);
    if(index===settings.axisCount-1){const all=document.createElement('div');all.className='axis-feedback-total';
      for(const text of ['全軸合計',complete?number(total):'—',settings.unit]){const span=document.createElement('span');span.textContent=text;all.append(span);}box.append(all);}
  }
}
