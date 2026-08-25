
/* MoneyPulse v8 patch: functional dashboard accordions, saves, and reference-style settings. */
(() => {
  const originalFrame = frame;
  const sectionState = JSON.parse(localStorage.mpDashboardSections || '{"wealth":true,"cashflow":false,"investments":false,"goals":false}');
  const persistSections = () => localStorage.mpDashboardSections = JSON.stringify(sectionState);
  const safe = v => esc(v ?? '');

  function sectionDetails(key, data) {
    if (key === 'wealth') return '<div class="mp-section-pad"><div class="grid accounts">'+(S.data.accounts||[]).map(a=>'<div class="card account"><div class="label">'+safe(a.name)+'</div><div class="value money">'+money(a.currentBalance)+'</div></div>').join('')+'</div></div>';
    if (key === 'cashflow') return '<div class="mp-section-pad"><div class="grid"><div class="card metric"><div class="label">Income</div><div class="value money">'+money(data.inc)+'</div></div><div class="card metric"><div class="label">Expenses</div><div class="value money">'+money(data.out)+'</div></div></div></div>';
    if (key === 'investments') return '<div class="mp-section-pad"><div class="assetlist">'+(S.data.investments||[]).map(x=>assetRow(x['Investment Name']||x.Ticker,'Investment',x['Current Value'])).join('')+'</div></div>';
    return '<div class="mp-section-pad"><div class="card empty">Goals can be added after the current asset and liability workflows are validated.</div></div>';
  }

  dashboard = function(){
    const t=periodTx(),inc=sum(t.filter(x=>x.type==='INCOME')),out=sum(t.filter(x=>x.type==='EXPENSE')),a=totals();
    const defs=[['wealth','Wealth',money(a.assets-a.liabilities),'asset'],['cashflow','Cash Flow',money(inc-out),'transfer'],['investments','Investments',money(a.equity),'worth'],['goals','Goals','0','snap']];
    const accordions=defs.map(d=>'<button class="sectionrow" data-dash="'+d[0]+'" aria-expanded="'+!!sectionState[d[0]]+'"><span>'+icon(d[3])+'</span><span class="grow"><b>'+d[1]+'</b></span><strong class="money">'+d[2]+'</strong><span>'+icon('chev')+'</span></button><div class="mp-section-content '+(sectionState[d[0]]?'':'collapsed')+'"><div>'+sectionDetails(d[0],{inc,out,a})+'</div></div>').join('');
    frame('<div class="hero-grid"><div class="card hero net"><div class="eyebrow">NET WORTH · ₹ INR</div><div class="big money">'+money(a.assets-a.liabilities)+'</div><button class="btn" onclick="go(\'worth\')">View history →</button></div><div class="card hero cash"><div class="eyebrow">CASH FLOW</div><div class="big money">'+money(inc-out)+'</div><div class="stats"><span>In '+money(inc)+'</span><span>Out '+money(out)+'</span><span>Saved '+(inc?Math.round((inc-out)/inc*100):0)+'%</span></div></div></div>'+accordions);
    document.querySelectorAll('[data-dash]').forEach(b=>b.onclick=()=>{sectionState[b.dataset.dash]=!sectionState[b.dataset.dash];persistSections();dashboard()});
  };

  function value(id){return $(id)?.value?.trim()||''}
  async function saveAsset(kind, subtype){
    let action,payload;
    if(kind==='investment'){action='CREATE_INVESTMENT';payload={ticker:value('ticker'),assetClass:value('class')||subtype,units:value('units'),manualPrice:value('price'),investedAmount:value('invested'),notes:value('notes')}}
    else if(kind==='debt'){action='CREATE_DEBT_ASSET';payload={assetType:value('type')||subtype,provider:value('provider'),principal:value('principal'),interestRate:value('rate'),currentValue:value('current')||value('principal'),notes:value('notes')}}
    else if(kind==='loan'){action='CREATE_LOAN';payload={loanType:value('type')||subtype,lender:value('lender'),originalPrincipal:value('principal'),outstandingBalance:value('outstanding'),interestRate:value('rate'),emi:value('emi'),status:'Active',notes:value('notes')}}
    else {action='CREATE_OTHER_ASSET';payload={name:value('name'),category:value('category')||subtype,purchaseValue:value('purchase'),currentValue:value('current'),notes:value('notes')}}
    try{await api(action,payload);close();await load();S.page='worth';S.net=kind==='loan'?'liabilities':'assets';render();toast((kind==='loan'?'Liability':'Asset')+' saved')}catch(e){toast(e.message)}
  }

  assetForm = function(kind,subtype){
    const commonNotes={id:'notes',label:'Notes',full:1};
    const model=kind==='investment'?[{id:'ticker',label:'Ticker / Code'},{id:'class',label:'Asset class',options:['Equity','Mutual Fund','ETF','Other']},{id:'units',label:'Units',type:'number'},{id:'price',label:'Manual Price / NAV',type:'number'},{id:'invested',label:'Invested Amount',type:'number'},commonNotes]:kind==='debt'?[{id:'type',label:'Debt type',options:['Fixed Deposit','PPF','EPF','Bond','Other']},{id:'provider',label:'Provider / Scheme'},{id:'principal',label:'Principal',type:'number'},{id:'current',label:'Current Value',type:'number'},{id:'rate',label:'Interest Rate (%)',type:'number'},commonNotes]:kind==='loan'?[{id:'type',label:'Liability type',value:subtype},{id:'lender',label:'Lender'},{id:'principal',label:'Original Principal',type:'number'},{id:'outstanding',label:'Outstanding Balance',type:'number'},{id:'rate',label:'Interest Rate (%)',type:'number'},{id:'emi',label:'EMI',type:'number'},commonNotes]:[{id:'name',label:'Asset Name'},{id:'category',label:'Category',value:subtype},{id:'purchase',label:'Purchase Value',type:'number'},{id:'current',label:'Current Value',type:'number'},commonNotes];
    open('Add '+subtype,fields(model),'<button id="cancel" class="btn">Cancel</button><button id="saveAsset" class="btn primary">Save '+(kind==='loan'?'Liability':'Asset')+'</button>');
    $('cancel').onclick=close;$('saveAsset').onclick=()=>saveAsset(kind,subtype);
  };

  snapshotForm = function(){const a=totals();open('Net Worth Snapshot','<div class="grid"><div class="card metric"><div class="label">Assets</div><div class="value money">'+money(a.assets)+'</div></div><div class="card metric"><div class="label">Liabilities</div><div class="value money">'+money(a.liabilities)+'</div></div></div>','<button id="cancel" class="btn">Cancel</button><button id="saveSnapshot" class="btn primary">Save Snapshot</button>');$('cancel').onclick=close;$('saveSnapshot').onclick=async()=>{try{await api('CREATE_NET_WORTH_SNAPSHOT',{snapshotMonth:new Date().toISOString().slice(0,7)+'-01'});close();await load();S.page='worth';S.net='snapshots';render();toast('Snapshot saved')}catch(e){toast(e.message)}}};

  settings = function(){
    frame('<div class="mp-settings-page">'+securityBlock()+categoriesBlock()+'</div>');bindModernSettings();
  };
  function securityBlock(){return '<section class="mp-settings-section"><h2>Security</h2><div class="mp-security-line"><div class="mp-security-card"><div class="mp-security-field"><label>App Access PIN</label><div style="display:flex;gap:8px"><input class="control" value="'+(localStorage.mpPinHash?'••••':'Not configured')+'" readonly><button id="changePin" class="btn">'+(localStorage.mpPinHash?'Change':'Set PIN')+'</button></div></div></div><div class="mp-security-card"><div class="mp-security-field"><label>Auto-Lock Timer</label><select id="autoLock" class="control"><option value="0">Immediately</option><option value="30">30 seconds</option><option value="60">1 minute</option><option value="300">5 minutes</option><option value="-1">Manual only</option></select></div></div></div></section>'}
  function categoryRows(list,type){return '<div class="mp-settings-box"><h3>'+type.toUpperCase()+' CATEGORIES</h3>'+list.map((x,i)=>'<div class="mp-setting-row" data-name="'+safe(x.name)+'"><div class="mp-move"><button data-move="-1">⌃</button><button data-move="1">⌄</button></div><b>'+safe(x.name)+'</b><button class="mp-switch '+(x.active===true||String(x.active).toLowerCase()==='true'?'on':'')+'" data-toggle></button><button class="mp-row-menu" data-manage>Manage</button></div>').join('')+'<button class="mp-add" data-add="'+type+'">ADD '+type.toUpperCase()+' CATEGORY</button></div>'}
  function categoriesBlock(){const c=S.data.categories||[],income=c.filter(x=>x.type==='Income'),expense=c.filter(x=>['Expense','Investment'].includes(x.type));return '<section class="mp-settings-section"><h2>Categories</h2><div class="mp-settings-grid">'+categoryRows(income,'Income')+categoryRows(expense,'Expense')+'</div></section>'}
  function bindModernSettings(){
    $('changePin').onclick=pinSetup;$('autoLock').value=localStorage.mpLockDelay||'60';$('autoLock').onchange=e=>localStorage.mpLockDelay=e.target.value;
    document.querySelectorAll('[data-manage]').forEach(b=>b.onclick=()=>definitionForm(b.closest('[data-name]').dataset.name));
    document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>definitionForm(''));
    document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
    document.querySelectorAll('[data-move]').forEach(b=>b.onclick=async()=>{const row=b.closest('[data-name]'),box=row.parentElement,rows=[...box.querySelectorAll('[data-name]')],i=rows.indexOf(row),j=i+Number(b.dataset.move);if(j<0||j>=rows.length)return;box.insertBefore(row,b.dataset.move==='-1'?rows[j]:rows[j].nextSibling);try{await api('REORDER_CATEGORIES',{names:[...document.querySelectorAll('[data-name]')].map(x=>x.dataset.name)});toast('Category order saved')}catch(e){toast(e.message)}});
  }
})();
