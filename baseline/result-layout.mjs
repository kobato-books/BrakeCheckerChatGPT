import {dec, formatDecimal} from './engine.mjs?v=3';
import {axisName} from './settings.mjs?v=3';
import {applyResultView} from './result-tabs.mjs';

// 表示に使用する入力値の集計だけを行う。適否・比率・丸めはengineの行をそのまま使用。
export function resultLayoutPlan(result, input, settings) {
  const field = (label, value, unit, column, line) => ({label, value, unit, column, line});
  const ratio = (label, row, column, line) => row ? {label, rowKey:row.label, column, line} : null;
  const groups = input.axes.map((axis, index) => {
    const prefix = `第${index + 1}軸`;
    const difference = result.rows.find(row => row.label === `${prefix} 左右差`);
    const axleSum = result.rows.find(row => row.label.startsWith(`${prefix} `) && !row.upper);
    const title = axisName(settings,index);
    return {title, cells:[
      field('右制動力',formatDecimal(dec(axis.right)),input.unit,1,1),
      field('左制動力',formatDecimal(dec(axis.left)),input.unit,1,2),
      field('左右差',formatDecimal(dec(axis.right)>dec(axis.left)?dec(axis.right)-dec(axis.left):dec(axis.left)-dec(axis.right)),input.unit,2,1),
      ratio('左右差 / 軸重',difference,2,2),
      axis.rear ? field(settings.axisCount===2?'後輪制動力合計':`${title}制動力合計`,formatDecimal(dec(axis.right)+dec(axis.left)),input.unit,1,3) : null,
      ratio(input.type==='trailer'?'車軸制動力計算値':settings.axisCount===2?'後軸制動力計算値':`${title}制動力計算値`,axleSum,2,3)
    ].filter(Boolean)};
  });
  const total = result.rows.find(row => row.label === '主ブレーキ 総和');
  if(total) groups.push({title:'総合',cells:[
    field('制動力合計',formatDecimal(input.axes.reduce((value,axis)=>value+dec(axis.right)+dec(axis.left),0n)),input.unit,1,1),
    ratio('総制動力',total,2,1)
  ]});
  const parking = result.rows.find(row => row.label === '駐車ブレーキ 総和');
  if(parking) groups.push({title:'サイド',cells:[field('駐車制動力合計',formatDecimal(dec(input.parkTotal)),input.unit,1,1),ratio('駐車制動力',parking,2,1)]});
  const breakaway = result.rows.find(row=>row.label==='分離ブレーキ 総和');
  if(breakaway) groups.push({title:'分離ブレーキ',cells:[field('分離制動力合計',formatDecimal(dec(input.breakaway)),input.unit,1,1),ratio('分離制動力',breakaway,2,1)]});
  return groups;
}

export function arrangeResultLayout(container, result, input, settings) {
  // kg表示も、結果内だけで「項目名→数値→単位」にそろえる。
  const weightHeading=document.querySelector('#result-summary .result-summary > strong');
  if(weightHeading){
    weightHeading.textContent=`審査時車両重量 ${result.weight} kg`;
  }
  const audit=document.querySelector('#audit .audit-details table');
  if(audit){
    audit.querySelectorAll('thead th:not(:first-child)').forEach(cell=>cell.textContent=cell.textContent.replace(/ kg$/,''));
    audit.querySelectorAll('tbody td:not(:first-child)').forEach(cell=>{const unit=document.createElement('small');unit.className='transfer-unit';unit.textContent='kg';cell.append(unit);});
  }
  const originalRows = [...container.querySelectorAll('.result-row')];
  const standard=document.createElement('div');standard.className='result-standard';
  const headings=document.createElement('div');headings.className='standard-list-heading';
  const forceUnit=input.unit==='kgf'?'kgf':'N';
  for(const label of ['判定項目',`${forceUnit}値`,'計算値','基準値','適否']){const span=document.createElement('span');span.textContent=label;headings.append(span);}
  const labels={'第1軸 左右差':'前輪の差','第2軸 左右差':'後輪の差','第2軸 後輪の和':'後輪制動力','主ブレーキ 総和':'総合制動力','駐車ブレーキ 総和':'サイドブレーキ'};
  const order=Object.keys(labels);
  const simple=settings.type==='general'&&settings.axisCount===2;
  const ordered=simple?[...originalRows].sort((a,b)=>{const rank=key=>order.includes(key)?order.indexOf(key):100;return rank(a.dataset.resultLabel)-rank(b.dataset.resultLabel);}):originalRows;
  standard.append(headings,...ordered.map(node=>{
    const copy=node.cloneNode(true),row=result.rows.find(row=>row.label===node.dataset.resultLabel);
    if(simple&&labels[row.label])copy.querySelector('.row-label').textContent=labels[row.label];
    const force=document.createElement('span');force.className='row-force';force.textContent=row.force;
    const unit=document.createElement('small');unit.textContent=forceUnit;force.append(unit);
    copy.querySelector('summary').insertBefore(force,copy.querySelector('.row-value'));
    return copy;
  }));
  const nodes = new Map(originalRows.map(node=>[node.dataset.resultLabel,node]));
  const used = new Set();
  const create = (tag,text,className) => {const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const fragment=document.createDocumentFragment();
  for(const group of resultLayoutPlan(result,input,settings)){
    const section=create('section',undefined,'transfer-group');
    section.append(create('h3',group.title,'transfer-heading'));
    const grid=create('div',undefined,'transfer-grid');
    for(const cell of group.cells){
      let item;
      if(cell.rowKey){
        item=nodes.get(cell.rowKey);if(!item)continue;
        used.add(item);item.classList.add('transfer-calculation');
        item.querySelector('.row-label').textContent=cell.label;
        item.querySelector('.row-threshold').prepend(document.createTextNode('基準 '));
        const summary=item.querySelector('summary');
        const criteria=document.createElement('span');criteria.className='criteria-inline';
        criteria.append(item.querySelector('.row-threshold'),item.querySelector('.badge'));
        summary.append(criteria);
      }else{
        item=create('div',undefined,'transfer-measurement');
        item.append(create('span',cell.label,'transfer-label'));
        const value=create('span',cell.value,'transfer-value');value.append(create('small',cell.unit,'transfer-unit'));item.append(value);
      }
      item.style.gridColumn=cell.column;item.style.gridRow=cell.line;grid.append(item);
    }
    section.append(grid);fragment.append(section);
  }
  // 想定外の既存判定項目も消さずに維持する。
  const remaining=originalRows.filter(node=>!used.has(node));
  if(remaining.length){const other=create('section',undefined,'transfer-group');other.append(create('h3','その他の判定','transfer-heading'),...remaining);fragment.append(other);}
  const large=create('div',undefined,'result-large');large.append(fragment);
  container.replaceChildren(standard,large);applyResultView();
}
