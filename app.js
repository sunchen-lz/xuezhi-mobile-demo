const categories = ['全部案件', '诉讼仲裁', '非诉顾问', '劳动争议', '合同纠纷'];
const matters = [
  { id: 'M-2026-018', title: '远川科技诉宏达供应链合同纠纷', subtitle: '远川科技有限公司 · 2026-08-12 建案', category: '合同纠纷', type: '民事诉讼 · 合同纠纷', progress: 76, color: 'blue', docs: 18, todo: '审阅代理意见初稿' },
  { id: 'M-2026-015', title: '周某劳动争议仲裁案', subtitle: '周明远 · 2026-07-28 建案', category: '劳动争议', type: '劳动仲裁 · 劳动争议', progress: 48, color: 'gold', docs: 12, todo: '补充工资流水材料' },
  { id: 'M-2026-012', title: '澄海医疗常年法律顾问', subtitle: '澄海医疗集团 · 2026-07-04 建案', category: '非诉顾问', type: '常年顾问 · 非诉', progress: 64, color: 'green', docs: 26, todo: '审阅采购合同修订稿' },
  { id: 'M-2026-009', title: '林女士房屋买卖合同审查', subtitle: '林晓 · 2026-06-19 建案', category: '合同纠纷', type: '专项审查 · 合同纠纷', progress: 91, color: 'rose', docs: 9, todo: '确认审查意见定稿' },
  { id: 'M-2026-006', title: '新禾餐饮股权转让项目', subtitle: '新禾餐饮有限公司 · 2026-05-30 建案', category: '非诉顾问', type: '股权交易 · 非诉', progress: 32, color: 'blue', docs: 15, todo: '核对股权变更文件' },
];
const initialMaterials = [
  { name: '远川科技_采购合同.pdf', type: 'PDF', tag: '合同', state: '已识别', date: '10月20日', pages: '12页', kind: 'pdf' },
  { name: '对账单及付款记录.pdf', type: 'PDF', tag: '财务凭证', state: '待校对', date: '10月19日', pages: '6页', kind: 'pdf', pending: true },
  { name: '代理意见_初稿.docx', type: 'DOCX', tag: '法律文书', state: '修改中', date: '10月18日', pages: '4页', kind: 'doc' },
  { name: '证据目录.xlsx', type: 'XLSX', tag: '证据材料', state: '已识别', date: '10月17日', pages: '28项', kind: 'sheet' },
];
let currentPage = 'cases';
let currentFilter = '全部案件';
let currentMaterialFilter = '全部';
let selectedMatter = null;
let caseTab = '概览';
let materialItems = [...initialMaterials];
let fileImportTarget = 'materials';
let finalized = false;
let activeReviewStep = '阅读';
let docText = `<p>代理意见</p><p>审判长、审判员：</p><p>远川科技有限公司（以下简称“远川公司”）与宏达供应链有限公司买卖合同纠纷一案，现根据已提交的合同、对账单及付款凭证，发表如下代理意见。</p><p>一、双方买卖合同关系依法成立并生效。双方于 2025 年 3 月 18 日签订《年度采购框架协议》，约定由远川公司向宏达公司供应电子元件。<span class="citation" data-source="source">[证据 3，第 2 页]</span></p><p>二、宏达公司尚欠货款金额应以双方确认的对账单为准。现有材料显示，截至 2025 年 12 月 31 日，已交付货物价款合计为 1,280,000 元，已付款 860,000 元。<span class="citation" data-source="source">[证据 8，第 1 页]</span></p><p>三、关于逾期付款责任，建议结合合同约定及实际付款时间进一步核对。对账单中两笔付款的到账日期尚需与银行流水复核。</p><p>以上意见，敬请合议庭予以考虑。</p><p>此致<br>人民法院</p>`;

const root = document.getElementById('pageRoot');
const modalRoot = document.getElementById('modalRoot');
const iconClass = (i) => `case-mark ${i.color}`;
const matterById = id => matters.find(m => m.id === id);

function setPage(page) {
  currentPage = page;
  selectedMatter = null;
  render();
  document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
}

function stat(label, value, mark, color='') {
  return `<div class="overview-stat"><div><span>${label}</span><strong>${value}</strong></div><i class="stat-mark ${color}">${mark}</i></div>`;
}

