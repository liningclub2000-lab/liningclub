// profile.js
// Shows/edits profile, address and orders. Works with site-wide script.js user state if available,
// otherwise falls back to localStorage keys: 'liningclub_current_user' and 'lc_orders'/'lc_profile'/'lc_address'.
//
// Behavior:
// - load existing user data into form
// - save writes to localStorage; if a global function window.updateUserProfileToServer exists (e.g. your Firebase wrapper),
//   it will be called with the updated profile object (non-blocking).
// - Orders tab shows only the current user's purchases; if none, shows empty message.

(function(){
  const CURRENT_USER_KEY = 'liningclub_current_user';
  const LOCAL_PROFILE_KEY = 'lc_profile';
  const LOCAL_ADDRESS_KEY = 'lc_address';
  const LOCAL_ORDERS_KEY = 'lc_orders'; // store array of order objects, each order should have userEmail or uid

  // DOM
  function $id(id){ return document.getElementById(id); }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    populateDOB();
    bindButtons();
    loadToForms();
    renderOrders();
    // If main app exposes getCurrentUser and changes happen elsewhere, try to keep in sync:
    if (typeof window.getCurrentUser === 'function') {
      // small observer: poll once to pick up current user if script.js sets it after load
      setTimeout(syncFromGlobalUser, 400);
      setTimeout(syncFromGlobalUser, 1200);
    }
  });

  function initTabs(){
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const t = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        const panel = document.getElementById(t);
        if (panel) panel.classList.add('active');
      });
    });
  }

  function populateDOB(){
    const yearEl = $id('dobYear');
    const monthEl = $id('dobMonth');
    const dayEl = $id('dobDay');
    const currentYear = new Date().getFullYear();
    for(let y = currentYear; y >= 1900; y--){
      const o = document.createElement('option'); o.value = y; o.textContent = y; yearEl.appendChild(o);
    }
    for(let m=1;m<=12;m++){ const o=document.createElement('option'); o.value=m; o.textContent=m; monthEl.appendChild(o); }
    for(let d=1;d<=31;d++){ const o=document.createElement('option'); o.value=d; o.textContent=d; dayEl.appendChild(o); }

    monthEl.addEventListener('change', adjustDays);
    yearEl.addEventListener('change', adjustDays);
  }

  function adjustDays(){
    const y = parseInt($id('dobYear').value||0);
    const m = parseInt($id('dobMonth').value||0);
    const dayEl = $id('dobDay');
    const daysInMonth = new Date(y || 2000, m, 0).getDate();
    const prev = dayEl.value;
    dayEl.innerHTML = '';
    for(let d=1; d<=daysInMonth; d++){
      const o=document.createElement('option'); o.value=d; o.textContent=d; dayEl.appendChild(o);
    }
    if(prev && prev <= daysInMonth) dayEl.value = prev;
  }

  function bindButtons(){
    $id('saveProfileBtn').addEventListener('click', saveProfile);
    $id('editProfileBtn').addEventListener('click', ()=> setFormEditable(true));
    $id('saveAddressBtn').addEventListener('click', saveAddress);
    $id('logoutBtn').addEventListener('click', ()=> {
      // If global logout exists use it; otherwise clear local user
      if (typeof window.logoutCurrentUser === 'function') {
        window.logoutCurrentUser();
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        if (typeof window.setCurrentUser === 'function') window.setCurrentUser(null);
        location.href = 'index.html';
      }
    });
    $id('changePassBtn').addEventListener('click', ()=> {
      alert('Нууц үг өөрчлөх хэсэг (Demo) — Жинхэнэ системд backend шаардлагатай.');
    });
  }

  function setFormEditable(editable){
    ['lastName','firstName','phone','email','dobYear','dobMonth','dobDay'].forEach(id=>{
      const el = $id(id);
      if(el) el.disabled = !editable;
    });
    $id('profileMsg').textContent = editable ? 'Мэдээллийг засна уу...' : '';
  }

  // Load user/profile/address into UI
  function loadToForms(){
    const user = getCurrentUserData();
    // Try to fill fields from firebase-aware current user first (if available)
    if (user) {
      const nameParts = (user.name || '').split(' ');
      $id('firstName').value = nameParts.slice(0,1).join(' ') || (user.firstName || '');
      $id('lastName').value = nameParts.slice(1).join(' ') || (user.lastName || '');
      $id('phone').value = user.phone || '';
      $id('email').value = user.email || '';
      if (user.dobYear) $id('dobYear').value = user.dobYear;
      if (user.dobMonth) $id('dobMonth').value = user.dobMonth;
      adjustDays();
      if (user.dobDay) $id('dobDay').value = user.dobDay;
    } else {
      // fallback: load saved local profile
      const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        $id('firstName').value = p.firstName || '';
        $id('lastName').value = p.lastName || '';
        $id('phone').value = p.phone || '';
        $id('email').value = p.email || '';
        if (p.dobYear) $id('dobYear').value = p.dobYear;
        if (p.dobMonth) $id('dobMonth').value = p.dobMonth;
        adjustDays();
        if (p.dobDay) $id('dobDay').value = p.dobDay;
      }
    }

    // address
    const araw = localStorage.getItem(LOCAL_ADDRESS_KEY);
    if (araw) {
      const a = JSON.parse(araw);
      $id('city').value = a.city || '';
      $id('district').value = a.district || '';
      $id('street').value = a.street || '';
    } else if (user && user.address) {
      // if user.address is a string, attempt to populate street only
      if (typeof user.address === 'string') $id('street').value = user.address;
      else {
        $id('city').value = user.address.city || '';
        $id('district').value = user.address.district || '';
        $id('street').value = user.address.street || '';
      }
    }

    // lock form by default
    setFormEditable(false);
  }

  // Save profile (localStorage + optional server hook)
  async function saveProfile(){
    const profile = {
      firstName: $id('firstName').value.trim(),
      lastName: $id('lastName').value.trim(),
      phone: $id('phone').value.trim(),
      email: $id('email').value.trim(),
      dobYear: $id('dobYear').value,
      dobMonth: $id('dobMonth').value,
      dobDay: $id('dobDay').value
    };

    // persist locally
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));

    // if global user exists, merge and update it
    const current = getCurrentUserData();
    if (current) {
      current.name = `${profile.firstName} ${profile.lastName}`.trim() || current.name || '';
      current.phone = profile.phone || current.phone || '';
      current.email = profile.email || current.email || '';
      current.dobYear = profile.dobYear;
      current.dobMonth = profile.dobMonth;
      current.dobDay = profile.dobDay;

      // if host app exposes setCurrentUser, call it so header updates
      if (typeof window.setCurrentUser === 'function') {
        try { window.setCurrentUser(current); } catch(e){ /* ignore */ }
      } else {
        // save to local fallback key
        try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current)); } catch(e){}
      }

      // If there is a helper to update remote (for example you added one to use Firestore),
      // call it. This call is best-effort and won't block UI.
      if (typeof window.updateUserProfileToServer === 'function') {
        try { await window.updateUserProfileToServer(current); } catch(e){ console.warn('remote update failed', e); }
      }
    }

    $id('profileMsg').textContent = 'Мэдээлэл амжилттай хадгалагдлаа.';
    setFormEditable(false);
  }

  // Save address
  async function saveAddress(){
    const addr = {
      city: $id('city').value.trim(),
      district: $id('district').value.trim(),
      street: $id('street').value.trim()
    };
    localStorage.setItem(LOCAL_ADDRESS_KEY, JSON.stringify(addr));

    // merge to current user if present
    const current = getCurrentUserData();
    if (current) {
      current.address = addr;
      if (typeof window.setCurrentUser === 'function') {
        try { window.setCurrentUser(current); } catch(e){ /* ignore */ }
      } else {
        try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current)); } catch(e){}
      }
      if (typeof window.updateUserProfileToServer === 'function') {
        try { await window.updateUserProfileToServer(current); } catch(e){ console.warn('remote addr update failed', e); }
      }
    }

    $id('addressMsg').textContent = 'Хаяг амжилттай хадгалагдав.';
  }

  // Orders rendering: show only orders that belong to this user (by email or uid if available)
  function renderOrders(){
    const container = $id('ordersList');
    container.innerHTML = '';

    const rawOrders = localStorage.getItem(LOCAL_ORDERS_KEY);
    let orders = [];
    if (rawOrders) {
      try { orders = JSON.parse(rawOrders); } catch(e){ orders = []; }
    }

    const current = getCurrentUserData();
    let userIdentifier = null;
    if (current) {
      userIdentifier = current.email || current.uid || null;
    }

    // filter
    const userOrders = userIdentifier ? orders.filter(o => o.userEmail === userIdentifier || o.uid === userIdentifier) : [];

    if (!userOrders || userOrders.length === 0) {
      // If we don't have current user identifier, but orders exist for demo, show only those with no user (guest)
      if (!userIdentifier && orders.length === 0) {
        const el = document.createElement('div');
        el.className = 'empty-state';
        el.textContent = 'Танд захиалга байхгүй байна.';
        container.appendChild(el);
        return;
      } else if (!userIdentifier && orders.length > 0) {
        // show all orders (if user not logged in) but label clearly
        const el = document.createElement('div');
        el.className = 'order-card';
        el.innerHTML = `<div><div class="order-items">Хэрэглэгч нэвтрээгүй тул бүх демо захиалгын жагсаалтыг харуулж байна</div></div>`;
        container.appendChild(el);
        orders.forEach(o => container.appendChild(renderOrderCard(o)));
        return;
      } else {
        const el = document.createElement('div');
        el.className = 'empty-state';
        el.textContent = 'Танд захиалга байхгүй байна.';
        container.appendChild(el);
        return;
      }
    }

    // render each order
    userOrders.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    userOrders.forEach(o => container.appendChild(renderOrderCard(o)));
  }

  function renderOrderCard(o){
    const wrap = document.createElement('div');
    wrap.className = 'order-card';
    const left = document.createElement('div');
    left.innerHTML = `<div class="order-items">Захиалга #${escapeHtml(String(o.id || o.orderId || '—'))}</div>
                      <div class="order-meta">${escapeHtml(o.createdAt || o.date || '')} • ${escapeHtml(o.status || 'Шинэ')}</div>`;
    const right = document.createElement('div');
    right.style.textAlign = 'right';
    right.innerHTML = `<div class="order-meta">Нийт: ${escapeHtml(String(o.total || o.amount || '$0'))}</div>
                       <div class="order-meta" style="margin-top:6px">${(o.items && o.items.length) ? o.items.map(i=>escapeHtml(i.name)).join(', ') : 'Бараа байхгүй'}</div>`;
    wrap.appendChild(left);
    wrap.appendChild(right);
    return wrap;
  }

  // Helper: get current user data from global app or localStorage
  function getCurrentUserData(){
    try {
      if (typeof window.getCurrentUser === 'function') {
        const u = window.getCurrentUser();
        if (u) return u;
      }
    } catch(e){ /* ignore */ }

    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){ /* ignore */ }

    try {
      const rawp = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (rawp) {
        const p = JSON.parse(rawp);
        // normalize shape to match expected user object in other scripts
        return {
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          email: p.email || '',
          phone: p.phone || '',
          dobYear: p.dobYear || '',
          dobMonth: p.dobMonth || '',
          dobDay: p.dobDay || ''
        };
      }
    } catch(e){ /* ignore */ }

    return null;
  }

  // If main app sets user state after this page loaded, copy it into our forms
  function syncFromGlobalUser(){
    const globalUser = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (globalUser) {
      // merge into local storage so our UI picks it up
      try {
        const normalized = {
          firstName: (globalUser.name || '').split(' ').slice(0,1).join(' '),
          lastName: (globalUser.name || '').split(' ').slice(1).join(' '),
          phone: globalUser.phone || '',
          email: globalUser.email || '',
          dobYear: globalUser.dobYear || '',
          dobMonth: globalUser.dobMonth || '',
          dobDay: globalUser.dobDay || ''
        };
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(normalized));
      } catch(e){}
      loadToForms();
      renderOrders();
    }
  }

  /* utilities */
  function escapeHtml(str){
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

})();
