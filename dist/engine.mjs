// 公式根拠：NALTEC 審査事務規程9-3、第72次（2026-10-05確認）。
// Nとkgfの基準は別々に適用。kgf→N換算で閾値を代用しない。
const S = 1000000n;
export function dec(v) {
  const s = String(v ?? '').trim();
  if (!/^\d{1,8}(\.\d{1,6})?$/.test(s)) throw Error('0以上の数値を、小数6桁以内で入力してください。');
  const [a, b = ''] = s.split('.');
  return BigInt(a) * S + BigInt(b.padEnd(6, '0'));
}
const sum = a => a.reduce((x, y) => x + y, 0n);
const abs = x => x < 0n ? -x : x;
export function rounded(n, d, digits, up = false) {
  const p = 10n ** BigInt(digits), a = n * p;
  let q = a / d;
  if (up && a % d) q++;
  const t = q.toString().padStart(digits + 1, '0');
  return digits ? t.slice(0, -digits) + '.' + t.slice(-digits) : t;
}
export const formatDecimal = x => rounded(x, S, 6).replace(/\.?0+$/, '') || '0';
const ratioReference = (n, d) => rounded(n, d, 8) + (n * 100000000n % d ? '…' : '');
const addition = a => a.length > 1 ? '(' + a.join(' + ') + ')' : a[0];
const field = (v, label) => { try { return dec(v); } catch (e) { throw Error(label + '：' + e.message); } };

