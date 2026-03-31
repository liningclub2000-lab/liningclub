// Improved interactions + form submit + basic analytics events
document.addEventListener('DOMContentLoaded', () => {
  const heroCta = document.getElementById('hero-cta');
  const topCta = document.getElementById('top-cta');
  const sticky = document.getElementById('sticky-cta');
  const priceCtas = document.querySelectorAll('.price-cta');
  const form = document.getElementById('lead-form');
  const success = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');

  function trackEvent(name, data = {}) {
    if (window.dataLayer) window.dataLayer.push({ event: name, ...data });
    console.log('track:', name, data);
  }

  [heroCta, topCta, sticky, ...priceCtas].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      trackEvent('cta_click', { id: btn.id || 'price-cta' });
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  function validateForm() {
    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();
    if (!name) {
      alert('Нэр шаардлагатай.');
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      alert('Зөв имэйл хаяг оруулна уу.');
      return false;
    }
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Илгээж байна…';
    const data = new FormData(form);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        form.classList.add('hidden');
        success.classList.remove('hidden');
        trackEvent('lead_submitted');
      } else {
        let msg = 'Алдаа гарлаа. Дахин оролдоно уу.';
        try { const json = await res.json(); if (json && json.error) msg = json.error; } catch (_) {}
        alert(msg);
        trackEvent('lead_error');
      }
    } catch (err) {
      alert('Сүлжээний алдаа.');
      trackEvent('lead_error', { error: String(err) });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
