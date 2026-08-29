(function (global) {
  'use strict';

  var styles = [
    {
      id: 'oil', name: '古典油画', en: 'CLASSICAL OIL', tone: 'yellow',
      desc: '把日常光线，沉淀成画布上的时间。',
      note: '这一刻没有被夸张，只是被光线认真保存了下来。',
      prompt: '保留原始构图和人物身份，将照片转化为克制的古典油画质感；自然笔触、厚涂层次、柔和暗部、温暖博物馆灯光。'
    },
    {
      id: 'film', name: '法式胶片', en: 'FRENCH FILM', tone: 'peach',
      desc: '像一部旧电影里，刚刚停住的一帧。',
      note: '日子没有变旧，只是光线开始有了时间感。',
      prompt: '保留原始构图，将照片转化为温暖法式胶片摄影；低对比、轻微褪色、细颗粒、自然肤色与柔和高光。'
    },
    {
      id: 'dream', name: '梦境印象', en: 'DREAM IMPRESSION', tone: 'lilac',
      desc: '现实边缘轻轻融化，像醒来前的一秒。',
      note: '现实没有消失，它只是暂时把边缘交给了梦。',
      prompt: '在保留主体可识别性的前提下，转化为梦境印象风；柔焦、轻微色彩漂移、空气感、朦胧层次、诗意光晕。'
    },
    {
      id: 'watercolor', name: '清透水彩', en: 'WATERCOLOR', tone: 'mint',
      desc: '让颜色松开一点，让呼吸留在纸上。',
      note: '被水晕开的不是细节，而是这一刻原本紧绷的边界。',
      prompt: '将照片转化为清透水彩插画；保留构图，减少硬边，水彩纸纹理、轻盈留白、透明叠色、自然渗化。'
    },
    {
      id: 'print', name: '复古版画', en: 'VINTAGE PRINT', tone: 'kraft',
      desc: '更强的线条与纸张肌理，像旧书插页。',
      note: '普通的场景一旦只剩线条，反而更像一段值得留下的证词。',
      prompt: '将照片转化为复古版画；高对比线条、旧纸张纹理、有限色彩、蚀刻感、细密排线，保留主体轮廓。'
    },
    {
      id: 'editorial', name: '艺术杂志', en: 'EDITORIAL', tone: 'pink',
      desc: '克制构图，把普通瞬间变成编辑选片。',
      note: '生活没有被包装，只是终于被当成一张值得刊登的照片。',
      prompt: '将照片处理为当代艺术杂志编辑选片风格；干净构图、克制色彩、适度留白、高级纸刊质感，保留真实感。'
    }
  ];

  function getStyle(id) {
    return styles.find(function (s) { return s.id === id; }) || styles[1];
  }

  function analyzePhoto(dataUrl) {
    return Promise.resolve({
      dominantMood: 'ordinary-poetic',
      subjectConfidence: 0.92,
      recommendedStyle: 'film',
      dataUrl: dataUrl
    });
  }

  function promptFor(styleId) {
    return getStyle(styleId).prompt;
  }

  function drawImageCover(ctx, img, width, height) {
    var r = Math.max(width / img.width, height / img.height);
    var w = img.width * r;
    var h = img.height * r;
    var x = (width - w) / 2;
    var y = (height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  function addPaperGrain(ctx, width, height, strength) {
    var count = Math.floor(width * height / 240);
    ctx.save();
    for (var i = 0; i < count; i++) {
      var a = Math.random() * strength;
      ctx.fillStyle = 'rgba(75,55,35,' + a.toFixed(3) + ')';
      ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
    ctx.restore();
  }

  function addSoftLight(ctx, width, height, color, alpha) {
    var g = ctx.createRadialGradient(width * .28, height * .18, 0, width * .28, height * .18, width * .75);
    g.addColorStop(0, color.replace('ALPHA', alpha));
    g.addColorStop(1, color.replace('ALPHA', '0'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function generateArtwork(dataUrl, styleId, progressCb) {
    var style = getStyle(styleId);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var max = 1600;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var width = Math.max(1, Math.round(img.width * scale));
          var height = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');

          if (progressCb) progressCb(24);
          ctx.save();
          if (styleId === 'oil') ctx.filter = 'saturate(1.18) contrast(1.12) sepia(.12)';
          if (styleId === 'film') ctx.filter = 'saturate(.84) contrast(.88) sepia(.11) brightness(1.03)';
          if (styleId === 'dream') ctx.filter = 'saturate(1.2) contrast(.88) brightness(1.08) blur(.35px)';
          if (styleId === 'watercolor') ctx.filter = 'saturate(.88) contrast(.82) brightness(1.12)';
          if (styleId === 'print') ctx.filter = 'grayscale(.8) sepia(.45) contrast(1.35) brightness(.96)';
          if (styleId === 'editorial') ctx.filter = 'saturate(.88) contrast(1.08) brightness(1.04)';
          drawImageCover(ctx, img, width, height);
          ctx.restore();

          if (progressCb) progressCb(52);
          ctx.save();
          if (styleId === 'oil') {
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = 'rgba(173,105,55,.17)';
            ctx.fillRect(0,0,width,height);
            addPaperGrain(ctx,width,height,.045);
          } else if (styleId === 'film') {
            addSoftLight(ctx,width,height,'rgba(255,218,170,ALPHA)',.28);
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle='rgba(244,209,184,.08)';ctx.fillRect(0,0,width,height);
            addPaperGrain(ctx,width,height,.07);
          } else if (styleId === 'dream') {
            addSoftLight(ctx,width,height,'rgba(224,188,255,ALPHA)',.32);
            var g = ctx.createLinearGradient(0,0,width,height);
            g.addColorStop(0,'rgba(118,177,205,.12)');g.addColorStop(1,'rgba(230,154,196,.16)');
            ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
          } else if (styleId === 'watercolor') {
            ctx.globalCompositeOperation='screen';
            ctx.fillStyle='rgba(255,250,238,.16)';ctx.fillRect(0,0,width,height);
            addPaperGrain(ctx,width,height,.038);
          } else if (styleId === 'print') {
            ctx.globalCompositeOperation='multiply';
            ctx.fillStyle='rgba(111,78,44,.08)';ctx.fillRect(0,0,width,height);
            addPaperGrain(ctx,width,height,.09);
          } else if (styleId === 'editorial') {
            var margin = Math.round(Math.min(width,height) * .022);
            ctx.strokeStyle='rgba(255,250,241,.78)';ctx.lineWidth=margin;
            ctx.strokeRect(margin/2,margin/2,width-margin,height-margin);
          }
          ctx.restore();

          if (progressCb) progressCb(78);
          setTimeout(function(){
            if (progressCb) progressCb(100);
            resolve({
              image: canvas.toDataURL('image/jpeg', .9),
              style: style,
              note: style.note,
              prompt: style.prompt
            });
          }, 220);
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  global.OrdinaryMuseumAI = {
    styles: styles,
    getStyle: getStyle,
    analyzePhoto: analyzePhoto,
    promptFor: promptFor,
    generateArtwork: generateArtwork
  };
})(window);