// 毎回入力値から新しく計算。入力値を変更しないため55kgの二重加算が起きない。
export function evaluate(x) {
  const errors = [], rows = [];
  let axes, weight, gross, speed, empty;
  try {
    if (!['N', 'daN', 'kN', 'kgf'].includes(x.unit)) throw Error('制動力の単位を選択してください。');
    if (!['general', 'low', 'trailer'].includes(x.type)) throw Error('車両区分を選択してください。');
    if (!['certificate', 'record', 'measured'].includes(x.massMode)) throw Error('軸重の入力方法を選択してください。');
    if (x.type === 'trailer' && x.massMode !== 'measured') throw Error('被牽引車は審査時の実測軸重を入力してください。');
    if (!Array.isArray(x.axes) || x.axes.length < (x.type === 'trailer' ? 1 : 2) || x.axes.length > 4) throw Error('対象は一般車2〜4軸・被牽引車1〜4軸です。');
    axes = x.axes.map((a, i) => {
      const inputMass = field(a.mass, `第${i + 1}軸重`);
      const added = x.massMode === 'certificate' && i === 0 ? 55n * S : 0n;
      return {inputMass, added, mass: inputMass + added, left: field(a.left, `第${i + 1}軸 左制動力`), right: field(a.right, `第${i + 1}軸 右制動力`), lock: !!a.lock, rear: !!a.rear};
    });
    if (axes.some(a => a.inputMass <= 0n)) throw Error('入力する各軸重は0より大きい値にしてください。');
    weight = x.type === 'trailer' ? field(x.trailerWeight, '審査時車両重量') : sum(axes.map(a => a.mass));
    if (weight <= 0n) throw Error('審査時車両重量は0より大きい値にしてください。');
    if (x.type === 'trailer' && weight < sum(axes.map(a => a.mass))) throw Error('審査時車両重量が軸重の合計を下回っています。キングピン等の荷重も含めて確認してください。');
    if (x.type === 'general' && !axes.some(a => a.rear)) throw Error('初期設定で後車軸を1軸以上指定してください。');
    if (x.type === 'low') {
      empty = field(x.empty, '車両重量'); gross = field(x.gross, '車両総重量'); speed = field(x.speed, '最高速度');
      if (empty <= 0n || gross < empty || speed <= 0n || speed >= 80n * S || gross * 4n > empty * 5n) throw Error('低速車の条件は最高速度80km/h未満、車両総重量≦車両重量×1.25です。');
      if (x.massMode === 'certificate' && empty !== sum(axes.map(a => a.inputMass))) throw Error('車両重量と車検証の各軸重の合計が一致しません。');
      if (x.massMode === 'record' && empty + 55n * S !== sum(axes.map(a => a.inputMass))) throw Error('記録簿の計算済み軸重の合計が、車両重量＋55kgと一致しません。');
    }
    if (x.type === 'trailer' && x.exception) throw Error('主制動装置の省略・慣性制動・分離ブレーキの適用除外は自動判定対象外です。公式条文で個別に確認してください。');
  } catch (e) { return {errors: [e.message], rows: [], status: 'input'}; }

  const kg = x.unit === 'kgf', mult = {N: 1n, daN: 10n, kN: 1000n, kgf: 1n}[x.unit];
  const digits = kg ? 1 : 2, ratioUnit = kg ? '%' : 'N/kg';
  const f = formatDecimal, forceUnit = kg ? 'kgf' : 'N';
  const scaleExpression = expr => mult === 1n ? expr : `(${expr} × ${mult})`;
  const axisDenominator = a => a.added ? `(${f(a.inputMass)} + 55)` : f(a.mass);
  const massTerms = axes.map(a => f(a.inputMass));
  if (x.massMode === 'certificate') massTerms.push('55');
  const weightExpression = x.type === 'trailer' ? f(weight) : addition(massTerms);
  const massAudit = {
    mode: x.massMode,
    rows: axes.map((a, i) => ({index: i, input: f(a.inputMass), added: f(a.added), used: f(a.mass), rear: a.rear, expression: axisDenominator(a)})),
    baseWeight: f(sum(axes.map(a => a.inputMass))), addedTotal: f(sum(axes.map(a => a.added))),
    weight: f(weight), expression: weightExpression,
    explanation: x.massMode === 'certificate' ? '車検証記載の空車時軸重を入力。アプリが前軸だけ55kgを加算。' : x.massMode === 'record' ? '記録簿の審査時軸重を入力。前軸はすでに55kg加算済み。アプリの追加加算は0kg。' : '空車状態＋運転者1名で実測した軸重を入力。アプリの加算は0kg。'
  };

  const checks = (label, n, d, t, upper = false, lock = false, ref = '', operand = '', denominatorExpr = '') => {
    const numerator = n * (kg ? 100n : 1n), threshold = dec(t);
    // 閾値の小数桁が端数処理桁と同じなので、正確な分数比較は不利側端数処理後の比較と一致する。
    const ok = upper ? numerator * S <= d * threshold : numerator * S >= d * threshold;
    const r = {
      label, value: rounded(numerator, d, digits, upper), rawValue: ratioReference(numerator, d), ratioUnit,
      threshold: t, upper, digits, numericStatus: ok ? 'pass' : 'fail', status: ok ? 'pass' : lock ? 'deemed' : 'fail',
      ref, numerator: String(n), denominator: String(d), force: f(n), mass: f(d), lockConfirmed: lock,
      formula: `${f(n)} ${forceUnit} ÷ ${f(d)} kg${kg ? ' × 100' : ''}`,
      fullFormula: `${operand || f(n)} ÷ ${denominatorExpr || f(d)}${kg ? ' × 100' : ''}`,
      rounding: `${kg ? '小数第2位以下' : '小数第3位以下'}を${upper ? '切り上げ' : '切り捨て'}（${digits}桁）`,
      note: !ok && lock ? '全車輪ロック・追加計測困難の確認により、この項目のみ基準適合とみなす。' : ''
    };
    rows.push(r); return r;
  };
  const rawTotal = addition(axes.flatMap(a => [f(a.left), f(a.right)]));
  const total = sum(axes.map(a => (a.left + a.right) * mult));
  if (x.type === 'trailer') {
    axes.forEach((a, i) => checks(`第${i + 1}軸 制動力の和`, (a.left + a.right) * mult, a.mass,
      kg ? (x.wet ? '40' : '50') : (x.wet ? '3.92' : '4.90'), false, a.lock, '9-3(1)③', scaleExpression(`(${f(a.left)} + ${f(a.right)})`), axisDenominator(a)));
  } else {
    checks('主ブレーキ 総和', total, x.type === 'low' ? gross : weight,
      kg ? (x.type === 'low' || x.wet ? '40' : '50') : (x.type === 'low' || x.wet ? '3.92' : '4.90'),
      false, axes[0].lock, x.type === 'low' ? '9-3(1)②' : '9-3(1)①', scaleExpression(rawTotal), x.type === 'low' ? f(gross) : weightExpression);
  }
  axes.forEach((a, i) => {
    if (x.type === 'general' && a.rear) checks(`第${i + 1}軸 後輪の和`, (a.left + a.right) * mult, a.mass, kg ? '10' : '0.98', false, false, '9-3(1)①', scaleExpression(`(${f(a.left)} + ${f(a.right)})`), axisDenominator(a));
    checks(`第${i + 1}軸 左右差`, abs(a.left - a.right) * mult, a.mass, kg ? '8' : '0.78', true, false,
      x.type === 'trailer' ? '9-3(1)③' : x.type === 'low' ? '9-3(1)②' : '9-3(1)①', scaleExpression(`|${f(a.left)} − ${f(a.right)}|`), axisDenominator(a));
  });
  try {
    const parkingTotal = field(x.parkTotal, '駐車（サイド）ブレーキ制動力・左右合計');
    const p = checks('駐車ブレーキ 総和', parkingTotal * mult, weight, kg ? '20' : '1.96', false, !!x.parkLock, '9-3(1)④', scaleExpression(f(parkingTotal)), weightExpression);
    p.hold = x.hold;
    if (x.hold === 'no') { p.status = 'fail'; p.note = '停止保持後に液圧・空気圧・電気的作用を利用しているため、基準に適合しない。'; }
    else if (x.hold !== 'yes') {
      if (p.status !== 'fail') p.status = 'pending';
      p.note += (p.note ? ' ' : '') + '停止保持後、液圧・空気圧・電気的作用を利用しないことが未確認。';
    }
  } catch (e) { errors.push('駐車ブレーキ：' + e.message); }
  if (x.type === 'trailer') try {
    const b = field(x.breakaway, '分離ブレーキ');
    checks('分離ブレーキ 総和', b * mult, weight, kg ? '20' : '1.96', false, false, '9-3(1)⑤', scaleExpression(f(b)), weightExpression);
  } catch (e) { errors.push('分離ブレーキ：' + e.message); }
  return {errors, rows, massAudit, status: errors.length ? 'input' : rows.some(r => r.status === 'fail') ? 'fail' : rows.some(r => r.status === 'pending') ? 'pending' : rows.some(r => r.status === 'deemed') ? 'deemed' : 'pass', weight: f(weight), axes: axes.map(a => f(a.mass)), unit: x.unit};
}
