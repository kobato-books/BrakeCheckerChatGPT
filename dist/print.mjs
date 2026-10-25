// CSS実寸の印刷領域と内容の高さを比較して、A4 1枚の内側に収める。
// 計算式や入力値を省略せず、長い4軸の記録も全内容を保持する。
export function printScale(contentHeight, availableHeight) {
  if (!Number.isFinite(contentHeight) || !Number.isFinite(availableHeight) || contentHeight <= 0 || availableHeight <= 2) return 1;
  return Math.min(1, (availableHeight - 2) / contentHeight);
}
export function fitA4(root, doc = document) {
  const page = root.querySelector('.report-page');
  if (!page) return;
  const original = root.getAttribute('style');
  root.style.setProperty('--print-scale','1');
  // 画面を動かさず、A4の内容幅186mmで文字の折返しと高さを測る。
  root.style.setProperty('display','block','important');
  root.style.setProperty('position','fixed','important');
  root.style.setProperty('left','-10000px','important');
  root.style.setProperty('top','0','important');
  root.style.setProperty('width','186mm','important');
  root.style.setProperty('height','auto','important');
  root.style.setProperty('visibility','hidden','important');
  const meter = doc.createElement('div');
  meter.style.cssText='position:absolute;width:1px;height:274mm;visibility:hidden;';
  root.append(meter);
  const availableHeight = meter.getBoundingClientRect().height;
  const contentHeight = page.getBoundingClientRect().height;
  meter.remove();
  if (original === null) root.removeAttribute('style'); else root.setAttribute('style',original);
  root.style.setProperty('--print-scale',String(printScale(contentHeight,availableHeight)));
}
