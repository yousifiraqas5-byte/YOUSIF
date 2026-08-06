// Simple carousel logic
(function(){
  const slides = document.querySelectorAll('.slide');
  const slidesContainer = document.querySelector('.slides');
  const dotsWrap = document.getElementById('dots');
  let current = 0;
  const total = slides.length;

  // create dots
  for(let i=0;i<total;i++){
    const btn = document.createElement('button');
    if(i===0) btn.classList.add('active');
    btn.addEventListener('click', ()=>{goTo(i)});
    dotsWrap.appendChild(btn);
  }
  const dots = Array.from(dotsWrap.children);

  function update(){
    const w = slidesContainer.clientWidth;
    slidesContainer.style.transform = `translateX(-${current * w}px)`;
    dots.forEach((d,idx)=> d.classList.toggle('active', idx===current));
  }

  function goTo(i){
    current = i;
    update();
  }

  // auto-play
  let timer = setInterval(()=> {
    current = (current + 1) % total;
    update();
  }, 3500);

  // pause on hover (mobile irrelevant but safe)
  slidesContainer.addEventListener('mouseenter', ()=> clearInterval(timer));
  slidesContainer.addEventListener('mouseleave', ()=> {
    timer = setInterval(()=> {
      current = (current + 1) % total;
      update();
    }, 3500);
  });

  // handle resize
  window.addEventListener('resize', update);

  // init: wrap slides horizontally
  (function initSlides(){
    slidesContainer.style.display = 'flex';
    slidesContainer.style.width = `${total * 100}%`;
    slides.forEach(s => { s.style.width = `${100/total}%`; });
    update();
  })();
})();