function renderCases() {
  const filtered = currentFilter === '全部案件' ? matters : matters.filter(m => m.category === currentFilter || m.type.includes(currentFilter));
  root.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">案件管理</p><h1>案件</h1><p class="heading-sub">案件、材料与工作成果都在这里持续推进。</p></div>
      <div class="button-row"><button class="button" data-action="import"><span class="button-icon">＋</span>导入材料</button><button class="button primary" data-action="new-case"><span class="button-icon">＋</span>新建案件</button></div>
    </div>
    <section class="overview-strip" aria-label="案件概况">
      ${stat('办理中', '12', '▤', 'blue')}${stat('待审阅', '03', '✎', 'amber')}${stat('待校对材料', '05', '▧', 'red')}${stat('本月已归档', '08', '✓', '')}
    </section>
    <div class="content-grid">
      <section>
        <div class="section-head"><h2>我的案件</h2><small>共 ${filtered.length} 件</small></div>
        <div class="filter-row">${categories.map(c=>`<button class="filter-chip ${currentFilter===c?'selected':''}" data-filter="${c}">${c}</button>`).join('')}</div>
        <div class="case-list">${filtered.length ? filtered.map(m=>`<article class="case-row" data-case="${m.id}" tabindex="0" role="button" aria-label="打开案件 ${m.title}">
          <div class="case-title-wrap"><span class="${iconClass(m)}">${m.title.slice(0,1)}</span><span class="case-title-copy"><strong>${m.title}</strong><small>${m.id} · ${m.subtitle}</small></span></div>
          <span class="case-type">${m.type}</span><span class="case-progress"><small><span>办理进度</span><span>${m.progress}%</span></small><span class="progress-line"><i style="width:${m.progress}%"></i></span></span><span class="case-arrow">›</span>
        </article>`).join('') : '<div class="empty-state">这个分类下暂时没有案件</div>'}</div>
      </section>
      <aside class="side-column">
        <section class="side-section"><div class="section-head"><h2>待处理</h2><span class="status amber">3 项</span></div><div class="task-list">
          <div class="task-row" data-action="open-review"><i class="task-dot"></i><span class="task-copy"><strong>审阅「代理意见」初稿</strong><small>远川科技诉宏达供应链</small></span><small class="task-time">今天</small></div>
          <div class="task-row" data-action="open-materials"><i class="task-dot"></i><span class="task-copy"><strong>校对对账单 OCR 结果</strong><small>周某劳动争议仲裁案</small></span><small class="task-time">今天</small></div>
          <div class="task-row" data-action="open-review"><i class="task-dot green"></i><span class="task-copy"><strong>确认法律意见定稿</strong><small>林女士房屋买卖合同审查</small></span><small class="task-time">明天</small></div>
        </div><button class="view-all" data-page="review">查看全部审阅任务　→</button></section>
        <section class="side-section"><div class="section-head"><h2>最近材料</h2><small>最近更新</small></div>
          ${materialItems.slice(0,3).map(m=>`<div class="recent-material" data-material="${m.name}"><span class="file-badge ${m.kind==='doc'?'doc':m.kind==='sheet'?'sheet':''}">${m.type}</span><span class="recent-copy"><strong>${m.name}</strong><small>${m.date} · ${m.tag}</small></span></div>`).join('')}
          <button class="view-all" data-page="materials">进入材料库　→</button>
        </section>
      </aside>
    </div>`;
}

function renderMatter() {
  const m = selectedMatter;
  const tabs = ['概览','材料','工作成果','工作记录'];
  const tabBody = caseTab === '材料' ? renderMatterMaterials(m) : caseTab === '工作成果' ? renderArtifacts() : caseTab === '工作记录' ? renderTimeline() : renderMatterOverview(m);
  root.innerHTML = `<button class="back-link" data-action="back-cases">←　返回案件列表</button>
    <div class="page-heading" style="margin-top:15px"><div><p class="eyebrow">${m.id}　·　${m.category}</p><h1>${m.title}</h1><div class="case-meta-row"><span>◉ ${m.subtitle.split('·')[0]}</span><span>▤ ${m.type}</span><span class="status">办理中</span></div></div>
      <div class="button-row"><button class="button" data-action="import">＋ 添加材料</button><button class="button primary" data-action="open-review">✎ 继续办理</button></div>
    </div>
    <div class="case-tabs">${tabs.map(t=>`<button class="case-tab ${caseTab===t?'active':''}" data-case-tab="${t}">${t}${t==='材料'?` (${m.docs})`:''}</button>`).join('')}</div>
    ${tabBody}`;
}

function renderMatterOverview(m) {
  return `<div class="detail-summary"><div><small>案件状态</small><strong>办理中 · ${m.progress}%</strong></div><div><small>案件分类</small><strong>${m.category}</strong></div><div><small>材料 / 成果</small><strong>${m.docs} 件材料 · 3 项成果</strong></div></div>
    <div class="detail-columns"><section class="plain-panel"><h3>最近处理</h3><div class="timeline">
      <div class="timeline-item"><i></i><span>代理意见初稿已生成，等待阅读与修改<small>今天 10:42</small></span></div>
      <div class="timeline-item"><i></i><span>对账单 OCR 识别完成，2 项金额待人工校对<small>昨天 16:18</small></span></div>
      <div class="timeline-item"><i></i><span>新增采购合同及付款凭证 4 份<small>10月18日</small></span></div>
    </div></section><section class="plain-panel"><h3>归档分类</h3><div class="category-controls"><div><label class="category-label">业务类型</label><select class="category-select"><option>民事诉讼</option><option>仲裁</option><option>非诉顾问</option></select></div><div><label class="category-label">案由</label><select class="category-select"><option>${m.category}</option><option>买卖合同纠纷</option><option>劳动争议</option></select></div></div><p class="muted-text" style="margin:12px 0 0;line-height:1.7">分类可随时调整；材料未确认归属前保留在「待整理」。</p></section></div>
    <div style="margin-top:17px"><div class="section-head"><h2>待办事项</h2><button class="view-all" data-action="open-review">进入审阅　→</button></div><div class="task-list" style="background:#fff;border:1px solid var(--line);padding:0 13px"><div class="task-row" data-action="open-review"><i class="task-dot"></i><span class="task-copy"><strong>阅读并修改代理意见初稿</strong><small>成果版本 v1 · 2 项待核实</small></span><span class="status amber">待审阅</span></div><div class="task-row"><i class="task-dot green"></i><span class="task-copy"><strong>确认本案材料分类</strong><small>18 件材料，1 件尚未归类</small></span><span class="status neutral">进行中</span></div></div></div>`;
}

function renderMatterMaterials(m) {
  return `<div class="section-head"><h2>案件材料</h2><small>原件、识别文本与转换件保留版本关联</small></div>
    <div class="material-table-wrap"><table class="material-table"><thead><tr><th>材料名称</th><th>材料分类</th><th>识别 / 校对</th><th>更新日期</th><th></th></tr></thead><tbody>
    ${materialItems.map(item=>`<tr><td><span class="material-name" data-material="${item.name}"><span class="file-badge ${item.kind==='doc'?'doc':item.kind==='sheet'?'sheet':''}">${item.type}</span>${item.name}</span></td><td>${item.tag}</td><td><span class="status ${item.state==='待校对'?'amber':''}">${item.state}</span></td><td>${item.date}</td><td><button class="button quiet" data-action="open-material" data-name="${item.name}">查看</button></td></tr>`).join('')}
    </tbody></table></div>`;
}
function renderArtifacts(){return `<div class="section-head"><h2>工作成果</h2><small>成果类型与修订版本独立管理</small></div><div class="material-list-row"><span class="material-list-title"><span class="file-badge doc">DOCX</span><span><strong>代理意见_初稿.docx</strong><small>v1 · 关联 6 条证据 · 今天 10:42</small></span></span><span class="muted-text">法律文书</span><span class="status amber">待审阅</span><button class="button" data-action="open-review">审阅</button></div><div class="material-list-row"><span class="material-list-title"><span class="file-badge sheet">XLSX</span><span><strong>货款核算明细.xlsx</strong><small>v2 · 人工确认字段后生成 · 10月19日</small></span></span><span class="muted-text">核算成果</span><span class="status">已确认</span><button class="button">查看</button></div>`}
function renderTimeline(){return `<div class="plain-panel"><h3>案件活动</h3><div class="timeline"><div class="timeline-item"><i></i><span>代理意见初稿创建<small>今天 10:42 · 版本 v1</small></span></div><div class="timeline-item"><i></i><span>对账单 OCR 任务完成<small>昨天 16:18 · 6 页，2 项待校对</small></span></div><div class="timeline-item"><i></i><span>添加材料：采购合同及付款凭证<small>10月18日 14:02</small></span></div><div class="timeline-item"><i></i><span>创建案件并设置分类<small>8月12日 09:30</small></span></div></div></div>`}

function renderReview() {
  const stepLabels = ['阅读','思考','修改','定稿'];
  const notes = localStorage.getItem('xuezhi-demo-notes') || '核对两笔付款的到账日期；逾期利息计算口径需要补充合同依据。';
  root.innerHTML = `<div class="page-heading"><div><p class="eyebrow">工作成果　/　${selectedMatter?.id || 'M-2026-018'}</p><h1>审阅与定稿</h1><p class="heading-sub">每次修改形成新版本；AI 建议需逐项审阅，只有你能确认定稿。</p></div><div class="button-row"><button class="button" data-action="save-draft">保存草稿</button><button class="button primary" data-action="finalize">${finalized?'查看定稿记录':'确认定稿'}</button></div></div>
    <div class="review-warning"><span>!</span><span>有 2 项待核实内容。引用定位仅说明来源可追溯，不代表结论已被证实；请对照原件确认后再定稿。</span></div>
    <div class="review-layout">
      <section class="review-panel source-panel"><div class="panel-heading"><strong>原件对照</strong><span class="status neutral">采购合同.pdf</span></div><div class="panel-body"><div class="source-preview"><h4>年度采购框架协议</h4><p>甲方：远川科技有限公司</p><p>乙方：宏达供应链有限公司</p><p>第一条　采购产品与价款</p><p>双方按照本协议及每月订单开展电子元件采购业务。</p><p>第四条　结算方式</p><p>乙方应于收到甲方对账单后五个工作日内完成核对，逾期未提出书面异议的，视为确认对账金额。</p><p>第五条　付款期限</p><p>甲方应在收到发票后 <span class="source-highlight">三十日内支付相应货款</span>。</p><p>第六条　违约责任</p><p>逾期付款责任及计算方式，以双方另行确认的条款为准。</p><div class="source-page"><span>原始扫描件 · 第 2 页</span><span>SHA-256 已记录</span></div></div><div class="source-controls"><button class="small-control" data-action="prev-page">‹ 上一页</button><span>第 2 / 12 页</span><button class="small-control" data-action="next-page">下一页 ›</button></div></div></section>
      <section class="review-panel draft-panel"><div class="panel-heading"><strong>代理意见　·　${finalized?'已定稿':'修改中'}</strong><span class="status ${finalized?'':'amber'}">${finalized?'定稿 v2':'草稿 v2'}</span></div><div class="stepper">${stepLabels.map((s,i)=>`<button class="step-button ${activeReviewStep===s?'active':''}" data-step="${s}">${s}</button>`).join('')}</div><div class="panel-body"><div class="draft-title">远川科技诉宏达供应链合同纠纷代理意见</div><div class="draft-meta"><span>版本 v2</span><span>·</span><span>基于 v1 修改</span><span>·</span><span>3 个来源锚点</span><span class="toolbar-divider"></span><span id="saveState">${finalized?'已定稿':'自动保存已开启'}</span></div><div id="draftContent" class="draft-content" contenteditable="${finalized?'false':'true'}" spellcheck="false">${docText}</div><div class="draft-footer"><small>正文修改将保存为新修订，旧定稿不会被覆盖。</small><button class="button" data-action="save-draft">保存修改</button></div></div></section>
      <section class="review-panel thinking-panel"><div class="panel-heading"><strong>思考与修改建议</strong><button class="icon-button" title="更多选项" aria-label="更多选项">···</button></div><div class="panel-body"><div class="thinking-prompt">把你的判断与待核实问题记在这里。笔记与正文分开保存。</div><div class="prompt-row"><button class="prompt-chip" data-note="这段结论的合同依据是否充分？">依据是否充分</button><button class="prompt-chip" data-note="请检查是否存在前后金额不一致。">检查金额一致</button></div><textarea id="thinkingNotes" class="notes-area" placeholder="记录思考、待核实问题或下一步...">${escapeHtml(notes)}</textarea><button class="view-all" data-action="save-notes">保存思考笔记</button>
        <div class="suggestion"><strong>待审建议 · 付款日期</strong>现有材料未能确认两笔付款的实际到账日，建议在确定逾期期间前补充银行流水。<br><span class="citation" data-source="source">依据：合同第 5 条 · 第 2 页</span><div class="suggestion-actions"><button data-action="accept-suggestion">采纳并插入</button><button data-action="dismiss-suggestion">暂不采纳</button></div></div>
        <div class="suggestion" style="border-color:#6da89d;background:#f0f8f6"><strong style="color:#348278">可追溯来源</strong>已关联 3 个材料锚点。选择正文中的来源标记可回看对应原件位置。</div>
      </div></section>
    </div>`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderMaterials() {
  const visibleMaterials = materialItems.filter(m => currentMaterialFilter === '全部'
    || (currentMaterialFilter === '待整理' && m.tag === '待分类')
    || (currentMaterialFilter === '待校对' && m.state === '待校对')
    || (currentMaterialFilter === '已转换' && m.converted));
  root.innerHTML = `<div class="page-heading"><div><p class="eyebrow">材料管理</p><h1>材料</h1><p class="heading-sub">原件、OCR 识别结果和转换文档保持来源与版本关联。</p></div><div class="button-row"><button class="button" data-action="scan">▣ 扫描</button><button class="button primary" data-action="import"><span class="button-icon">＋</span>导入材料</button></div></div>
    <section class="drop-zone" id="dropZone" data-action="import"><div><span class="upload-icon">⇧</span><strong>拖入文件，或从设备选择</strong><small>PDF、Word、Excel、JPG、PNG　·　原件将作为独立版本保留</small></div></section>
    <div class="content-grid"><section><div class="section-head"><h2>全部材料</h2><small>${materialItems.length} 项 · OCR 结果需人工校对</small></div>
      <div class="filter-row">${['全部','待整理','待校对','已转换'].map(f=>`<button class="filter-chip ${currentMaterialFilter===f?'selected':''}" data-material-filter="${f}">${f}</button>`).join('')}</div>
      ${visibleMaterials.length ? visibleMaterials.map(m=>`<div class="material-list-row"><span class="material-list-title" data-material="${m.name}"><span class="file-badge ${m.kind==='doc'?'doc':m.kind==='sheet'?'sheet':''}">${m.type}</span><span><strong>${m.name}</strong><small>${m.date} · ${m.pages}</small></span></span><span class="muted-text">${m.tag}</span><span class="status ${m.state==='待校对'?'amber':''}">${m.state}</span><span class="row-actions"><button class="button" data-action="open-material" data-name="${m.name}">打开</button></span></div>`).join('') : '<div class="empty-state">当前筛选下没有材料</div>'}
    </section><aside class="side-column"><section class="side-section"><div class="section-head"><h2>处理说明</h2></div><p class="thinking-prompt">OCR 与格式转换会生成新版本，不覆盖原件。姓名、日期、金额、否定词及表格关键项需对照原图复核。</p><button class="button" style="width:100%;margin-top:8px" data-action="convert">将选中识别件转为 DOCX</button></section><section class="side-section"><div class="section-head"><h2>待整理</h2><span class="status amber">2 件</span></div><p class="thinking-prompt">未确认案件归属的材料不会自动进入案件分析范围。</p></section></aside></div>`;
}

function renderHome() {
  root.innerHTML = `<div class="page-heading"><div><p class="eyebrow">工作台</p><h1>上午好，陈律师</h1><p class="heading-sub">今天有 3 项待处理工作，继续上次的案件进度。</p></div><div class="button-row"><button class="button primary" data-action="new-case">＋ 新建案件</button></div></div>
    <section class="overview-strip">${stat('办理中案件','12','▤','blue')}${stat('待审阅成果','03','✎','amber')}${stat('待校对材料','05','▧','red')}${stat('本月归档','08','✓','')}</section>
    <div class="section-head"><h2>继续办理</h2><button class="view-all" data-page="cases">全部案件　→</button></div><div class="content-grid"><section class="case-list">${matters.slice(0,3).map(m=>`<article class="case-row" data-case="${m.id}" role="button" tabindex="0"><div class="case-title-wrap"><span class="${iconClass(m)}">${m.title.slice(0,1)}</span><span class="case-title-copy"><strong>${m.title}</strong><small>${m.todo} · ${m.id}</small></span></div><span class="case-type">${m.category}</span><span class="case-progress"><small><span>办理进度</span><span>${m.progress}%</span></small><span class="progress-line"><i style="width:${m.progress}%"></i></span></span><span class="case-arrow">›</span></article>`).join('')}</section><aside class="side-column"><section class="side-section"><div class="section-head"><h2>最近任务</h2></div><div class="task-list"><div class="task-row" data-action="open-review"><i class="task-dot"></i><span class="task-copy"><strong>阅读并修改代理意见初稿</strong><small>远川科技诉宏达供应链</small></span><small class="task-time">今天</small></div><div class="task-row" data-action="open-materials"><i class="task-dot"></i><span class="task-copy"><strong>校对对账单 OCR 结果</strong><small>周某劳动争议仲裁案</small></span><small class="task-time">今天</small></div></div></section></aside></div>`;
}

function renderArchive(){root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">档案管理</p><h1>归档</h1><p class="heading-sub">按案件生成不可变的工作归档快照；律所正式归档以接收回执为准。</p></div><div class="button-row"><button class="button primary" data-action="archive">＋ 创建归档快照</button></div></div><section class="overview-strip">${stat('本月已归档','08','✓','')}${stat('待生成快照','02','▣','amber')}${stat('已交接律所','03','↗','blue')}${stat('待接收回执','01','…','red')}</section><div class="section-head"><h2>最近归档</h2></div><div class="material-table-wrap"><table class="material-table"><thead><tr><th>归档名称</th><th>案件</th><th>版本</th><th>状态</th><th>时间</th></tr></thead><tbody><tr><td>阶段归档_证据交换材料</td><td>远川科技诉宏达供应链</td><td>快照 A · 8 项</td><td><span class="status">已归档</span></td><td>10月20日</td></tr><tr><td>结案归档_法律意见书</td><td>林女士房屋买卖合同审查</td><td>快照 B · 5 项</td><td><span class="status amber">待接收回执</span></td><td>10月18日</td></tr></tbody></table></div>`}
function renderProfile(){root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">个人空间</p><h1>我的</h1><p class="heading-sub">账号、设备与工作空间设置。</p></div></div><div class="plain-panel" style="max-width:580px"><div class="case-title-wrap"><span class="avatar" style="width:44px;height:44px">陈</span><span class="case-title-copy"><strong>陈律师</strong><small>个人工作空间 · 授权有效</small></span></div><hr style="border:0;border-top:1px solid var(--line);margin:18px 0"><div class="timeline"><div class="timeline-item"><i></i><span>当前设备<small>此 Demo 仅展示界面状态</small></span></div><div class="timeline-item"><i></i><span>数据同步<small>演示数据保存在当前页面内存</small></span></div><div class="timeline-item"><i></i><span>隐私与安全<small>真实案件数据不应放入 Demo</small></span></div></div></div>`}

function render() {
  document.getElementById('crumbCurrent').textContent = ({home:'工作台',cases:'案件',materials:'材料',review:'审阅与定稿',archive:'归档',profile:'我的'})[currentPage] || '案件';
  if (selectedMatter && currentPage === 'cases') renderMatter();
  else if (currentPage === 'cases') renderCases();
  else if (currentPage === 'home') renderHome();
  else if (currentPage === 'materials') renderMaterials();
  else if (currentPage === 'review') renderReview();
  else if (currentPage === 'archive') renderArchive();
  else renderProfile();
  document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === currentPage));
}

