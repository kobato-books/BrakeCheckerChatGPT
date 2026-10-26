import {dec,formatDecimal} from './engine.mjs?v=3';
export function groupNumber(value){const [whole,...fraction]=String(value).split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction.length?'.'+fraction.join('.'): '');}
export function updateInputFeedback(form,settings){
 let total=0n,complete=true;
 for(let index=0;index<settings.axisCount;index++){
  let difference='—';
  try{const right=dec(form.querySelector('#right-'+index).value),left=dec(form.querySelector('#left-'+index).value);if(right<0n||left<0n)throw Error();difference=groupNumber(formatDecimal(right>left?right-left:left-right));total+=right+left;}catch{complete=false;}
  const output=form.querySelector('#sequence-difference-'+index);if(output)output.textContent=difference;
 }
 const sum=form.querySelector('#sequence-total');if(sum)sum.textContent=complete?groupNumber(formatDecimal(total)):'—';
}
