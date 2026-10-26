// 記録簿への転記順。計算・判定の行を変更せず表示順だけを変える。
export function displayRows(rows) {
  const rank = r => {
    if (r.label === '主ブレーキ 総和') return 100;
    if (r.label === '駐車ブレーキ 総和') return 110;
    if (r.label === '分離ブレーキ 総和') return 120;
    const axis = /第(\d+)軸/.exec(r.label);
    return axis ? Number(axis[1]) * 2 + (r.upper ? 1 : 0) : 130;
  };
  return [...rows].sort((a,b) => rank(a)-rank(b));
}
