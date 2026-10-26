import {axisName} from './settings.mjs?v=3';

// Move the existing controls: IDs, values, form events and storage remain unchanged.
export function arrangeInputSequence(form, settings) {
  const axes = form.querySelector('#axes');
  const controls = new Map([...axes.querySelectorAll('input')].map(input => [input.id, input]));
  const fragment = document.createDocumentFragment();
  const prefix = index => settings.type !== 'trailer' && settings.axisCount === 2
    ? (index === 0 ? '前' : '後') : axisName(settings, index);
  function field(id, labelText, unit) {
    const input = controls.get(id);
    const row = document.createElement('div'); row.className = 'sequence-row sequence-input';
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = labelText;
    const unitText = document.createElement('small'); unitText.textContent = unit;
    label.append(unitText);
    const value = document.createElement('div'); value.className = 'sequence-control';
    value.append(input); row.append(label, value); fragment.append(row);
  }
  function automatic(id, labelText) {
    const row = document.createElement('div'); row.className = 'sequence-row sequence-auto';
    const label = document.createElement('span'); label.textContent = labelText;
    const unit = document.createElement('small'); unit.textContent = settings.unit; label.append(unit);
    const output = document.createElement('output'); output.id = id; output.textContent = '—';
    output.setAttribute('aria-label', `${labelText} ${settings.unit}`);
    output.setAttribute('aria-live', 'polite');
    row.append(label, output); fragment.append(row);
  }
  for (let index = 0; index < settings.axisCount; index++) {
    field(`mass-${index}`, settings.type !== 'trailer' && settings.axisCount === 2 ? `${prefix(index)}軸重` : `${axisName(settings,index)} 軸重`, 'kg');
  }
  for (let index = 0; index < settings.axisCount; index++) {
    field(`right-${index}`, `${prefix(index)}右制動力`, settings.unit);
    field(`left-${index}`, `${prefix(index)}左制動力`, settings.unit);
    automatic(`sequence-difference-${index}`, `${prefix(index)}左右差`);
  }
  automatic('sequence-total', '総制動力');
  axes.replaceChildren(fragment);
  const table = axes.closest('.measurement-table'); table.classList.add('sequence-table');
  const parking = table.querySelector('.parking-row');
  if (!parking.querySelector('h3')) {
    const heading = document.createElement('h3'); heading.textContent = 'サイドブレーキ'; parking.prepend(heading);
    const label = parking.querySelector('label');
    label.firstChild.textContent = 'サイドブレーキ制動力';
  }
}