function toast(message) {
  const el = document.createElement('div'); el.className='toast'; el.textContent=message;
  document.getElementById('toastRoot').append(el); setTimeout(()=>el.remove(), 2400);
}
function openModal(title, body, onSubmit, submitText='确认') {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-head"><h2>${title}</h2><button class="close-button" data-close-modal aria-label="关闭">×</button></div><form id="modalForm"><div class="modal-body">${body}</div><div class="modal-foot"><button class="button" type="button" data-close-modal>取消</button><button class="button primary" type="submit">${submitText}</button></div></form></section></div>`;
  modalRoot.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',e=>{if(b.classList.contains('modal-backdrop')){if(e.target===b)modalRoot.innerHTML='';}else modalRoot.innerHTML='';}));
  modalRoot.querySelector('.close-button').addEventListener('click',()=>modalRoot.innerHTML='');
  modalRoot.querySelector('#modalForm').addEventListener('submit',e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget).entries()); onSubmit(data); modalRoot.innerHTML='';});
  modalRoot.querySelector('input,select')?.focus();
}

function startImport(target='materials') { fileImportTarget=target; document.getElementById('fileInput').click(); }
document.getElementById('fileInput').addEventListener('change',e=>{
  const files=[...e.target.files]; if(!files.length)return;
  files.forEach((f,i)=>{const ext=f.name.split('.').pop().toLowerCase(); const kind=['doc','docx'].includes(ext)?'doc':['xls','xlsx'].includes(ext)?'sheet':'pdf'; materialItems.unshift({name:f.name,type:ext.toUpperCase(),tag:'待分类',state:'待处理',date:'刚刚',pages:'待识别',kind,pending:true});});
  render(); toast(`已导入 ${files.length} 个文件，原件已保留。OCR 任务为演示模拟。`); e.target.value='';
  setTimeout(()=>{materialItems=materialItems.map(m=>m.date==='刚刚'?{...m,state:'待校对',pages:m.type==='PDF'?'已解析':'待转换'}:m); if(currentPage==='materials')render();},1200);
});

