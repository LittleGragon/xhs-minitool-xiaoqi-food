// 小齐今天吃什么 — 主逻辑
// 纯本地运行，无网络请求，符合小红书小工具规范

(function() {
  'use strict';

  // ===== 状态 =====
  var state = {
    currentCity: 'guangzhou',
    currentTab: 'home',
    currentCategory: 'all',
    searchQuery: '',
    flipCount: 3,
    currentDishIndex: 0,
    detailRestaurantId: null
  };

  // ===== 工具函数 =====
  function $(id) { return document.getElementById(id); }

  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function getRestaurants() {
    return XIAOQI_DATA.restaurants.filter(function(r) {
      return r.city === state.currentCity;
    });
  }

  function getFilteredRestaurants() {
    var list = getRestaurants();
    var q = state.searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(function(r) {
        return r.name.toLowerCase().indexOf(q) >= 0 ||
               r.district.toLowerCase().indexOf(q) >= 0 ||
               r.cuisine.toLowerCase().indexOf(q) >= 0 ||
               r.xiaoqi_said.toLowerCase().indexOf(q) >= 0 ||
               r.tags.some(function(t) { return t.toLowerCase().indexOf(q) >= 0; });
      });
    }

    if (state.currentCategory !== 'all') {
      var cat = state.currentCategory;
      list = list.filter(function(r) {
        // 分类匹配：category 字段 + tags 中的关键词
        if (r.category === cat) return true;
        if (cat === 'solo') return r.tags.some(function(t) { return t.indexOf('一人食') >= 0; });
        if (cat === 'date') return r.tags.some(function(t) { return t.indexOf('约会') >= 0 || t.indexOf('朋友聚餐') >= 0; });
        if (cat === 'classic') return r.tags.some(function(t) { return t.indexOf('老字号') >= 0 || t.indexOf('米其林') >= 0; });
        return false;
      });
    }

    return list;
  }

  function getCityName(key) {
    var city = XIAOQI_DATA.cities.find(function(c) { return c.key === key; });
    return city ? city.name : '广州';
  }

  function getAccentClass(accent) {
    var map = {
      primary: 'rest-card--primary',
      secondary: 'rest-card--tertiary',
      tertiary: 'rest-card--tertiary',
      error: 'rest-card--error'
    };
    return map[accent] || 'rest-card--primary';
  }

  function getStampClass(accent) {
    var map = {
      primary: 'rest-card__stamp--primary',
      secondary: 'rest-card__stamp--secondary',
      tertiary: 'rest-card__stamp--tertiary',
      error: 'rest-card__stamp--primary'
    };
    return map[accent] || 'rest-card__stamp--primary';
  }

  function getStampIcon(stamp) {
    var map = {
      restaurant: '🍴',
      verified: '✓',
      local_cafe: '☕',
      favorite: '❤'
    };
    return map[stamp] || '★';
  }

  // ===== 渲染：首页翻牌 =====
  function renderDrawCard() {
    var list = getRestaurants();
    if (list.length === 0) return;

    var r = list[state.currentDishIndex % list.length];
    $('draw-emoji').textContent = r.emoji;
    $('draw-name').textContent = r.name;
    $('draw-rating').textContent = r.rating + ' 分';
    $('draw-price').textContent = '人均 ¥' + r.avg_price;
    $('draw-area').textContent = r.district + ' · ' + r.cuisine;
    $('draw-quote').textContent = r.xiaoqi_said;

    var tagsHtml = r.tags.map(function(t) {
      return '<span class="draw-tag">' + t + '</span>';
    }).join('');
    $('draw-tags').innerHTML = tagsHtml;

    $('draw-counter-text').textContent =
      '✨ 已为你翻了 ' + state.flipCount + ' 次牌 · 随缘也是一种美味';
  }

  function rerollDish() {
    var card = $('draw-card');
    var emoji = $('draw-emoji');

    // 翻牌动画
    card.classList.add('drawing');

    setTimeout(function() {
      var list = getRestaurants();
      // 不重复上一个
      var next;
      do {
        next = Math.floor(Math.random() * list.length);
      } while (next === state.currentDishIndex && list.length > 1);

      state.currentDishIndex = next;
      state.flipCount++;
      renderDrawCard();

      // 恢复
      card.classList.remove('drawing');

      // emoji 弹跳
      emoji.classList.add('bounce');
      setTimeout(function() {
        emoji.classList.remove('bounce');
      }, 220);
    }, 160);
  }

  // ===== 渲染：列表页 =====
  function renderFilterChips() {
    var container = $('filter-chips');
    container.innerHTML = XIAOQI_DATA.categories.map(function(cat) {
      var active = state.currentCategory === cat.key ? 'filter-chip active' : 'filter-chip';
      return '<button class="' + active + '" data-key="' + cat.key + '">' + cat.label + '</button>';
    }).join('');

    // 绑定事件
    container.querySelectorAll('.filter-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        state.currentCategory = chip.dataset.key;
        renderFilterChips();
        renderRestaurantList();
      });
    });
  }

  function renderRestaurantList() {
    var list = getFilteredRestaurants();
    var container = $('rest-list');

    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state">' +
        '<span class="empty-state__emoji">🍽️</span>' +
        '<span class="empty-state__text">暂时没有找到哦，换个关键词试试？</span>' +
        '</div>';
      return;
    }

    container.innerHTML = list.map(function(r) {
      var cardClass = getAccentClass(r.accent);
      var stampClass = getStampClass(r.accent);
      var stampIcon = getStampIcon(r.stamp);

      var tagsHtml = r.tags.slice(0, 2).map(function(t) {
        return '<span class="rest-card__tag">' + t + '</span>';
      }).join('');

      return '<article class="rest-card ' + cardClass + '" data-action="open-detail" data-id="' + r.id + '">' +
        '<div class="rest-card__stamp ' + stampClass + '">' + stampIcon + '</div>' +
        '<div class="rest-card__top">' +
          '<div class="rest-card__emoji-wrap">' + r.emoji + '</div>' +
          '<div class="rest-card__info">' +
            '<h2 class="rest-card__name">' + r.name + '</h2>' +
            '<div class="rest-card__meta">' +
              '<span class="rest-card__rating">' +
                '<span class="rest-card__rating-icon">★</span>' +
                r.rating +
              '</span>' +
              '<span class="rest-card__dot"></span>' +
              '<span class="rest-card__price">人均 ¥' + r.avg_price + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rest-card__tags">' + tagsHtml + '</div>' +
        '<div class="rest-card__note">' +
          '<span class="rest-card__note-label">小齐说:</span>' +
          '<p class="rest-card__note-text">' + r.xiaoqi_said + '</p>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  // ===== 渲染：详情页 =====
  function renderDetail(r) {
    var dishesHtml = r.signature_dishes.map(function(d) {
      var starsHtml = '';
      for (var i = 0; i < 3; i++) {
        starsHtml += '<span>' + (i < d.stars ? '★' : '☆') + '</span>';
      }

      var tagClass = 'dish-item__tag--' + (d.tag_type || 'primary');

      return '<div class="dish-item">' +
        '<div class="dish-item__left">' +
          (d.emoji ? '<span class="dish-item__emoji">' + d.emoji + '</span>' : '') +
          '<div class="dish-item__info">' +
            '<div class="dish-item__name-row">' +
              '<span class="dish-item__name">' + d.name + '</span>' +
              '<span class="dish-item__tag ' + tagClass + '">' + d.tag + '</span>' +
            '</div>' +
            '<span class="dish-item__desc">' + (d.desc || '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="dish-item__right">' +
          '<span class="dish-item__price">¥' + d.price + '</span>' +
          '<div class="dish-item__stars">' + starsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var html = '';

    // Hero
    html += '<div class="detail-hero">' +
      '<div class="detail-hero__stamp">' +
        '<div class="detail-hero__stamp-inner">' +
          '<span class="detail-hero__stamp-title">小齐私荐</span>' +
          '<div class="detail-hero__stamp-stars">★★★★★</div>' +
          '<span class="detail-hero__stamp-sub">TOP PICK</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-hero__emoji-box">' + r.emoji + '</div>' +
      '<h2 class="detail-hero__name">' + r.name + '</h2>' +
      '<div class="detail-hero__badges">' +
        '<span class="detail-hero__badge detail-hero__badge--outline">' + r.district + '·' + r.cuisine + '</span>' +
        '<span class="detail-hero__badge detail-hero__badge--price">人均 ¥' + r.avg_price + '</span>' +
        (r.hours ?
          '<span class="detail-hero__badge detail-hero__badge--open">' +
            '<span class="detail-hero__badge-dot"></span>' +
            '营业中 ' + r.hours +
          '</span>' : '') +
      '</div>' +
    '</div>';

    // 小齐的私藏日记
    html += '<div class="detail-diary">' +
      '<div class="detail-diary__tape">XIAOQI\'S NOTE</div>' +
      '<div class="detail-diary__header">' +
        '<div class="detail-diary__avatar">🐾</div>' +
        '<div class="detail-diary__titles">' +
          '<span class="detail-diary__title">小齐的私藏日记 ✍️</span>' +
          '<span class="detail-diary__subtitle">常驻饭堂 · 真实打卡5年</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-diary__text">' + (r.full_review || r.xiaoqi_said || '') + '</div>' +
    '</div>';

    // 小齐推荐（有推荐菜才显示）
    if (r.signature_dishes && r.signature_dishes.length > 0) {
      html += '<div>' +
        '<div class="detail-section__header">' +
          '<div class="detail-section__title">' +
            '<span class="detail-section__title-icon">📋</span>' +
            '<span class="detail-section__title-text">小齐推荐</span>' +
          '</div>' +
          '<span class="detail-section__subtitle">跟着点不踩雷</span>' +
        '</div>' +
        '<div class="dish-list">' + dishesHtml + '</div>' +
      '</div>';
    }

    // 实用小抄
    html += '<div class="detail-info-card">' +
      '<div class="detail-section__header" style="padding:0;margin-bottom:0;">' +
        '<div class="detail-section__title">' +
          '<span class="detail-section__title-icon" style="color:var(--color-secondary);">📝</span>' +
          '<span class="detail-section__title-text">实用小抄</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-info__item">' +
        '<span class="detail-info__icon detail-info__icon--primary">📍</span>' +
        '<div class="detail-info__content">' +
          '<span class="detail-info__label">店铺地址</span>' +
          '<span class="detail-info__value">' + r.address + '</span>' +
        '</div>' +
        '<button class="detail-info__copy-btn" data-action="copy-address">' +
          '<span>⎘</span><span>复制</span>' +
        '</button>' +
      '</div>' +
      '<div class="detail-info__item">' +
        '<span class="detail-info__icon detail-info__icon--tertiary">🚇</span>' +
        '<div class="detail-info__content">' +
          '<span class="detail-info__label">交通建议</span>' +
          '<span class="detail-info__value">' + r.transport + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-info__item">' +
        '<span class="detail-info__icon detail-info__icon--primary">💡</span>' +
        '<div class="detail-info__content">' +
          '<span class="detail-info__label">避坑提示</span>' +
          '<span class="detail-info__value detail-info__value--tip">' + r.tips + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    // 底部按钮
    html += '<div class="detail-action">' +
      '<button class="detail-action__btn" data-action="copy-address">' +
        '<span>📋</span>' +
        '<span>复制地址，今天就去吃！</span>' +
        '<span>→</span>' +
      '</button>' +
      '<span class="detail-action__hint">个人手账私藏推荐 · 无商业赞助</span>' +
    '</div>';

    $('detail-content').innerHTML = html;
  }

  // ===== 渲染：城市列表 =====
  function renderCityList() {
    var container = $('city-list');
    var currentKey = state.currentCity;

    // 只显示有餐厅的城市（count > 0）
    var otherCities = XIAOQI_DATA.cities.filter(function(c) {
      return c.key !== currentKey && c.count > 0;
    });

    container.innerHTML = otherCities.map(function(city) {
      return '<button class="city-item" data-action="select-city" data-city="' + city.key + '">' +
        '<div class="city-item__left">' +
          '<div class="city-item__emoji">' + city.emoji + '</div>' +
          '<div class="city-item__info">' +
            '<div class="city-item__name-row">' +
              '<span class="city-item__name">' + city.name + '</span>' +
              '<span class="city-item__count">' + city.count + ' 家私藏</span>' +
            '</div>' +
            '<span class="city-item__desc">' + city.tags.join(' · ') + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="city-item__arrow">›</span>' +
      '</button>';
    }).join('');

    // 如果只有当前城市有数据，显示提示
    if (otherCities.length === 0) {
      container.innerHTML = '<div class="city-empty">更多城市正在探索中…</div>';
    }
  }

  // ===== 导航 =====
  function switchTab(tab) {
    state.currentTab = tab;

    // 更新底部 tab
    document.querySelectorAll('.tabbar__item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    // 切换页面
    document.querySelectorAll('.page').forEach(function(page) {
      page.classList.remove('active');
    });

    if (tab === 'home') {
      $('page-home').classList.add('active');
      $('tabbar').style.display = '';
      $('main').style.paddingBottom = '88px';
    } else if (tab === 'list') {
      $('page-list').classList.add('active');
      $('tabbar').style.display = '';
      $('main').style.paddingBottom = '88px';
      renderRestaurantList();
    }

    // 滚动到顶部
    $('main').scrollTop = 0;
  }

  function goToList() {
    switchTab('list');
  }

  function openCityPage() {
    $('page-city').classList.add('active');
    $('tabbar').style.display = 'none';
    $('main').style.paddingBottom = '0';
    renderCityList();
    $('main').scrollTop = 0;
  }

  function closeCityPage() {
    $('page-city').classList.remove('active');
    $('tabbar').style.display = '';
    $('main').style.paddingBottom = '88px';
  }

  function selectCity(key) {
    state.currentCity = key;
    var name = getCityName(key);
    var count = getRestaurants().length;
    $('current-city-name').textContent = name;
    $('list-city-name').textContent = name + ' · ' + count + '家精选';
    $('home-count').textContent = count;

    // 更新当前城市卡片
    var city = XIAOQI_DATA.cities.find(function(c) { return c.key === key; });
    if (city) {
      var activeCard = document.querySelector('.city-active-card__name');
      if (activeCard) activeCard.textContent = city.name;
      var activeCount = document.querySelector('.city-active-card__count');
      if (activeCount) activeCount.textContent = count + ' 家';
      var activeTags = document.querySelector('.city-active-card__tags');
      if (activeTags) {
        activeTags.innerHTML = city.tags.map(function(t) {
          return '<span class="city-active-card__tag">' + t + '</span>';
        }).join('');
      }
    }

    // 重新渲染数据
    state.currentDishIndex = 0;
    state.flipCount = 0;
    state.searchQuery = '';
    state.currentCategory = 'all';
    renderDrawCard();
    renderFilterChips();
    renderRestaurantList();
    // 重置搜索框
    var searchInput = $('search-input');
    if (searchInput) searchInput.value = '';

    showToast('已切换到 ' + name);
    setTimeout(function() {
      closeCityPage();
    }, 500);
  }

  function openDetail(id) {
    var r = getRestaurants().find(function(x) { return x.id === id; });
    if (!r) return;

    state.detailRestaurantId = id;
    renderDetail(r);

    $('detail-overlay').classList.add('active');
    $('detail-sheet').classList.add('active');

    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('detail-overlay').classList.remove('active');
    $('detail-sheet').classList.remove('active');
    document.body.style.overflow = '';
    state.detailRestaurantId = null;
  }

  // ===== 复制地址 =====
  // 容器禁用了剪贴板 API（navigator.clipboard / execCommand），
  // 改为弹出可选中文本层，引导用户长按 / 选中手动复制。
  function copyAddress(text) {
    var sheet = $('copy-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'copy-sheet';
      sheet.className = 'copy-sheet';
      sheet.innerHTML =
        '<div class="copy-sheet__mask" data-action="close-copy"></div>' +
        '<div class="copy-sheet__panel">' +
          '<div class="copy-sheet__title">复制地址</div>' +
          '<p class="copy-sheet__hint">长按下方文本，选择「复制」</p>' +
          '<div class="copy-sheet__text" id="copy-sheet-text"></div>' +
          '<button class="copy-sheet__done" data-action="close-copy">知道了</button>' +
        '</div>';
      document.body.appendChild(sheet);
    }
    $('copy-sheet-text').textContent = text;
    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCopySheet() {
    var sheet = $('copy-sheet');
    if (sheet) sheet.classList.remove('active');
    if (!$('detail-sheet').classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  // ===== Toast =====
  var toastTimer = null;
  function showToast(text) {
    var toast = $('toast');
    $('toast-text').textContent = text;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }

  // ===== 搜索 =====
  function handleSearch(e) {
    state.searchQuery = e.target.value;
    renderRestaurantList();
  }

  // ===== 事件委托（容器禁止行内 onclick，统一用 data-action 绑定） =====
  function bindActions() {
    document.body.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.dataset.action;

      if (action === 'switch-tab') {
        switchTab(el.dataset.tab);
      } else if (action === 'open-city') {
        openCityPage();
      } else if (action === 'close-city') {
        closeCityPage();
      } else if (action === 'go-list') {
        goToList();
      } else if (action === 'reroll') {
        rerollDish();
      } else if (action === 'open-detail') {
        openDetail(Number(el.dataset.id));
      } else if (action === 'close-detail') {
        closeDetail();
      } else if (action === 'copy-address') {
        var r = getRestaurants().find(function(x) { return x.id === state.detailRestaurantId; });
        if (r) copyAddress(r.address + ' ' + r.name);
      } else if (action === 'close-copy') {
        closeCopySheet();
      } else if (action === 'select-city') {
        selectCity(el.dataset.city);
      }
    });
  }

  // ===== Flex gap 行为检测（Chrome 61 不支持 flex gap，启用 margin 回退） =====
  function detectFlexGap() {
    var flex = document.createElement('div');
    flex.style.position = 'absolute';
    flex.style.visibility = 'hidden';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.rowGap = '1px';
    flex.appendChild(document.createElement('div'));
    flex.appendChild(document.createElement('div'));
    document.body.appendChild(flex);
    var supported = flex.scrollHeight === 1;
    flex.parentNode.removeChild(flex);
    if (!supported) {
      document.documentElement.classList.add('no-flex-gap');
    }
  }

  // ===== 初始化 =====
  function init() {
    detectFlexGap();

    // 应用配置开关
    if (typeof XIAOQI_CONFIG !== 'undefined') {
      if (!XIAOQI_CONFIG.show_rating) {
        document.body.classList.add('hide-rating');
      }
      if (!XIAOQI_CONFIG.show_review) {
        document.body.classList.add('hide-review');
      }
      if (!XIAOQI_CONFIG.show_price) {
        document.body.classList.add('hide-price');
      }
    }

    // 设置城市名
    $('current-city-name').textContent = getCityName(state.currentCity);
    $('list-city-name').textContent = getCityName(state.currentCity) + ' · ' + getRestaurants().length + '家精选';
    $('home-count').textContent = getRestaurants().length;

    // 渲染分类 chips
    renderFilterChips();

    // 渲染首页
    renderDrawCard();

    // 搜索事件
    var searchInput = $('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // 统一绑定 data-action 事件委托
    bindActions();
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
