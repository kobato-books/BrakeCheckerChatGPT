// 説明のDOMを移動するだけで、入力フォーム・結果・設定の再生成はしない。
export function installAppNavigation(){
 const shell=document.querySelector('.screen-app'),main=shell.querySelector('main'),header=shell.querySelector('header');
 const settings=document.getElementById('settings-toggle');
 const actions=document.createElement('div');actions.className='header-actions';settings.before(actions);actions.append(settings);
 const toggle=document.createElement('button');toggle.type='button';toggle.id='app-menu-toggle';toggle.className='menu-toggle';toggle.setAttribute('aria-label','メニューを開く');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-controls','app-menu');toggle.setAttribute('aria-expanded','false');
 for(let i=0;i<3;i++){const line=document.createElement('span');line.setAttribute('aria-hidden','true');toggle.append(line);}actions.append(toggle);
 const calculator=document.createElement('div');calculator.id='calculator-view';calculator.append(...main.childNodes);main.append(calculator);
 const screens=document.createElement('div');screens.id='information-screens';main.append(screens);
 const guide=document.getElementById('usage'),sources=calculator.querySelector('.sources'),about=calculator.querySelector('.release-info');
 const changes=document.createElement('div');changes.className='change-log';
 const entry=document.createElement('article');const title=document.createElement('h3');title.textContent='4.0.0（正式版）';
 const date=document.createElement('time');date.dateTime='2026-10-25';date.textContent='2026-10-25';
 const list=document.createElement('ul');
 for(const text of ['2026-10-25 正式公開。既存本番URLと初期設定の保存方式を継続。','計算値列を右に寄せ、見出しと数値の位置を調整。','標準表示の判定結果を5行・5列に整理し、記録簿転記用のN値を追加。','後輪制動力合計を結果左列に追加し、PCの左入力・右結果配置を復元。','ヘッダー名を「制動力計算」に変更し、計算結果一覧を表す共通アイコンを追加。','説明情報をアプリ内メニューへ移動し、更新履歴を追加。','入力中の左右差・軸別合計・全軸合計、結果の標準表示／大きく表示を整備。','確認条件の折りたたみ、結果下部の次の車両、A4上半分の計算記録票を追加。','計算式・判定基準・端数処理・単位換算は実務版3から変更なし。']){const item=document.createElement('li');item.textContent=text;list.append(item);}
 entry.append(title,date,list);changes.append(entry);
 // Release 4.1.0 history start
 const release=document.createElement('article');const releaseTitle=document.createElement('h3');releaseTitle.textContent='4.1.0（正式版）';const releaseDate=document.createElement('time');releaseDate.dateTime='2026-10-27';releaseDate.textContent='2026-10-27';const releaseList=document.createElement('ul');
 for(const text of ['入力欄を軸重、前右・前左、前左右差、後右・後左、後左右差、総制動力、サイドの縦順に変更。','自動表示欄を背景で区別し、サイドブレーキを測定欄の末尾に独立配置。','標準表示の一覧構成を維持し、大きく表示では項目名・数値・単位・基準・適否をまとめて拡大。','結果と自動表示の数値を3桁区切りで表示。','PCのTab順を入力順に統一。自動フォーカス移動は追加なし。','計算式・判定基準・端数処理・初期設定保存・印刷は4.0.0から変更なし。']){const item=document.createElement('li');item.textContent=text;releaseList.append(item);}
 release.append(releaseTitle,releaseDate,releaseList);changes.prepend(release);
 // Release 4.1.0 history end

 const routes=[['guide','初めて使う方へ・入力方法',guide],['reference','計算式・端数処理・公式資料',sources],['about','アプリ情報',about],['history','更新履歴',changes]];
 const pages=new Map();
 for(const [key,label,content] of routes){
  const section=document.createElement('section');section.className='information-page';section.id='info-'+key;section.hidden=true;
  const top=document.createElement('div');top.className='information-heading';
  const back=document.createElement('button');back.type='button';back.textContent='‹ 計算画面へ戻る';back.addEventListener('click',()=>{history.replaceState(null,'',location.pathname+location.search);show('calculator');});
  const h2=document.createElement('h2');h2.textContent=label;h2.tabIndex=-1;
  top.append(back,h2);section.append(top,content);screens.append(section);pages.set(key,section);
 }
 const dialog=document.createElement('dialog');dialog.id='app-menu';dialog.className='app-menu';dialog.setAttribute('aria-labelledby','app-menu-title');
 const menuTop=document.createElement('div');menuTop.className='menu-heading';const menuTitle=document.createElement('h2');menuTitle.id='app-menu-title';menuTitle.textContent='メニュー';
 const close=document.createElement('button');close.type='button';close.textContent='閉じる';close.addEventListener('click',()=>dialog.close());menuTop.append(menuTitle,close);dialog.append(menuTop);
 const nav=document.createElement('nav');nav.setAttribute('aria-label','アプリ情報メニュー');dialog.append(nav);
 for(const [key,label] of routes){const button=document.createElement('button');button.type='button';button.dataset.page=key;button.textContent=label;button.addEventListener('click',()=>{dialog.close();history.pushState({brakeInfo:key},'',`#${key}`);show(key);});nav.append(button);}
 const calcLink=document.createElement('button');calcLink.type='button';calcLink.className='menu-calculator-link';calcLink.textContent='計算画面へ戻る';calcLink.addEventListener('click',()=>{dialog.close();history.replaceState(null,'',location.pathname+location.search);show('calculator');});dialog.append(calcLink);shell.append(dialog);
 let current='calculator',returnScroll=0,returnFocus=null;
 function show(key,initial=false){
  if(!pages.has(key))key='calculator';
  if(current==='calculator'&&key!=='calculator'){returnScroll=window.scrollY;returnFocus=document.activeElement;}
  calculator.hidden=key!=='calculator';screens.hidden=key==='calculator';
  for(const [route,page] of pages){page.hidden=key!==route;if(key===route){const details=page.querySelector('details');if(details)details.open=true;}}
  nav.querySelectorAll('button').forEach(button=>{if(button.dataset.page===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  current=key;
  if(!initial){if(key==='calculator'){window.scrollTo({top:returnScroll,behavior:'instant'});if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus({preventScroll:true});}else{window.scrollTo({top:0,behavior:'instant'});pages.get(key).querySelector('h2').focus({preventScroll:true});}}
 }
 toggle.addEventListener('click',()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');document.documentElement.classList.add('app-menu-open');});
 settings.addEventListener('click',()=>{if(current!=='calculator'){history.replaceState(null,'',location.pathname+location.search);show('calculator');document.getElementById('settings-panel').scrollIntoView({block:'start'});}});
 dialog.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.documentElement.classList.remove('app-menu-open');toggle.focus({preventScroll:true});});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
 const fromLocation=()=>show(location.hash.slice(1));window.addEventListener('popstate',fromLocation);
 show(location.hash.slice(1),true);
}
