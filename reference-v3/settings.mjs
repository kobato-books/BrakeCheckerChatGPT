// 初期設定だけを保存する。車両の重量・測定値・当日の確認条件は保存しない。
export const STORAGE_KEY = 'brake-check:factory:v2';
export const DEFAULT_SETTINGS = Object.freeze({schema: 2, unit: 'N', type: 'general', vehicleClass: '普通・小型・軽', axisCount: 2, wheels: 4, massMode: 'record', rearAxes: [false, true]});
export function validateSettings(v) {
  if (!v || typeof v !== 'object') throw Error('初期設定の形式が不正です。');
  if (!['N','daN','kN','kgf'].includes(v.unit)) throw Error('テスタの単位を選択してください。');
  if (!['general','low','trailer'].includes(v.type)) throw Error('適用する車両区分を選択してください。');
  if (!['普通・小型・軽','貨物・バス','被牽引'].includes(v.vehicleClass)) throw Error('対象車種を選択してください。');
  const axisCount = Number(v.axisCount), wheels = Number(v.wheels), min = v.type === 'trailer' ? 1 : 2;
  if (!Number.isInteger(axisCount) || axisCount < min || axisCount > 4) throw Error('軸数を確認してください。');
  if (!Number.isInteger(wheels) || wheels < axisCount * 2 || wheels > 16 || wheels % 2) throw Error('輪数は軸数×2以上、16輪以下の偶数で設定してください（複輪も数えます）。');
  if (!['certificate','record','measured'].includes(v.massMode)) throw Error('軸重の入力方法を選択してください。');
  if (v.type === 'trailer' && (v.massMode !== 'measured' || v.vehicleClass !== '被牽引')) throw Error('被牽引車は対象車種「被牽引」・軸重「実測」を設定してください。');
  if (v.type !== 'trailer' && v.vehicleClass === '被牽引') throw Error('被牽引車は適用区分「被牽引車」を選択してください。');
  if (!Array.isArray(v.rearAxes) || v.rearAxes.length !== axisCount || v.rearAxes.some(x => typeof x !== 'boolean')) throw Error('各軸の前・後区分を確認してください。');
  if (v.type === 'general' && (v.rearAxes[0] || !v.rearAxes.some(Boolean))) throw Error('第1軸は前軸、後車軸を1軸以上設定してください。');
  return {schema: 2, unit: v.unit, type: v.type, vehicleClass: v.vehicleClass, axisCount, wheels, massMode: v.massMode, rearAxes: [...v.rearAxes]};
}
export function loadSettings(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return {settings: validateSettings(DEFAULT_SETTINGS), saved: false, message: ''};
    const value = JSON.parse(raw);
    if (value.schema !== 2) throw Error('保存設定のバージョンが異なります。');
    return {settings: validateSettings(value), saved: true, message: ''};
  } catch { return {settings: validateSettings(DEFAULT_SETTINGS), saved: false, message: '保存設定を読み込めません。初期設定を確認して保存してください。'}; }
}
export function saveSettings(storage, value) {
  const settings = validateSettings(value);
  try { storage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
  catch { throw Error('このブラウザでは設定を保存できません。保存を許可する通常のブラウザで開いてください。'); }
  return settings;
}
export function axisName(settings, index) {
  if (settings.type === 'trailer') return `第${index + 1}軸`;
  if (settings.axisCount === 2) return index === 0 ? '前軸' : '後軸';
  return `第${index + 1}軸（${settings.rearAxes[index] ? '後' : '前'}）`;
}
export function friendlyLabel(label, settings) {
  if (label === '主ブレーキ 総和') return '総制動力';
  if (label === '駐車ブレーキ 総和') return 'サイドブレーキ制動力';
  if (settings.type !== 'trailer' && settings.axisCount === 2) {
    if (label === '第1軸 左右差') return '前輪制動力差';
    if (label === '第2軸 後輪の和') return '後輪制動力';
    if (label === '第2軸 左右差') return '後輪制動力差';
  }
  return label.replace(/第(\d+)軸/g, (_, n) => axisName(settings, Number(n) - 1));
}
