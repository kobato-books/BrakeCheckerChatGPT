import {displayRows} from './result-order.mjs?v=4';
import {axisName, friendlyLabel} from './settings.mjs?v=4';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STATUS_LABELS = {pass:'適合', fail:'不適合', pending:'要確認', deemed:'適合（ロック）', input:'入力未完了'};
export const TYPE_LABELS = {general:'一般車', low:'低速車特例', trailer:'被牽引車'};
export const MASS_LABELS = {certificate:'車検証記載値 → 前軸に55kg加算', record:'記録簿の審査時軸重（前軸55kg計算済み）→ 追加加算0kg', measured:'審査時の実測軸重 → 加算0kg'};
export function timestamp(date = new Date()) {
  return new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
}
// 操作用DOMとは別の記録票を生成。入力変更時は破棄し、最終計算のスナップショットだけ印刷する。
export function renderReport(result, input, settings, calculatedAt, demo = false) {
  if (result.status === 'input' || result.errors.length) return '';
  const e = escapeHTML, yesno = v => v ? '確認済み' : 'なし';
  const hold = {yes:'液圧・空気圧・電気的作用を利用せず機械的保持（確認済み）', no:'液圧・空気圧・電気的作用を利用', unknown:'未確認'}[input.hold] || '未確認';
  const axes = input.axes.map((a, i) => `<tr><th>${e(axisName(settings,i))}</th><td>${e(a.mass)}</td><td>＋${e(result.massAudit.rows[i].added)}</td><td>${e(result.massAudit.rows[i].used)}</td><td>${e(a.left)}</td><td>${e(a.right)}</td><td>${a.lock ? '全車輪ロック・追加計測困難' : 'なし'}</td></tr>`).join('');
  const notes = result.rows.filter(r => r.note).map(r => `<li>${e(friendlyLabel(r.label, settings))}：${e(r.note)}</li>`).join('');
  const unitRule = settings.unit === 'daN' ? 'daN×10＝Nで計算' : settings.unit === 'kN' ? 'kN×1,000＝Nで計算' : settings.unit === 'kgf' ? 'kgf÷kg×100＝%で計算' : 'N÷kg＝N/kgで計算';
  const rows = displayRows(result.rows).map(r => `<tr><th>${e(friendlyLabel(r.label,settings))}<small>${e(r.ref)}</small></th><td class="report-formula"><div>${e(r.fullFormula)} ＝ ${e(r.rawValue)} ${e(r.ratioUnit)}</div><small>${e(r.force)} ${settings.unit === 'kgf' ? 'kgf' : 'N'} ÷ ${e(r.mass)} kg${settings.unit === 'kgf' ? ' ×100' : ''}</small></td><td class="num">${e(r.value)}<small>${e(r.ratioUnit)}</small></td><td class="num">${e(r.threshold)}<small>${e(r.ratioUnit)} ${r.upper ? '以下' : '以上'}</small></td><td>${r.upper ? '切上げ' : '切捨て'}<small>小数${r.digits}桁</small></td><td class="report-status ${r.status}">${e(STATUS_LABELS[r.status])}${r.status !== r.numericStatus ? `<small>数値：${e(STATUS_LABELS[r.numericStatus])}</small>` : ''}</td></tr>`).join('');
  return `<div class="report-page"><div class="report-header"><div><p>自動車検査・計算記録</p><h1>制動力計算・適否判定 記録票</h1></div><div class="report-outcome"><span>制動力基準の総合判定</span><strong>${e(STATUS_LABELS[result.status])}</strong></div></div>
  ${demo ? '<p class="report-demo">入力例・検証用　実車の検査記録ではありません</p>' : ''}
  <div class="report-meta"><span>車両番号・管理番号：${e(input.vehicleRef || '未記入')}</span><span>計算日時：${e(calculatedAt)}（日本時間）</span></div>
  <h2>1．検査条件</h2><div class="report-conditions"><p>${e(settings.vehicleClass)} ／ ${e(TYPE_LABELS[input.type])} ／ ${settings.axisCount}軸・${settings.wheels}輪 ／ 入力単位：${e(input.unit)}（${e(unitRule)}）</p><p>軸重入力：${e(MASS_LABELS[input.massMode])}</p><p>ローラ：${input.wet ? '降雨等の天候による濡れ条件' : '濡れ条件の適用なし'} ／ 審査時車両重量：${e(result.weight)} kg</p>${input.type==='low'?`<p>低速車条件：車両重量 ${e(input.empty)} kg ／ 車両総重量 ${e(input.gross)} kg ／ 最高速度 ${e(input.speed)} km/h</p>`:''}${input.type==='trailer'?`<p>被牽引車の審査時車両重量 ${e(input.trailerWeight)} kg（キングピン等の支持荷重を含む）／ 特例：なし</p>`:''}</div>
  <h2>2．入力値と軸重の使用値</h2><table class="report-measurements"><thead><tr><th>車軸</th><th>入力軸重 kg</th><th>アプリ加算 kg</th><th>使用軸重 kg</th><th>左 ${e(input.unit)}</th><th>右 ${e(input.unit)}</th><th>主制動ロック確認</th></tr></thead><tbody>${axes}<tr><th>駐車</th><td colspan="3">左右合計（全装着軸）</td><td colspan="2">${e(input.parkTotal)} ${e(input.unit)}</td><td>${yesno(input.parkLock)}</td></tr></tbody></table>
  <p class="report-mass">重量計算：${e(result.massAudit.expression)} ＝ ${e(result.weight)} kg。アプリの追加加算合計：${e(result.massAudit.addedTotal)} kg。</p><p class="report-mass">${e(result.massAudit.explanation)}</p>${input.type==='trailer'?`<p class="report-mass">分離ブレーキ総和（入力値）：${e(input.breakaway)} ${e(input.unit)}</p>`:''}<p class="report-mass">駐車の全装着車軸・全車輪（推進軸制動は推進軸）のロック＋追加計測困難：${yesno(input.parkLock)}。保持条件：${e(hold)}。</p>
  <h2>3．計算式・端数処理・項目別判定</h2><table class="report-calculations"><colgroup><col style="width:17%"><col style="width:39%"><col style="width:11%"><col style="width:11%"><col style="width:10%"><col style="width:12%"></colgroup><thead><tr><th>判定項目</th><th>式／丸め前の算出値（参考）</th><th>判定値</th><th>基準値</th><th>丸め処理</th><th>適否</th></tr></thead><tbody>${rows}</tbody></table><p class="report-rounding">以上の項目：${settings.unit === 'kgf' ? '小数第2位以下を切り捨て、小数1桁' : '小数第3位以下を切り捨て、小数2桁'}。以下の項目（左右差）：同じ桁で切り上げ。丸め前は小数第8位までの参考表示（…は続きあり）。左右差は差の絶対値。</p>
  ${notes ? `<div class="report-notes"><strong>判定の条件・確認事項</strong><ul>${notes}</ul></div>` : ''}
  <div class="report-footer"><p>根拠：NALTEC審査事務規程9-3（第9章・第72次）／細目告示第171条第7項／四国運輸局Q7（資料88頁・端数処理）。基準確認日：2026-10-05。</p><p>本票は入力値に基づく制動力計算の補助記録。車両全体の最終適否および特例の適用は検査員が判断。指定整備記録簿の代替ではありません。</p></div></div>`;
}
