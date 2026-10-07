import {displayRows} from './result-order.mjs?v=4';
import {evaluate, dec, formatDecimal} from './engine.mjs?v=4';
import {loadSettings, saveSettings, validateSettings, axisName, friendlyLabel} from './settings.mjs?v=4';
import {renderReport, STATUS_LABELS, TYPE_LABELS, MASS_LABELS, timestamp} from './report.mjs?v=4';
import {fitA4} from './print.mjs?v=4';
const $ = id => document.getElementById(id);
const element = (tag, text, cls) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; };
const storage = {getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value)};
const loaded = loadSettings(storage);
let settings = loaded.settings, settingsSaved = loaded.saved, lastRecord = null, isDemo = false;
let hasResult = false, noticeTimer = null;
const form = $('measurement-form');

function notice(text) {
  clearTimeout(noticeTimer); $('status-message').textContent = text;
  if (text) noticeTimer = setTimeout(() => { if ($('status-message').textContent === text) $('status-message').textContent = ''; }, 7000);
}
function factorySummary() {
  const summary = element('div',undefined,'factory-values');
  summary.append(element('strong', settings.unit), element('span', `${TYPE_LABELS[settings.type]}・${settings.axisCount}軸 ${settings.wheels}輪`), element('span', settings.massMode === 'record' ? '記録簿計算済み／加算0kg' : settings.massMode === 'certificate' ? '車検証入力／前軸＋55kg' : '実測／加算0kg'));
  $('factory-summary').replaceChildren(summary); $('save-state').textContent = settingsSaved ? '設定保存済み' : '初期設定未保存';
}
function setSettingsPanel(open) {
  $('settings-panel').hidden = !open; $('settings-toggle').setAttribute('aria-expanded', String(open));
  $('calculate').disabled = open;
  if (open) { settingsEditor(); $('settings-error').textContent = ''; }
}
function settingsEditor() {
  $('set-unit').value = settings.unit; $('set-class').value = settings.vehicleClass;
  $('set-type').value = settings.type; $('set-mass').value = settings.massMode;
  editorOptions(settings.axisCount, settings.wheels, settings.rearAxes);
}
function editorOptions(count, wheels, roles) {
  const trailer = $('set-type').value === 'trailer', minimum = trailer ? 1 : 2;
  $('set-count').replaceChildren();
  for (let n = minimum; n <= 4; n++) { const option = element('option',String(n)); option.value = String(n); $('set-count').append(option); }
  $('set-count').value = String(Math.max(minimum, count || minimum));
  const axleCount = Number($('set-count').value);
  $('set-wheels').replaceChildren();
  for (let n = axleCount * 2; n <= 16; n += 2) { const option = element('option',String(n)); option.value = String(n); $('set-wheels').append(option); }
  $('set-wheels').value = String(Math.max(axleCount * 2, wheels || axleCount * 2));
  if (!$('set-wheels').value) $('set-wheels').value = String(axleCount * 2);
  if (trailer) { $('set-mass').value = 'measured'; $('set-class').value = '被牽引'; }
  else if ($('set-class').value === '被牽引') $('set-class').value = '普通・小型・軽';
  $('set-mass').disabled = trailer;
  $('set-roles').replaceChildren();
  if ($('set-type').value === 'general' && axleCount > 2) {
    for (let i = 0; i < axleCount; i++) {
      const label = element('label',`第${i + 1}軸の区分`), select = element('select'); select.dataset.roleIndex = String(i);
      [['front','前車軸'],['rear','後車軸']].forEach(([v,t]) => { const o = element('option',t); o.value = v; select.append(o); });
      select.value = (roles?.[i] ?? i > 0) ? 'rear' : 'front';
      if (i === 0) { select.value = 'front'; select.disabled = true; }
      label.append(select); $('set-roles').append(label);
    }
  }
}
function editorChanged() {
  const roles = [...$('set-roles').querySelectorAll('select')].map(e => e.value === 'rear');
  editorOptions(Number($('set-count').value), Number($('set-wheels').value), roles.length ? roles : undefined);
}
function inputField(id, labelText, placeholder = '0') {
  const label = element('label'), sr = element('span',labelText,'sr-only'), input = element('input');
  input.id = id; input.inputMode = 'decimal'; input.autocomplete = 'off'; input.placeholder = placeholder;
  input.setAttribute('aria-label',labelText); label.append(sr,input); return label;
}
function buildMeasurements() {
  $('axes').replaceChildren(); $('lock-conditions').replaceChildren();
  for (let i = 0; i < settings.axisCount; i++) {
    const name = axisName(settings,i), row = element('div',undefined,'axis-row'); row.append(element('strong',name));
    const massLabel = settings.massMode === 'record' ? `${name} 記録簿の計算済み軸重 kg（追加加算なし）` : settings.massMode === 'certificate' ? `${name} 車検証の空車時軸重 kg（55kgを足さず入力）` : `${name} 審査時の実測軸重 kg（加算なし）`;
    row.append(inputField(`mass-${i}`, massLabel), inputField(`left-${i}`, `${name} 左制動力 ${settings.unit}`), inputField(`right-${i}`, `${name} 右制動力 ${settings.unit}`)); $('axes').append(row);
    const preview = element('div',undefined,'force-preview axis-force-preview');
    preview.append(element('span',`${name} 左右差`));
    const output = element('output','—'); output.id = `difference-${i}`;
    output.setAttribute('for',`left-${i} right-${i}`); preview.append(output); $('axes').append(preview);
    if (settings.type === 'trailer' || i === 0) {
      const label = element('label',`${name}の全車輪がロックし、追加計測困難`,'check'), input = element('input');
      input.type = 'checkbox'; input.id = `lock-${i}`; label.prepend(input); $('lock-conditions').append(label);
    }
  }
  document.querySelectorAll('.force-unit').forEach(e => e.textContent = settings.unit);
  $('current-unit').textContent = settings.unit;
  $('parkTotal').setAttribute('aria-label',`駐車（サイド）ブレーキ制動力・左右合計 ${settings.unit}`);
  $('mass-column-label').replaceChildren(element('span', settings.massMode === 'record' ? '記録簿計算済み' : settings.massMode === 'certificate' ? '車検証の軸重' : '実測軸重'),element('small',' kg'));
  const instructions = {
    record:['記録簿の計算済み軸重を、そのまま入力','前軸は記録簿で55kg加算済み。アプリの追加加算は0kgです。'],
    certificate:['車検証の空車時軸重を、55kgを足さずに入力','アプリが前軸だけ55kg加算します。後軸には加算しません。'],
    measured:['運転者1名乗車で実測した軸重を、そのまま入力','運転者分を含む実測値なので、アプリは55kgを加算しません。']
  };
  $('mass-instruction').replaceChildren(element('strong',instructions[settings.massMode][0]),element('span',instructions[settings.massMode][1]));
  $('low-fields').hidden = settings.type !== 'low'; $('trailer-fields').hidden = settings.type !== 'trailer'; $('exception-field').hidden = settings.type !== 'trailer';
  updateMassPreview();
}
function updateMassPreview() {
  updateForcePreview();
  try {
    const inputs = Array.from({length:settings.axisCount},(_,i) => dec($(`mass-${i}`).value));
    if (inputs.some(n => n <= 0n)) throw Error();
    const rawSum = inputs.reduce((a,b) => a+b,0n), added = settings.massMode === 'certificate' ? dec('55') : 0n;
    const used = settings.type === 'trailer' ? dec($('trailerWeight').value) : rawSum + added;
    const box = element('div');
    box.append(element('strong',`審査時車両重量 ${formatDecimal(used)} kg`), element('span',` ／ アプリ追加加算 ${formatDecimal(added)} kg`));
    if (settings.type !== 'trailer') box.append(element('div',`${inputs.map(formatDecimal).join(' + ')}${added ? ' + 55' : ''} = ${formatDecimal(used)} kg`));
    else box.append(element('div',`各軸重の合計 ${formatDecimal(rawSum)} kg ／ 支持荷重を含む車両全体の重量を使用`));
    $('mass-preview').replaceChildren(box);
  } catch { $('mass-preview').textContent = settings.massMode === 'certificate' ? '前軸へのアプリ加算：55kg ／ 軸重を入力すると審査時車両重量を表示' : 'アプリの追加加算：0kg ／ 軸重を入力すると審査時車両重量を表示'; }
}
function updateForcePreview() {
  const multiplier = {N:1n,daN:10n,kN:1000n,kgf:1n}[settings.unit];
  const unit = settings.unit === 'kgf' ? 'kgf' : 'N';
  let total = 0n, complete = true;
  for (let i = 0; i < settings.axisCount; i++) {
    try {
      const left = dec($(`left-${i}`).value), right = dec($(`right-${i}`).value);
      const difference = left > right ? left-right : right-left;
      $(`difference-${i}`).textContent = `${formatDecimal(difference * multiplier)} ${unit}`;
      total += (left + right) * multiplier;
    } catch {
      $(`difference-${i}`).textContent = '—'; complete = false;
    }
  }
  $('force-total').textContent = complete ? `${formatDecimal(total)} ${unit}` : '—';
}
function readMeasurements() {
  return {
    type:settings.type, unit:settings.unit, massMode:settings.massMode, vehicleRef:$('vehicle-ref').value.trim(),
    axes:Array.from({length:settings.axisCount},(_,i) => ({mass:$(`mass-${i}`).value.trim(),left:$(`left-${i}`).value.trim(),right:$(`right-${i}`).value.trim(),rear:settings.rearAxes[i],lock:$(`lock-${i}`)?.checked || false})),
    wet:$('wet').checked, parkTotal:$('parkTotal').value.trim(), parkLock:$('parkLock').checked, hold:$('hold').value,
    empty:$('empty').value.trim(), gross:$('gross').value.trim(), speed:$('speed').value.trim(), trailerWeight:$('trailerWeight').value.trim(), breakaway:$('breakaway').value.trim(), exception:$('exception').checked
  };
}
function invalidateResult(waiting = false) {
  lastRecord = null; $('print').disabled = true; $('print-report').replaceChildren();
  if (!hasResult && !waiting) return;
  $('overall').className = ''; $('overall').replaceChildren(element('span','制動力の総合判定','overall-kicker'),element('h3',waiting ? '入力待ち' : '再計算が必要'),element('p',waiting ? '軸重・測定値を入力して、計算ボタンを押してください。' : '入力が変更されました。計算ボタンで結果を更新してください。'));
  $('results').replaceChildren(); $('result-errors').replaceChildren(); $('result-summary').replaceChildren(); $('audit').replaceChildren(); $('result-list-heading').hidden = true;
  hasResult = false;
}
function clearVehicle() {
  form.reset();
  // 動的フィールドも明示的に消去し、工場の初期設定を維持。
  for (const i of form.querySelectorAll('input')) { if (i.type === 'checkbox') i.checked = false; else i.value = ''; }
  $('hold').value = 'unknown'; isDemo = false; $('demo-banner').hidden = true;
  invalidateResult(true); updateMassPreview();
}
function renderAudit(r) {
  const details = element('details',undefined,'audit-details'); details.append(element('summary',`軸重と55kgの内訳 ／ アプリ追加加算 ${r.massAudit.addedTotal} kg`));
  const table = element('table'), head = element('thead'), headRow = element('tr');
  ['車軸','入力 kg','アプリ加算 kg','使用 kg'].forEach(t => headRow.append(element('th',t))); head.append(headRow); table.append(head);
  const body = element('tbody');
  r.massAudit.rows.forEach(a => { const row = element('tr'); [axisName(settings,a.index),a.input,'＋'+a.added,a.used].forEach(t => row.append(element('td',t))); body.append(row); });
  table.append(body); details.append(table,element('p',r.massAudit.explanation),element('p',`重量計算：${r.massAudit.expression} = ${r.weight} kg`)); $('audit').replaceChildren(details);
}
function renderResults(r, input, date) {
  hasResult = true;
  const title = {input:'入力を確認',pass:'適合',fail:'不適合の項目あり',pending:'要確認',deemed:'適合（ロック条件含む）'};
  const description = {input:'入力を修正して、再計算してください。',pass:'入力値と確認条件は、対象の制動力基準を満たしています。',fail:'該当項目の計算値・基準値・条件を確認してください。',pending:'数値は基準を満たしています。駐車の保持条件を確認してください。',deemed:'基準適合とみなす項目があります。各行の条件を確認してください。'};
  $('overall').className = r.status; $('overall').replaceChildren(element('span','制動力の総合判定','overall-kicker'),element('h3',title[r.status]),element('p',description[r.status]));
  $('result-errors').replaceChildren(...r.errors.map(t => element('p',t,'error-message')));
  $('result-summary').replaceChildren(); $('results').replaceChildren(); $('audit').replaceChildren(); $('result-list-heading').hidden = !r.rows.length;
  if (r.weight) {
    const summary = element('div',undefined,'result-summary'); summary.append(element('strong',`審査時車両重量 ${r.weight} kg`),element('div',`アプリ追加加算 ${r.massAudit.addedTotal} kg ／ ${input.massMode==='record'?'記録簿の計算済み軸重':input.massMode==='certificate'?'車検証記載の空車時軸重':'審査時の実測軸重'}`)); $('result-summary').append(summary);
    renderAudit(r);
  }
  for (const row of displayRows(r.rows)) {
    const details = element('details',undefined,'result-row'), summary = element('summary');
    const value = element('span',row.value,'row-value'); value.append(element('small',row.ratioUnit));
    const threshold = element('span',row.threshold,'row-threshold'); threshold.append(element('small',`${row.ratioUnit} ${row.upper?'以下':'以上'}`));
    summary.append(element('span',friendlyLabel(row.label,settings),'row-label'),value,threshold,element('span',STATUS_LABELS[row.status],`badge ${row.status}`)); details.append(summary);
    const body = element('div',undefined,'detail-body'); body.append(element('div',row.fullFormula,'detail-formula'));
    const dl = element('dl');
    const pairs = [
      ['計算に使った制動力',`${row.force} ${settings.unit==='kgf'?'kgf':'N'}`],['計算に使った重量',`${row.mass} kg`],
      ['丸め前の算出値（参考）',`${row.rawValue} ${row.ratioUnit}`],['丸め処理',row.rounding],
      ['端数処理後の判定値',`${row.value} ${row.ratioUnit}`],['適用基準',`${row.threshold} ${row.ratioUnit} ${row.upper?'以下':'以上'}`],
      ['数値の判定',STATUS_LABELS[row.numericStatus]],['この項目の判定',STATUS_LABELS[row.status]],['条項',row.ref]
    ];
    if (row.lockConfirmed) pairs.push(['ロック条件','全車輪ロック＋追加計測困難を確認済み']);
    if (row.hold) pairs.push(['停止保持後の条件',{yes:'機械的保持を確認済み',unknown:'未確認',no:'液圧・空気圧・電気的作用を利用'}[row.hold]]);
    pairs.forEach(([a,b]) => dl.append(element('dt',a),element('dd',b))); body.append(dl);
    if (settings.unit === 'daN' || settings.unit === 'kN') body.append(element('p',`入力した${settings.unit}値を${settings.unit==='daN'?'10':'1,000'}倍してNとして計算しています。`));
    body.append(element('p','丸め前は小数第8位までの参考表示です。「…」は続きがあることを示します。判定には正確な入力値と規定の端数処理を使用します。'));
    if (row.note) body.append(element('p',row.note,'condition-note')); details.append(body); $('results').append(details);
  }
  lastRecord = r.status === 'input' ? null : {result:r,input,settings:validateSettings(settings),date,demo:isDemo};
  $('print').disabled = !lastRecord;
  if (lastRecord) $('print-report').innerHTML = renderReport(r,input,settings,date,isDemo); else $('print-report').replaceChildren();
}
$('settings-toggle').addEventListener('click',() => { const open = $('settings-panel').hidden; setSettingsPanel(open); if (open && window.matchMedia('(max-width:850px)').matches) $('settings-panel').scrollIntoView({behavior:'smooth',block:'start'}); });
$('settings-cancel').addEventListener('click',() => setSettingsPanel(false));
$('set-count').addEventListener('change',editorChanged); $('set-type').addEventListener('change',editorChanged);
$('set-class').addEventListener('change',() => { if ($('set-class').value === '被牽引') $('set-type').value='trailer'; else if ($('set-type').value === 'trailer') $('set-type').value='general'; editorChanged(); });
$('settings-form').addEventListener('submit',e => {
  e.preventDefault();
  try {
    const axisCount = Number($('set-count').value), roleInputs = [...$('set-roles').querySelectorAll('select')];
    const candidate = {unit:$('set-unit').value,vehicleClass:$('set-class').value,type:$('set-type').value,axisCount,wheels:Number($('set-wheels').value),massMode:$('set-mass').value,rearAxes:roleInputs.length?roleInputs.map(s=>s.value==='rear'):Array.from({length:axisCount},(_,i)=>i>0)};
    const next = saveSettings(storage,candidate), changed = JSON.stringify(next) !== JSON.stringify(settings);
    settings = next; settingsSaved = true; factorySummary(); setSettingsPanel(false);
    if (changed) { clearVehicle(); buildMeasurements(); }
    $('usage').open = false; notice(changed?'初期設定を保存しました。入力値をクリアし、新しい設定を適用しました。':'初期設定を保存しました。次回もこの設定で開始します。');
  } catch(err) { $('settings-error').textContent=err.message; }
});
form.addEventListener('input',() => { invalidateResult(); updateMassPreview(); });
form.addEventListener('change',() => invalidateResult());
form.addEventListener('submit',e => {
  e.preventDefault(); if (!$('settings-panel').hidden) return;
  const input = readMeasurements(), r = evaluate(input); renderResults(r,input,timestamp());
  if (window.matchMedia('(max-width:850px)').matches) { $('result').focus({preventScroll:true}); $('result').scrollIntoView({behavior:'smooth',block:'start'}); }
});
$('new-vehicle').addEventListener('click',() => { clearVehicle(); $(`mass-0`).focus({preventScroll:true}); if (window.matchMedia('(max-width:850px)').matches) form.scrollIntoView({behavior:'smooth',block:'start'}); notice('初期設定を保持し、車両の入力値・確認条件をクリアしました。'); });
$('print').addEventListener('click',async () => {
  if (!lastRecord) return;
  const record = lastRecord;
  if (document.fonts?.ready) await document.fonts.ready;
  if (lastRecord !== record) return;
  fitA4($('print-report')); window.print();
});
window.addEventListener('beforeprint',() => {
  if (lastRecord) {
    $('print-report').innerHTML=renderReport(lastRecord.result,lastRecord.input,lastRecord.settings,lastRecord.date,lastRecord.demo);
    fitA4($('print-report'));
  }
  else { const p=element('p','計算後に「A4記録票を印刷」から印刷してください。'); $('print-report').replaceChildren(p); }
});
$('demo').addEventListener('click',() => {
  clearVehicle();
  const multiplier = {N:1,daN:10,kN:1000,kgf:10}[settings.unit];
  for (let i=0;i<settings.axisCount;i++) {
    const raw = i===0?800:500, adjusted = settings.massMode==='record'&&i===0?raw+55:raw;
    $(`mass-${i}`).value=String(adjusted); $(`left-${i}`).value=String((i===0?2500:1000)/multiplier); $(`right-${i}`).value=String((i===0?2400:950)/multiplier);
  }
  const massTotal = 800 + (settings.axisCount-1)*500;
  $('empty').value=String(massTotal); $('gross').value=String(massTotal*1.2); $('speed').value='70';
  $('trailerWeight').value=String(massTotal); $('breakaway').value=String(massTotal*2.5/multiplier);
  $('parkTotal').value=String(massTotal*2.6/multiplier); $('hold').value='yes';
  isDemo=true; $('demo-banner').hidden=false; updateMassPreview(); notice('現在の初期設定に合わせた入力例です。計算ボタンで結果を確認できます。');
});
factorySummary(); buildMeasurements(); invalidateResult(true);
setSettingsPanel(!settingsSaved); $('usage').open=!settingsSaved;
if (loaded.message) notice(loaded.message);
