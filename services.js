(function(){
  'use strict';
  var styles = [
    {id:'oil', room:'绘画厅', name:'古典油画', en:'CLASSICAL OIL', desc:'把日常光线沉淀成画布上的时间。', tone:'ochre', icon:'✿', note:'光线被慢慢压进颜色里，普通的一刻也有了被凝视的重量。'},
    {id:'film', room:'电影厅', name:'法式胶片', en:'FRENCH FILM', desc:'一点颗粒、一点褪色，让生活有时间感。', tone:'blue', icon:'◌', note:'日子没有变旧，只是光线开始有了时间感。'},
    {id:'dream', room:'超现实厅', name:'梦境印象', en:'DREAM IMPRESSION', desc:'让现实松开一点边界，像刚醒来的梦。', tone:'lilac', icon:'✦', note:'现实没有消失，只是允许想象在边缘多停留一会儿。'},
    {id:'watercolor', room:'摄影厅', name:'清透水彩', en:'CLEAR WATERCOLOR', desc:'保留空气与留白，让日常变得轻一些。', tone:'green', icon:'❋', note:'越是轻的颜色，越能留下那些差一点被忽略的心情。'},
    {id:'print', room:'手稿厅', name:'复古版画', en:'VINTAGE PRINT', desc:'更强的线条与纸张肌理，像旧书插页。', tone:'tan', icon:'✎', note:'线条替你保存了细节，像一本从未来寄回来的旧书。'},
    {id:'editorial', room:'杂志厅', name:'艺术杂志', en:'EDITORIAL', desc:'克制构图，把普通瞬间变成编辑选片。', tone:'pink', icon:'▤', note:'不是每个瞬间都要讲故事，有时一个好看的停顿就够了。'}
  ];

  function analyzePhoto(dataUrl){
    return Promise.resolve({
      scene:'日常场景', light:'柔和自然光', mood:'安静 / 松弛', keywords:['日常','光线','留白'],
      summary:'这是一张不需要解释太多的照片。它最适合保留原来的生活感，只重新组织观看方式。'
    });
  }
  function recommendGallery(analysis){
    var map = ['film','watercolor','oil','editorial'];
    return map[Math.floor((Date.now()/1000)%map.length)];
  }
  function buildPrompt(style, analysis){
    return '保留原始照片主体、空间关系与人物身份，不添加文字水印。将画面诠释为'+style.room+' / '+style.name+'。'+style.desc+' 场景：'+analysis.scene+'；光线：'+analysis.light+'；情绪：'+analysis.mood+'。';
  }
  window.OrdinaryMuseumAI={styles:styles, analyzePhoto:analyzePhoto, recommendGallery:recommendGallery, buildPrompt:buildPrompt};
})();
