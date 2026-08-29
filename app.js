(function () {
  'use strict';

  var AI = window.OrdinaryMuseumAI;
  var app = document.getElementById('app');
  var photoInput = document.getElementById('photoInput');
  var state = {
    route: 'home',
    original: null,
    selectedStyle: 'film',
    generated: null,
    compareMode: 'art',
    gallery: []
  };

  var DB_NAME = 'ordinary-museum-db';
  var STORE = 'artworks';

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) return resolve(null);
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
    });
  }

  function dbGetAll() {
    return openDB().then(function (db) {
      if (!db) {
        try { return JSON.parse(localStorage.getItem('olm_gallery_v2') || '[]'); }
        catch (e) { return []; }
      }
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).getAll();
        req.onsuccess = function () { resolve((req.result || []).sort(function(a,b){return b.id-a.id;})); };
        req.onerror = function () { resolve([]); };
      });
    });
  }

  function dbPut(item) {
    return openDB().then(function (db) {
      if (!db) {
        try {
          var list = JSON.parse(localStorage.getItem('olm_gallery_v2') || '[]');
          list.unshift(item);
          localStorage.setItem('olm_gallery_v2', JSON.stringify(list.slice(0, 12)));
        } catch (e) {}
        return;
      }
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(item);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    });
  }

  function dbClear() {
    return openDB().then(function (db) {
      if (!db) { localStorage.removeItem('olm_gallery_v2'); return; }
      return new Promise(function(resolve){
        var tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=resolve;
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>'"]/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c];
    });
  }

  function today() {
    try { return new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()).replace(/\//g,'.'); }
    catch (e) { return new Date().toLocaleDateString(); }
  }

  function exhibitNo(id) {
    var n = String(id % 1000000).padStart(6, '0');
    return 'No.' + n;
  }

  function toast(message) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function(){el.classList.add('show');});
    setTimeout(function(){el.classList.remove('show'); setTimeout(function(){el.remove();},220);},1800);
  }

  function navHtml(active) {
    return '<nav class="bottom-nav" aria-label="主导航">' +
      '<button data-nav="home" class="'+(active==='home'?'active':'')+'"><span>⌂</span><small>首页</small></button>' +
      '<button data-nav="gallery" class="'+(active==='gallery'?'active':'')+'"><span>▦</span><small>我的美术馆</small></button>' +
      '<button data-nav="notes" class="'+(active==='notes'?'active':'')+'"><span>✎</span><small>策展人手记</small></button>' +
      '</nav>';
  }

  function backButton() {
    return '<button class="icon-btn" data-action="back" aria-label="返回">←</button>';
  }

  function menuButton() {
    return '<button class="icon-btn" data-action="menu" aria-label="菜单">☰</button>';
  }

  function homeScreen() {
    return '<main class="screen">' +
      '<header class="topbar"><div class="brand-mark"><strong>普通生活美术馆</strong><span>ORDINARY LIFE MUSEUM</span></div>' + menuButton() + '</header>' +
      '<section class="hero-copy"><div class="eyebrow">CURATE THE EVERYDAY · 日常策展计划</div>' +
      '<h1 class="hero-title">把普通日子<br>挂进<em>美术馆。</em></h1>' +
      '<p class="hero-sub">同一个瞬间，换一种观看方式。拍下一张你原本可能会忘记的照片，我们把它重新挂起来。</p>' +
      '<div class="doodle-row"><span>✦</span><span>⌁</span><span>✿</span></div></section>' +
      '<section class="polaroid" aria-label="今日作品示意"><div class="hero-art"><div class="tram"></div><div class="rail"></div></div>' +
      '<div class="polaroid-caption"><strong>今日作品</strong><small>No.000128 ♡</small></div></section>' +
      '<button class="primary-btn" data-action="start">开始布展 →</button>' +
      '<p class="hand-note">点击开始，把你的生活挂进美术馆吧！</p>' +
      '</main>' + navHtml('home');
  }

  function uploadScreen() {
    return '<main class="screen">' +
      '<header class="topbar">' + backButton() + '<div class="eyebrow">NEW EXHIBITION</div><span style="width:42px"></span></header>' +
      '<h1 class="screen-title">选择一个<br>普通瞬间</h1>' +
      '<p class="screen-sub">先选一张照片。这个原型默认只在你的浏览器本地处理，不会主动上传到服务器。</p>' +
      '<section class="upload-zone">' +
      '<div><div class="camera"></div><strong>拍一张，或者选一张</strong><p>通勤、晚饭、窗边、下雨、回家的路……<br>越普通，越适合被重新看见。</p><button class="paper-btn" data-action="pick-photo">选择照片</button></div>' +
      '</section></main>' + navHtml('home');
  }

  function styleScreen() {
    var cards = AI.styles.map(function (s) {
      return '<button class="style-card '+(state.selectedStyle===s.id?'selected':'')+'" data-style="'+s.id+'" data-tone="'+s.tone+'">' +
        '<img class="style-thumb" src="'+state.original+'" alt="'+escapeHtml(s.name)+'预览" style="filter:'+previewFilter(s.id)+'">' +
        '<h3>'+escapeHtml(s.name)+'</h3><span class="en">'+escapeHtml(s.en)+'</span><p>'+escapeHtml(s.desc)+'</p></button>';
    }).join('');
    return '<main class="screen">' +
      '<header class="topbar">'+backButton()+'<div class="eyebrow">WAYS OF SEEING</div><span style="width:42px"></span></header>' +
      '<h1 class="screen-title">选择一种<br>观看方式</h1><p class="screen-sub">不是给照片套滤镜，而是给同一个瞬间换一副观看的眼睛。</p>' +
      '<div class="preview-strip"><img src="'+state.original+'" alt="原始照片"><div><strong>原始瞬间</strong><small>已准备好 · 选择一种展厅风格</small></div></div>' +
      '<section class="style-grid">'+cards+'</section>' +
      '<div class="sticky-actions"><button class="primary-btn" style="margin:0" data-action="generate">开始布展 →</button></div>' +
      '</main>' + navHtml('home');
  }

  function previewFilter(id) {
    return ({
      oil:'saturate(1.15) contrast(1.08) sepia(.12)',
      film:'saturate(.82) contrast(.88) sepia(.1) brightness(1.05)',
      dream:'saturate(1.2) contrast(.86) brightness(1.08) blur(.3px)',
      watercolor:'saturate(.86) contrast(.82) brightness(1.12)',
      print:'grayscale(.75) sepia(.45) contrast(1.25)',
      editorial:'saturate(.86) contrast(1.08) brightness(1.03)'
    })[id] || '';
  }

  function loadingScreen() {
    return '<main class="screen"><section class="loading-wrap">' +
      '<div class="loading-polaroid"><img src="'+state.original+'" alt="正在布展的照片"></div>' +
      '<h1 class="loading-title">正在布展……</h1>' +
      '<div class="loading-note">你的普通生活，<br>正在被重新挂进美术馆。 ♡</div>' +
      '<div class="progress-shell"><div id="progressBar" class="progress-bar"></div></div>' +
      '<div id="progressLabel" class="progress-label">正在整理光线 · 0%</div>' +
      '</section></main>';
  }

  function resultScreen() {
    var item = state.generated;
    if (!item) return homeScreen();
    var visible = state.compareMode === 'original' ? item.original : item.image;
    return '<main class="screen">' +
      '<header class="topbar">'+backButton()+'<div class="eyebrow">TODAY\'S EXHIBIT</div>'+menuButton()+'</header>' +
      '<section class="result-frame"><img id="resultImage" src="'+visible+'" alt="生成作品"><div class="exhibit-tag">'+escapeHtml(item.no)+'<br>'+escapeHtml(item.date)+'</div></section>' +
      '<div class="compare-toggle"><button data-compare="art" class="'+(state.compareMode==='art'?'active':'')+'">作品</button><button data-compare="original" class="'+(state.compareMode==='original'?'active':'')+'">原片</button></div>' +
      '<section class="result-meta"><h1>'+escapeHtml(item.style.name)+'</h1><div class="en">'+escapeHtml(item.style.en)+'</div></section>' +
      '<section class="curator-card"><h3>策展人手记</h3><p>'+escapeHtml(item.note)+'</p></section>' +
      '<section class="action-grid">' +
      '<button class="action-card" data-action="save"><span>⇩</span><strong>保存作品</strong></button>' +
      '<button class="action-card" data-action="again"><span>↻</span><strong>再做一幅</strong></button>' +
      '<button class="action-card" data-action="share"><span>↗</span><strong>分享展签</strong></button>' +
      '</section></main>' + navHtml('gallery');
  }

  function galleryScreen() {
    var content;
    if (!state.gallery.length) {
      content = '<section class="empty-state"><div><div class="big">▧</div><h3>展厅还是空的</h3><p>从第一张普通照片开始。<br>日常不需要特别，才值得收藏。</p><button class="primary-btn small" data-action="start">开始新布展</button></div></section>';
    } else {
      content = '<section class="gallery-grid">' + state.gallery.map(function (x) {
        return '<button class="gallery-item" data-open-art="'+x.id+'"><img src="'+x.image+'" alt="'+escapeHtml(x.style.name)+'"><strong>'+escapeHtml(x.style.name)+' · '+escapeHtml(x.no)+'</strong><small>'+escapeHtml(x.date)+'</small></button>';
      }).join('') + '</section><button class="primary-btn" data-action="start">＋ 开始新布展</button>';
    }
    return '<main class="screen"><header class="topbar"><div class="brand-mark"><strong>我的美术馆</strong><span>MY ORDINARY MUSEUM</span></div>'+menuButton()+'</header>' +
      '<section class="gallery-head"><h1>我的美术馆 ✿</h1><p>共 '+state.gallery.length+' 件作品 · 每一件都来自真实生活</p></section>' + content + '</main>' + navHtml('gallery');
  }

  function notesScreen() {
    var generatedNotes = state.gallery.slice(0, 3).map(function (x, i) {
      var cls = ['yellow','pink','green'][i%3];
      return '<article class="note-card '+cls+'"><small>'+escapeHtml(x.date)+' · '+escapeHtml(x.no)+'</small><p>'+escapeHtml(x.note)+'</p></article>';
    }).join('');
    var defaults = '';
    if (!generatedNotes) {
      defaults = '<article class="note-card yellow"><small>今天</small><p>我们总是急着把日子过完，却忘了，那些普通瞬间，才是真正的生活。</p></article>' +
      '<article class="note-card pink"><small>给下一张照片</small><p>同一个地点，不同的光线，不同的心情，就能变成不一样的作品。</p></article>' +
      '<article class="note-card green"><small>馆内提醒</small><p>生活没有标准答案，但它值得被认真看见。</p></article>';
    }
    return '<main class="screen"><header class="topbar">'+backButton()+'<div class="eyebrow">CURATOR NOTES</div><span style="width:42px"></span></header>' +
      '<h1 class="screen-title">策展人手记 ✎</h1><p class="screen-sub">不是评价照片好不好，而是记录这一刻为什么值得被看见。</p>' +
      '<section class="notebook">'+(generatedNotes || defaults)+'</section></main>' + navHtml('notes');
  }

  function menuSheet() {
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = '<section class="sheet"><div class="sheet-handle"></div><h2>美术馆菜单</h2><div class="menu-list">' +
      '<button data-sheet="about"><strong>关于这个原型</strong><br><small>本地运行 · 无需 API Key</small></button>' +
      '<button data-sheet="prompts"><strong>查看当前 AI Prompt 结构</strong><br><small>为之后接真实图生图接口预留</small></button>' +
      '<button class="danger" data-sheet="clear"><strong>清空本地美术馆</strong><br><small>删除当前浏览器里的作品</small></button>' +
      '<button data-sheet="close"><strong>关闭</strong></button></div></section>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){ if(e.target===wrap) wrap.remove(); });
    wrap.querySelectorAll('[data-sheet]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var a=btn.getAttribute('data-sheet');
        if(a==='close') return wrap.remove();
        if(a==='about'){ toast('当前是可直接运行的本地 Web MVP'); return; }
        if(a==='prompts'){
          var p=AI.styles.map(function(s){return s.name+'：'+s.prompt;}).join('\n\n');
          if(navigator.clipboard) navigator.clipboard.writeText(p).then(function(){toast('六套 Prompt 已复制');});
          else toast('当前浏览器不支持一键复制');
          return;
        }
        if(a==='clear'){
          dbClear().then(function(){state.gallery=[];wrap.remove();render('gallery');toast('本地美术馆已清空');});
        }
      });
    });
  }

  function render(route) {
    state.route = route || state.route;
    window.scrollTo(0,0);
    if (state.route === 'home') app.innerHTML = homeScreen();
    if (state.route === 'upload') app.innerHTML = uploadScreen();
    if (state.route === 'styles') app.innerHTML = styleScreen();
    if (state.route === 'loading') app.innerHTML = loadingScreen();
    if (state.route === 'result') app.innerHTML = resultScreen();
    if (state.route === 'gallery') app.innerHTML = galleryScreen();
    if (state.route === 'notes') app.innerHTML = notesScreen();
    bind();
  }

  function bind() {
    app.querySelectorAll('[data-nav]').forEach(function (el) {
      el.onclick = function () { render(el.getAttribute('data-nav')); };
    });
    app.querySelectorAll('[data-action]').forEach(function (el) {
      el.onclick = function () {
        var a = el.getAttribute('data-action');
        if (a === 'start') { state.original=null; state.generated=null; render('upload'); }
        if (a === 'back') { goBack(); }
        if (a === 'menu') menuSheet();
        if (a === 'pick-photo') photoInput.click();
        if (a === 'generate') generate();
        if (a === 'again') { state.generated=null; state.compareMode='art'; render('styles'); }
        if (a === 'save') downloadCurrent();
        if (a === 'share') shareCurrent();
      };
    });
    app.querySelectorAll('[data-style]').forEach(function (el) {
      el.onclick = function () { state.selectedStyle = el.getAttribute('data-style'); render('styles'); };
    });
    app.querySelectorAll('[data-compare]').forEach(function (el) {
      el.onclick = function () { state.compareMode=el.getAttribute('data-compare'); render('result'); };
    });
    app.querySelectorAll('[data-open-art]').forEach(function (el) {
      el.onclick = function () {
        var id = Number(el.getAttribute('data-open-art'));
        var item = state.gallery.find(function(x){return x.id===id;});
        if(item){ state.generated=item; state.original=item.original; state.selectedStyle=item.style.id; state.compareMode='art'; render('result'); }
      };
    });
  }

  function goBack() {
    if (state.route === 'upload') return render('home');
    if (state.route === 'styles') return render('upload');
    if (state.route === 'result') return render('gallery');
    if (state.route === 'notes') return render('home');
    return render('home');
  }

  photoInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 18 * 1024 * 1024) { toast('图片太大了，建议选择 18MB 以内照片'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      state.original = reader.result;
      state.selectedStyle = 'film';
      AI.analyzePhoto(state.original).then(function(a){ if(a.recommendedStyle) state.selectedStyle=a.recommendedStyle; render('styles'); });
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
  });

  function generate() {
    if (!state.original) return render('upload');
    render('loading');
    var label = document.getElementById('progressLabel');
    var bar = document.getElementById('progressBar');
    var fake = 0;
    var words = ['正在整理光线','正在选择纸张','正在重新观看这个瞬间','正在写展签'];
    var timer = setInterval(function(){
      fake=Math.min(88,fake+Math.ceil(Math.random()*7));
      if(bar) bar.style.width=fake+'%';
      if(label) label.textContent=words[Math.min(words.length-1,Math.floor(fake/25))]+' · '+fake+'%';
    },130);

    AI.generateArtwork(state.original, state.selectedStyle, function(p){
      if(bar && p>fake){fake=p;bar.style.width=p+'%';}
    }).then(function(res){
      clearInterval(timer);
      var id=Date.now();
      var item={id:id,no:exhibitNo(id),date:today(),image:res.image,original:state.original,style:res.style,note:res.note,prompt:res.prompt};
      state.generated=item;
      state.compareMode='art';
      dbPut(item).then(function(){return dbGetAll();}).then(function(list){state.gallery=list;setTimeout(function(){render('result');},260);});
    }).catch(function(){
      clearInterval(timer);
      toast('布展失败了，请换一张照片再试');
      render('styles');
    });
  }

  function downloadCurrent() {
    if (!state.generated) return;
    var a=document.createElement('a');
    a.href=state.generated.image;
    a.download='ordinary-museum-'+state.generated.no.replace('.','-')+'.jpg';
    document.body.appendChild(a);a.click();a.remove();
    toast('作品已准备保存');
  }

  function dataUrlToFile(dataUrl, filename) {
    var arr=dataUrl.split(',');
    var mime=(arr[0].match(/:(.*?);/)||[])[1]||'image/jpeg';
    var bstr=atob(arr[1]);var n=bstr.length;var u8=new Uint8Array(n);
    while(n--)u8[n]=bstr.charCodeAt(n);
    return new File([u8],filename,{type:mime});
  }

  function shareCurrent() {
    if (!state.generated) return;
    var text='我把一个普通瞬间挂进了「普通生活美术馆」：'+state.generated.style.name+' · '+state.generated.no;
    try {
      var file=dataUrlToFile(state.generated.image,'ordinary-museum.jpg');
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({title:'普通生活美术馆',text:text,files:[file]}).catch(function(){});
      } else if(navigator.share){ navigator.share({title:'普通生活美术馆',text:text}).catch(function(){}); }
      else if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){toast('展签文字已复制');});}
      else toast('当前浏览器不支持系统分享');
    } catch(e){toast('当前浏览器不支持系统分享');}
  }

  dbGetAll().then(function(list){ state.gallery=list; render('home'); });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
  }
})();
