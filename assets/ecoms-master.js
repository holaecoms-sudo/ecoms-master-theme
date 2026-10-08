/* ECOMS MASTER. Enhances Dawn native product forms; does not replace checkout. */
(() => {
  const money = (cents) => {
    const iso = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'CLP';
    return new Intl.NumberFormat('es-CL', {style:'currency',currency:iso,maximumFractionDigits: iso==='CLP'?0:2}).format(cents/100);
  };
  function init(root=document) {
    root.querySelectorAll('[data-ecoms-bundles]:not([data-ecoms-ready])').forEach((picker) => {
      picker.dataset.ecomsReady='true';
      const info=picker.closest('product-info');
      if(!info)return;
      let variants=[];
      try { variants=JSON.parse(picker.querySelector('[data-ecoms-variants]').textContent); } catch(_){ }
      const qtyInput=()=>info.querySelector('quantity-input input[name="quantity"]');
      function updateQty(q){
        const el=qtyInput(); if (!el) return;
        const min=Number(el.min)||1, max=Number(el.max)||Infinity, step=Number(el.step)||1;
        let next=Math.max(min,Math.min(max,q));
        next=min+Math.ceil((next-min)/step)*step;
        if(next>max) return;
        el.value=String(next);el.dispatchEvent(new Event('change',{bubbles:true}));
      }
      picker.addEventListener('change',(ev)=>{if(ev.target.matches('[data-ecoms-pack]'))updateQty(Number(ev.target.value));});
      const refresh=()=>{
        const selected=info.querySelector('form[action*="/cart/add"] [name="id"]');
        const variant=variants.find(v=>String(v.id)===String(selected?.value));
        if(!variant)return;
        picker.querySelectorAll('[data-ecoms-pack-price]').forEach((el)=>{el.textContent=money(variant.price*Number(el.dataset.ecomsPackPrice));});
        const sticky=document.querySelector('[data-ecoms-sticky-price]'); if(sticky)sticky.textContent=money(variant.price);
      };
      const hiddenId=info.querySelector('form[action*="/cart/add"] [name="id"]');
      if(hiddenId){new MutationObserver(refresh).observe(hiddenId,{attributes:true,attributeFilter:['value']});}
      info.addEventListener('change',()=>requestAnimationFrame(refresh));
      refresh();
    });
    root.querySelectorAll('[data-ecoms-ends]:not([data-ecoms-counting])').forEach((el)=>{
      el.dataset.ecomsCounting='true';
      const end=Date.parse(el.dataset.ecomsEnds);
      if(!Number.isFinite(end))return;
      const label=el.querySelector('[data-ecoms-countdown]');
      let timer;
      const tick=()=>{
        const diff=end-Date.now();
        if(diff<=0){el.hidden=true;if(timer)clearInterval(timer);return;}
        el.hidden=false;
        const mins=Math.floor(diff/60000), hrs=Math.floor(mins/60),days=Math.floor(hrs/24);
        label.textContent=`${days}d ${String(hrs%24).padStart(2,'0')}h ${String(mins%60).padStart(2,'0')}m`;
      };
      tick();timer=setInterval(tick,60000);
    });
    const sticky=root.querySelector('[data-ecoms-sticky]');
    if(sticky&&!sticky.dataset.ecomsReady){
      sticky.dataset.ecomsReady='true';
      const buy=document.querySelector('product-info .product-form__submit');
      if(buy){
        const obs=new IntersectionObserver(([entry])=>{sticky.hidden=entry.isIntersecting||!buy.isConnected;},{threshold:0});obs.observe(buy);
        sticky.querySelector('[data-ecoms-scroll-buy]').addEventListener('click',()=>buy.scrollIntoView({behavior:'smooth',block:'center'}));
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init());else init();
  document.addEventListener('shopify:section:load', (e)=>init(e.target));
})();