function finalizeModal(){openModal('确认定稿',`<p class="thinking-prompt" style="margin:0">即将确认 <strong>代理意见 v2</strong> 为定稿。后续修改会创建新版本，当前定稿记录将保留。</p><label style="display:flex;gap:8px;align-items:flex-start;color:#607580;font-size:9px;line-height:1.6"><input type="checkbox" name="reviewed" required style="margin-top:2px">我已阅读正文，并检查引用来源及标记的待核实事项。</label><div class="review-warning" style="margin:0">仍有 2 项待核实提示。确认定稿表示我已作出审阅决定，不代表系统保证事实或法律结论绝对正确。</div>`,()=>{finalized=true;activeReviewStep='定稿';render();toast('已记录定稿版本 v2');},'确认并定稿')}
function newCaseModal(){openModal('新建案件',`<div class="field"><label>案件名称</label><input name="title" required placeholder="例如：某某合同纠纷案"></div><div class="field"><label>当事人 / 委托方</label><input name="client" required placeholder="输入个人或组织名称"></div><div class="field"><label>案件分类</label><select name="category"><option>合同纠纷</option><option>劳动争议</option><option>诉讼仲裁</option><option>非诉顾问</option></select></div><div class="field"><label>办理阶段</label><select name="stage"><option>办理中</option><option>待立案</option><option>准备材料</option></select></div>`,d=>{const m={id:`M-2026-${String(matters.length+1).padStart(3,'0')}`,title:d.title,subtitle:`${d.client} · 今天建案`,category:d.category,type:d.category,progress:0,color:'green',docs:0,todo:'待补充材料'};matters.unshift(m);setPage('cases');toast('案件已创建（本地演示数据）');},'创建案件')}

