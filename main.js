// Lightweight interactions + form submit + basic analytics events
document.addEventListener('DOMContentLoaded', () => {
  const heroCta = document.getElementById('hero-cta');
  const topCta = document.getElementById('top-cta');
  const sticky = document.getElementById('sticky-cta');
  const priceCtas = document.querySelectorAll('.price-cta');
  const form = document.getElementById('lead-form');
  const success = document.getElementById('form-success');

  function trackEvent(name, data = {}) {
    // Replace with actual analytics (gtag/event) as needed
    if (window.dataLayer) window.dataLayer.push({ event: name, ...data });
    console.log('track:', name, data);
  }

  [heroCta, topCta, sticky, ...priceCtas].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      trackEvent('cta_click', { id: btn.id || 'price-cta' });
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
        alert('Алдаа гарлаа. Дахин оролдоно уу.');
        trackEvent('lead_error');
      }
    } catch (err) {
      alert('Сүлжээний алдаа.');
      trackEvent('lead_error', { error: String(err) });
    }
  });
});