root.addEventListener('click',e=>{
  const notePrompt=e.target.closest('[data-note]'); if(notePrompt){const area=document.getElementById('thinkingNotes');if(area){area.value=(area.value?area.value+'\n':'')+notePrompt.dataset.note;area.focus();}return;}
  const materialFilter=e.target.closest('[data-material-filter]'); if(materialFilter){currentMaterialFilter=materialFilter.dataset.materialFilter;render();return;}
  const page=e.target.closest('[data-page]'); if(page){setPage(page.dataset.page);return;}
  const filter=e.target.closest('[data-filter]'); if(filter){currentFilter=filter.dataset.filter;render();return;}
  const tab=e.target.closest('[data-case-tab]'); if(tab){caseTab=tab.dataset.caseTab;render();return;}
  const step=e.target.closest('[data-step]'); if(step){activeReviewStep=step.dataset.step;render();return;}
  const caseRow=e.target.closest('[data-case]'); if(caseRow){selectedMatter=matterById(caseRow.dataset.case);caseTab='概览';currentPage='cases';render();return;}
  const material=e.target.closest('[data-material]'); if(material){openMaterial(material.dataset.material);return;}
  const source=e.target.closest('[data-source]'); if(source){document.querySelector('.source-panel')?.scrollIntoView({behavior:'smooth',block:'center'});toast('已定位到原件第 2 页（演示锚点）');return;}
  const action=e.target.closest('[data-action]')?.dataset.action; if(!action)return;
  if(action==='new-case')newCaseModal();
  else if(action==='import'||action==='scan')startImport(currentPage==='cases'?'case':'materials');
  else if(action==='back-cases'){selectedMatter=null;render();}
  else if(action==='open-review'){currentPage='review';render();}
  else if(action==='open-materials'){currentPage='materials';render();}
  else if(action==='open-material')openMaterial(e.target.closest('[data-name]')?.dataset.name);
  else if(action==='save-draft'){const c=document.getElementById('draftContent');if(c)docText=c.innerHTML;const s=document.getElementById('saveState');if(s)s.textContent='刚刚已保存';toast('修改已保存为新修订 v2');}
  else if(action==='save-notes'){const n=document.getElementById('thinkingNotes');if(n)localStorage.setItem('xuezhi-demo-notes',n.value);toast('思考笔记已保存');}
  else if(action==='finalize'){if(finalized){toast('当前版本 v2 已定稿；后续修改将创建新版本');}else finalizeModal();}
  else if(action==='accept-suggestion'){const c=document.getElementById('draftContent');if(c&&!finalized){c.insertAdjacentHTML('beforeend','<p>关于逾期付款期间及责任承担，尚需结合银行流水核实实际到账日后，再根据合同约定确定。<span class="citation" data-source="source">[待核实]</span></p>');docText=c.innerHTML;toast('建议已插入正文，请继续审阅');}else toast('请先重新开启修订');}
  else if(action==='dismiss-suggestion'){e.target.closest('.suggestion')?.remove();toast('建议已标记为暂不采纳');}
  else if(action==='convert'){if(materialItems.some(x=>x.pending)){const item=materialItems.find(x=>x.pending);item.state='已转换';item.type='DOCX';item.kind='doc';item.converted=true;item.name=item.name.replace(/\.[^.]+$/,'.docx');item.pending=false;render();toast('已生成转换件演示版本，原件保留');}else toast('先导入或选择一份待处理材料');}
  else if(action==='archive'){toast('归档快照已生成（本地演示），不代表律所正式接收');}
  else if(action==='prev-page'||action==='next-page'){toast('原件页码定位为交互演示');}
});
root.addEventListener('keydown',e=>{const row=e.target.closest('[data-case]');if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();row.click();}});

document.querySelectorAll('.nav-item,.bottom-nav button').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
document.querySelectorAll('[data-note]').forEach(b=>b.addEventListener('click',()=>{const area=document.getElementById('thinkingNotes');if(area){area.value=(area.value?area.value+'\n':'')+b.dataset.note;area.focus();}}));
document.getElementById('profileButton').addEventListener('click',()=>setPage('profile'));
document.getElementById('searchTrigger').addEventListener('click',()=>searchDialog());
document.getElementById('mobileSearch').addEventListener('click',()=>searchDialog());
function searchDialog(){openModal('搜索案件与材料',`<div class="field"><label>关键词</label><input name="query" placeholder="案件名称、当事人或材料名"></div>`,d=>{const q=d.query.trim();if(!q){toast('请输入搜索关键词');return;}const found=matters.find(m=>m.title.includes(q)||m.id.includes(q))||materialItems.find(m=>m.name.includes(q));if(found?.id){selectedMatter=found;currentPage='cases';render();}else if(found?.name){currentPage='materials';render();}else toast('没有找到匹配内容');},'搜索')}
function openMaterial(name){openModal(name||'材料预览',`<div class="review-warning"><span>!</span><span>这是演示材料预览。原件与 OCR 文本在正式产品中会保留为不同版本。</span></div><div class="plain-panel"><h3>识别文本片段</h3><p class="thinking-prompt" style="line-height:1.9">双方确认，截至 2025 年 12 月 31 日，已交付货物价款合计为 <mark>1,280,000 元</mark>，已付款 860,000 元。<br><br>自动识别金额与日期请对照原件校对。<br><br><span class="citation">来源：第 1 页 · 第 3 段</span></p></div><div class="field"><label>材料分类</label><select><option>财务凭证</option><option>合同</option><option>证据材料</option><option>法律文书</option></select></div>`,()=>toast('材料分类已更新（演示）'),'保存分类')}

const drop=document.getElementById('dropZone');
['dragenter','dragover'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest('#dropZone')){e.preventDefault();drop.classList.add('dragover');}}));
['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest('#dropZone'))drop.classList.remove('dragover');}));
document.addEventListener('drop',e=>{if(e.target.closest('#dropZone')){e.preventDefault();const files=[...e.dataTransfer.files];if(!files.length)return;files.forEach(f=>materialItems.unshift({name:f.name,type:f.name.split('.').pop().toUpperCase(),tag:'待分类',state:'待校对',date:'刚刚',pages:'待识别',kind:'pdf',pending:true}));render();toast(`已添加 ${files.length} 个文件（OCR 演示模拟）`);}});
render();
