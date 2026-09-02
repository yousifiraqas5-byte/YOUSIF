import {
  saveShop,
  getShops,
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments,
  getRatings,
  getAllComments,
  saveRating,
  getCurrentUid,
  saveRecommendation,
  getUserRating
} from "./firebase.js?v=5";

console.log("🚗 CAR SYSTEM TEST");

// Ensure DOM is ready and elements exist before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("shopForm");
  const list = document.getElementById("shopsList");

  // تحويل وقت Firestore/تاريخ إلى مللي ثانية للمقارنة
  function timeToMillis(v) {
    if (!v) return 0;
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000;
    if (v instanceof Date) return v.getTime();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  // ==========================================
  // الضغطة المطوّلة على رقم الهاتف (اتصال / نسخ)
  // لا يوجد زر اتصال؛ فقط ضغطة مطوّلة على الرقم
  // ==========================================
  function attachPhoneLongPress(root) {
    if (!root) return;

    root.querySelectorAll(".shop-phone").forEach(el => {
      let startX = 0;
      let startY = 0;
      let pressed = false;
      let timer = null;

      const cancel = () => {
        pressed = false;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      el.addEventListener("pointerdown", (e) => {
        startX = e.clientX;
        startY = e.clientY;
        pressed = true;

        timer = setTimeout(() => {
          timer = null;
          if (pressed) showPhoneActions(el.dataset.phone, e);
        }, 600);
      });

      el.addEventListener("pointermove", (e) => {
        if (pressed && (Math.abs(e.clientX - startX) > 12 || Math.abs(e.clientY - startY) > 12)) {
          cancel();
        }
      });

      el.addEventListener("pointerup", cancel);
      el.addEventListener("pointercancel", cancel);
      el.addEventListener("pointerleave", cancel);

      // لسطح المكتب: الزر الأيمن يعرض نفس الخيارات
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        cancel();
        showPhoneActions(el.dataset.phone, e);
      });
    });
  }

  function showPhoneActions(phone, e) {
    closePhoneActions();

    const overlay = document.createElement("div");
    overlay.className = "phone-action-overlay";
    overlay.onclick = closePhoneActions;

    const panel = document.createElement("div");
    panel.className = "phone-action-panel";

    panel.innerHTML = `
      <div class="phone-action-title">📞 ${phone}</div>
      <button type="button" onclick="window.location.href='tel:${phone}'">📞 اتصال</button>
      <button type="button" onclick="copyPhone('${phone}')">📋 نسخ الرقم</button>
      <button type="button" class="phone-action-cancel" onclick="closePhoneActions()">إلغاء</button>
    `;

    const sheet = document.createElement("div");
    sheet.id = "phoneActionSheet";
    sheet.className = "phone-action-sheet";
    sheet.appendChild(overlay);
    sheet.appendChild(panel);

    document.body.appendChild(sheet);
  }

  window.closePhoneActions = function () {
    const sheet = document.getElementById("phoneActionSheet");
    if (sheet) sheet.remove();
  };

  window.copyPhone = async function (phone) {
    try {
      await navigator.clipboard.writeText(phone);
    } catch (err) {
      // بديل للمتصفحات التي لا تدعم الحافظة مباشرة
      const ta = document.createElement("textarea");
      ta.value = phone;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e2) { }
      document.body.removeChild(ta);
    }
    closePhoneActions();
    alert("✅ تم نسخ رقم الهاتف");
  };

  window.attachPhoneLongPress = attachPhoneLongPress;

  // نجوم التقييم أعلى يسار بطاقة المحل (ضغطة على نجمة = إرسال مباشر بدون زر)
  function starWidgetHTML(shopId) {
    const starList = [5, 4, 3, 2, 1].map(v =>
      `<span class="star" data-v="${v}" onclick="rateShop('${shopId}', ${v})"
         onmouseover="this.parentNode.querySelectorAll('.star').forEach(s=>{s.classList.toggle('hover',Number(s.dataset.v)<=${v})})"
         onmouseout="this.parentNode.querySelectorAll('.star').forEach(s=>s.classList.remove('hover'))">★</span>`
    ).join("");

    return `
      <span class="shop-rating-top">
        <span class="star-widget" id="star-widget-${shopId}">${starList}</span>
        <span class="rating-summary" id="rating-badge-${shopId}">⭐ 0.0 (0 تقييم)</span>
      </span>
    `;
  }

  // قسم التعليقات المشترك (يُستخدم في كل مكان يُعرض فيه محل) — التقييم من الأعلى فقط
  function renderReviewSection(shopId) {
    return `
      <hr>
      <div class="review-block">
        <h4>💬 التعليقات</h4>

        <div class="comments-list" id="comments-${shopId}">
          جارٍ تحميل التعليقات...
        </div>

        <div class="review-form" id="comment-form-${shopId}">
          <input
            type="text"
            id="cname-${shopId}"
            placeholder="اسمك">
          <div class="comment-input-row">
            <textarea
              id="comment-${shopId}"
              placeholder="اكتب تعليقك..."></textarea>
            <button
              type="button"
              class="comment-btn"
              onclick="sendComment('${shopId}')">
              إرسال
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async function loadShops() {
    if (!list) return;
    list.innerHTML = "";
    try {
      const shops = await getShops();
      if (!Array.isArray(shops) || shops.length === 0) {
        list.innerHTML = '<div class="no-registrations">لا توجد محلات حتى الآن</div>';
        return;
      }
      shops.forEach(shop => {
        list.innerHTML += `
        <div class="shop-card">
            <h3>${shop.shopName || ''}</h3>
            <p><b>الاختصاص:</b> ${shop.speciality || ''}</p>
            <p><b>المحافظة:</b> ${shop.city || ''}</p>
            <p><b>المنطقة:</b> ${shop.area || ''}</p>
            ${shop.phone
              ? `<p><b>📞 الهاتف:</b> <span class="shop-phone" data-phone="${shop.phone}">${shop.phone}</span></p>`
              : ''
            }
        </div>
        `;
      });
      attachPhoneLongPress(list);
    } catch (err) {
      console.error('loadShops error:', err);
      if (list) list.innerHTML = '<div class="no-registrations">حدث خطأ أثناء جلب المحلات</div>';
    }
  }

  // Load and render registrations so everyone visiting the page sees the registered shops
  const registrationsContainer = document.getElementById('registrationsList');

  async function loadRegistrations() {
    if (!registrationsContainer) return;

    registrationsContainer.innerHTML = "جارٍ تحميل المحلات...";

    try {
      const regs = await getRegistrations();

      // ترتيب حسب آخر نشاط: آخر إضافة أو محل صار فيه آخر تعليق يظهر أولاً عند التحديث
      const allComments = await getAllComments();
      const latestByShop = {};
      allComments.forEach(c => {
        const t = timeToMillis(c.createdAt);
        if (t > (latestByShop[c.shopId] || 0)) {
          latestByShop[c.shopId] = t;
        }
      });

      regs.forEach(r => {
        r.__lastActivity = Math.max(
          timeToMillis(r.createdAt),
          latestByShop[r.id] || 0
        );
      });

      regs.sort((a, b) => (b.__lastActivity || 0) - (a.__lastActivity || 0));

      if (!Array.isArray(regs) || regs.length === 0) {
        registrationsContainer.innerHTML =
          "لا توجد محلات مسجلة حتى الآن";
        return;
      }

      registrationsContainer.innerHTML = "";

      regs.forEach(r => {
        const typeLabel =
          r.regType === "seller"
            ? "🛒 بيع"
            : r.regType === "maintenance"
              ? "🔧 صيانة"
              : r.regType === "both"
                ? "🔧🛒 صيانة + بيع"
                : r.regType || "";

        registrationsContainer.innerHTML += `
        <div class="registration-card">

          <h3>
            <span class="shop-name">${r.name || r.shopName || "بدون اسم"}</span>
            ${starWidgetHTML(r.id)}
          </h3>

          <p>
            <strong>الفئة:</strong>
            ${typeLabel}
          </p>
<p>
  <strong>التخصصات:</strong>
  ${Array.isArray(r.specialties)
            ? r.specialties.join("، ")
            : (r.specialty || "غير محدد")
          }
</p>
          <p>
            <strong>المحافظة:</strong>
            ${r.city || ""}
          </p>

          <p>
            <strong>المنطقة:</strong>
            ${r.region || ""}
          </p>

          ${r.landmark
            ? `
                <p>
                  <strong>📍 أقرب نقطة دالة / الشارع:</strong>
                  ${r.landmark}
                </p>
              `
            : ""
          }

          ${r.phone
            ? `
                <p>
                  <strong>📞 الهاتف:</strong>
                  <span class="shop-phone" data-phone="${r.phone}">${r.phone}</span>
                  <small class="phone-hint">(ضغطة مطوّلة للاتصال / النسخ)</small>
                </p>
              `
            : ""
          }

          <p>
            <strong>أيام الدوام:</strong>
            ${r.workDays || "غير محدد"}
          </p>

          <p>
            <strong>أوقات الدوام:</strong>
            ${r.workHours || "غير محدد"}
          </p>

          ${r.mapLocation
            ? `
                <p>
                  <strong>🗺️ الموقع:</strong>
                  <a href="${r.mapLocation}" target="_blank">
                    فتح الموقع على الخريطة 📍
                  </a>
                </p>
              `
            : ""
          }

          ${r.description
            ? `
                <p>
                  <strong>📝 الوصف:</strong>
                  ${r.description}
                </p>
              `
            : ""
          }

          ${renderReviewSection(r.id)}

        </div>
      `;

        loadComments(r.id);
      });

      // تفعيل الضغطة المطوّلة على أرقام الهواتف
      attachPhoneLongPress(registrationsContainer);

    } catch (err) {
      console.error("loadRegistrations error:", err);

      registrationsContainer.innerHTML = `
      <div class="no-registrations">
        حدث خطأ أثناء جلب المحلات
      </div>
    `;
    }
  }

  // جعل loadRegistrations متاحة لباقي أجزاء البرنامج
  window.loadRegistrations = loadRegistrations;

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        shopName: document.getElementById("shopName")?.value || '',
        speciality: document.getElementById("speciality")?.value || '',
        city: document.getElementById("city")?.value || '',
        area: document.getElementById("area")?.value || '',
        phone: document.getElementById("phone")?.value || ''
      };

      try {
        console.log('Submitting shop:', data);
        const ok = await saveShop(data);
        console.log('saveShop result:', ok);
        if (ok) {
          alert("تم حفظ المحل");
          form.reset();
          loadShops();
          loadRegistrations(); // reload registrations view if shops are also shown there
        } else {
          alert('حدث خطأ أثناء حفظ المحل');
        }
      } catch (err) {
        console.error('Error saving shop:', err);
        alert('حدث خطأ غير متوقع');
      }
    });
  } else {
    console.log('shopForm not found — skipping shop form handlers');
  }


  // Load registrations so all visitors see them
  loadRegistrations();

  // --- Registration modal and form handling ---
  // فتح نموذج التسجيل مباشرة (بدون اختيار نوع مسبق)
  window.openModal = function () {
    const el = document.getElementById("registrationModal");
    if (el) el.classList.add("active");
  };

  // فتح نافذة ترشيح محل أو ورشة
  window.openRecommendModal = function () {
    const el = document.getElementById("recommendModal");
    if (el) el.classList.add("active");
  };

  // إغلاق نافذة ترشيح محل أو ورشة
  window.closeRecommendModal = function () {
    const el = document.getElementById("recommendModal");
    if (el) el.classList.remove("active");
  };

  // إرسال نموذج الترشيح
  const recommendForm = document.getElementById("recommendForm");
  if (recommendForm) {
    recommendForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        name: document.getElementById("recName")?.value.trim() || "",
        phone: document.getElementById("recPhone")?.value.trim() || "",
        city: document.getElementById("recCity")?.value.trim() || "",
        reason: document.getElementById("recReason")?.value.trim() || "",
        recommenderName: document.getElementById("recYourName")?.value.trim() || ""
      };

      try {
        const ok = await saveRecommendation(data);

        if (ok) {
          alert("شكرًا لك! تم إرسال ترشيحك وسنراجعه قريبًا 🙏");
          recommendForm.reset();
          window.closeRecommendModal();
        } else {
          alert("حدث خطأ أثناء إرسال الترشيح");
        }
      } catch (err) {
        console.error("Error saving recommendation:", err);
        alert("حدث خطأ غير متوقع");
      }
    });
  }

  // (أُزيل الاختيار المسبق للفئة — يختار المستخدم الفئة من القائمة داخل النموذج)
  // ================================
  // قائمة تخصصات الصيانة والبيع
  // ================================
  const maintenanceSpecialties = [
    "فني تبريد وتكييف",
    "كهربائي سيارات",
    "فيتر (ميكانيكي)",
    "حداد صدر",
    "سمكري",
    "صباغ سيارات",
    "ميزان وبالنص",
    "تبديل زيت وفلاتر",
    "صيانة إيرباك",
    "صيانة ABS",
    "بريكات (دسكات، فلنجات، سفايف)",
    "صيانة جير أوتوماتيك",
    "برمجة وفحص كمبيوتر",
    "بطاريات",
    "إطارات وبنجرجي",
    "تبديل زجاج",
    "صيانة رديتر",
    "عادم (إكزوزت)",
    "مفاتيح سيارات وبرمجة ريموت",
    "تلميع وحماية"
  ];
  const sellerSpecialties = [
    "قطع غيار سيارات",
    "إكسسوارات سيارات",
    "إطارات وبطاريات",
    "زيوت وفلاتر",
    "مكيفات سيارات",
    "كهربائيات سيارات",
    "أجهزة فحص وبرمجة",
    "أنظمة صوت وشاشات سيارات",
    "مواد تلميع وحماية",
    "قطع ومحلات متنوعة"
  ];
  // ==========================================
  // بيانات السيارات
  // ==========================================

  const carBrands = {

    "كوري": [
      "Hyundai - هيونداي",
      "Kia - كيا",
      "Genesis - جينيسس",
      "Daewoo - دايو"
    ],

    "أمريكي": [
      "Chevrolet - شفروليه",
      "Dodge - دودج",
      "GMC - جي إم سي",
      "Ford - فورد",
      "Jeep - جيب",
      "Cadillac - كاديلاك",
      "Chrysler - كرايسلر",
      "Lincoln - لينكولن",
      "Buick - بويك",
      "Tesla - تسلا"
    ],

    "ياباني": [
      "Toyota - تويوتا",
      "Lexus - لكزس",
      "Nissan - نيسان",
      "Infiniti - إنفينيتي",
      "Honda - هوندا",
      "Mazda - مازدا",
      "Mitsubishi - ميتسوبيشي",
      "Subaru - سوبارو",
      "Suzuki - سوزوكي",
      "Isuzu - إيسوزو"
    ],

    "ألماني": [
      "BMW - بي إم دبليو",
      "Mercedes-Benz - مرسيدس",
      "Audi - أودي",
      "Volkswagen - فولكس فاغن",
      "Porsche - بورشه",
      "Opel - أوبل"
    ],

    "صيني": [
      "Chery - شيري",
      "Geely - جيلي",
      "Changan - شانجان",
      "MG - إم جي",
      "Haval - هافال",
      "BYD - بي واي دي",
      "JAC - جاك",
      "Great Wall - جريت وول",
      "Jetour - جيتور",
      "GAC - جي أي سي",
      "BAIC - بايك",
      "Dongfeng - دونغفنغ"
    ],

    "فرنسي": [
      "Peugeot - بيجو",
      "Renault - رينو",
      "Citroën - سيتروين"
    ],

    "إيطالي": [
      "Fiat - فيات",
      "Alfa Romeo - ألفا روميو",
      "Maserati - مازيراتي",
      "Ferrari - فيراري",
      "Lamborghini - لامبورغيني"
    ],

    "بريطاني": [
      "Land Rover - لاند روفر",
      "Range Rover - رينج روفر",
      "Jaguar - جاكوار",
      "Bentley - بنتلي",
      "Rolls-Royce - رولز رويس",
      "Aston Martin - أستون مارتن",
      "Mini - ميني"
    ]
  };
  const carModels = {

    "Chevrolet - شفروليه": [
      "Impala - إمبالا",
      "Malibu - ماليبو",
      "Tahoe - تاهو",
      "Suburban - سوبربان",
      "Silverado - سيلفرادو",
      "Traverse - ترافرس",
      "Equinox - إكوينوكس",
      "Cruze - كروز",
      "Camaro - كامارو",
      "Corvette - كورفيت"
    ],

    "Dodge - دودج": [
      "Charger - تشارجر",
      "Challenger - تشالنجر",
      "Durango - دورانجو",
      "Journey - جورني",
      "Ram - رام"
    ],

    "GMC - جي إم سي": [
      "Yukon - يوكن",
      "Yukon XL - يوكن XL",
      "Sierra - سييرا",
      "Terrain - تيرين",
      "Acadia - أكاديا",
      "Canyon - كانيون"
    ],

    "Ford - فورد": [
      "F-150",
      "Explorer - إكسبلورر",
      "Expedition - إكسبديشن",
      "Escape - إسكيب",
      "Mustang - موستانج",
      "Edge - إيدج",
      "Bronco - برونكو"
    ],

    "Jeep - جيب": [
      "Grand Cherokee - جراند شيروكي",
      "Wrangler - رانجلر",
      "Cherokee - شيروكي",
      "Compass - كومباس",
      "Renegade - رينيجيد",
      "Gladiator - جلادياتور"
    ],

    "Hyundai - هيونداي": [
      "Elantra - إلنترا",
      "Sonata - سوناتا",
      "Accent - أكسنت",
      "Tucson - توسان",
      "Santa Fe - سانتا في",
      "Palisade - باليسيد",
      "Kona - كونا",
      "Azera - أزيرا"
    ],

    "Kia - كيا": [
      "Cerato - سيراتو",
      "K5 - كي 5",
      "Optima - أوبتيما",
      "Sportage - سبورتاج",
      "Sorento - سورينتو",
      "Telluride - تيلورايد",
      "Seltos - سيلتوس",
      "Rio - ريو"
    ],

    "Toyota - تويوتا": [
      "Camry - كامري",
      "Corolla - كورولا",
      "Land Cruiser - لاندكروزر",
      "Prado - برادو",
      "Hilux - هايلوكس",
      "RAV4 - راف فور",
      "Yaris - يارس",
      "Avalon - أفالون",
      "Fortuner - فورتشنر"
    ],

    "Nissan - نيسان": [
      "Altima - ألتيما",
      "Maxima - ماكسيما",
      "Sentra - سنترا",
      "Patrol - باترول",
      "X-Trail - إكس تريل",
      "Pathfinder - باثفايندر",
      "Kicks - كيكس",
      "370Z"
    ],

    "Honda - هوندا": [
      "Civic - سيفيك",
      "Accord - أكورد",
      "CR-V",
      "Pilot - بايلوت",
      "HR-V",
      "Odyssey - أوديسي"
    ],

    "BMW - بي إم دبليو": [
      "3 Series",
      "5 Series",
      "7 Series",
      "X1",
      "X3",
      "X5",
      "X6",
      "X7"
    ],

    "Mercedes-Benz - مرسيدس": [
      "C-Class",
      "E-Class",
      "S-Class",
      "A-Class",
      "GLC",
      "GLE",
      "GLS",
      "G-Class"
    ],

    "Audi - أودي": [
      "A3",
      "A4",
      "A6",
      "A8",
      "Q3",
      "Q5",
      "Q7",
      "Q8"
    ]
  };
  const carYears = [];

  for (let year = 2026; year >= 1990; year--) {
    carYears.push(String(year));
  }
  console.log("🚗 CAR SYSTEM LOADED");
  // ==========================================
  // تشغيل اختيار منشأ → شركة → موديل → سنة
  // ==========================================
  console.log("🚗 carOriginOptions:", document.getElementById("carOriginOptions"));
  console.log("🚗 carOriginGroup:", document.getElementById("carOriginGroup"));
  const carOriginOptions = document.getElementById("carOriginOptions");
  const carBrandGroup = document.getElementById("carBrandGroup");
  const carBrandOptions = document.getElementById("carBrandOptions");

  const carModelGroup = document.getElementById("carModelGroup");
  const carModelOptions = document.getElementById("carModelOptions");

  const carYearGroup = document.getElementById("carYearGroup");
  const carYearOptions = document.getElementById("carYearOptions");


  // عند اختيار منشأ السيارات
  if (carOriginOptions) {

    carOriginOptions.addEventListener("change", function () {

      const selectedOrigins = Array.from(
        document.querySelectorAll('input[name="carOrigins"]:checked')
      ).map(input => input.value);

      // تنظيف الشركات والموديلات والسنوات
      carBrandOptions.innerHTML = "";
      carModelOptions.innerHTML = "";
      carYearOptions.innerHTML = "";

      carModelGroup.style.display = "none";
      carYearGroup.style.display = "none";

      if (selectedOrigins.length === 0) {
        carBrandGroup.style.display = "none";
        return;
      }

      // جمع الشركات الخاصة بكل المناشئ المختارة
      let brands = [];

      selectedOrigins.forEach(origin => {

        if (carBrands[origin]) {
          brands.push(...carBrands[origin]);
        }

      });

      // إزالة التكرار
      brands = [...new Set(brands)];

      // إنشاء مربعات الشركات
      brands.forEach(brand => {

        const label = document.createElement("label");

        label.className = "specialty-checkbox";

        label.innerHTML = `
        <input
          type="checkbox"
          name="carBrands"
          value="${brand}"
        >
        <span>${brand}</span>
      `;

        carBrandOptions.appendChild(label);

      });

      carBrandGroup.style.display = "block";
    });
  }


  // عند اختيار الشركات
  if (carBrandOptions) {

    carBrandOptions.addEventListener("change", function () {

      const selectedBrands = Array.from(
        document.querySelectorAll('input[name="carBrands"]:checked')
      ).map(input => input.value);

      carModelOptions.innerHTML = "";
      carYearOptions.innerHTML = "";

      carYearGroup.style.display = "none";

      if (selectedBrands.length === 0) {
        carModelGroup.style.display = "none";
        return;
      }

      let models = [];

      selectedBrands.forEach(brand => {

        if (carModels[brand]) {
          models.push(...carModels[brand]);
        }

      });

      models = [...new Set(models)];

      models.forEach(model => {

        const label = document.createElement("label");

        label.className = "specialty-checkbox";

        label.innerHTML = `
        <input
          type="checkbox"
          name="carModels"
          value="${model}"
        >
        <span>${model}</span>
      `;

        carModelOptions.appendChild(label);

      });

      carModelGroup.style.display = "block";
    });
  }


  // عند اختيار الموديلات
  if (carModelOptions) {

    carModelOptions.addEventListener("change", function () {

      const selectedModels = Array.from(
        document.querySelectorAll('input[name="carModels"]:checked')
      );

      carYearOptions.innerHTML = "";

      if (selectedModels.length === 0) {
        carYearGroup.style.display = "none";
        return;
      }

      carYears.forEach(year => {

        const label = document.createElement("label");

        label.className = "specialty-checkbox";

        label.innerHTML = `
        <input
          type="checkbox"
          name="carYears"
          value="${year}"
        >
        <span>${year}</span>
      `;

        carYearOptions.appendChild(label);

      });

      carYearGroup.style.display = "block";
    });
  }
  const regTypeSelect = document.getElementById("regType");
  const specialtyGroup = document.getElementById("specialtyGroup");
  const specialtyOptions = document.getElementById("specialtyOptions");

  if (regTypeSelect && specialtyGroup && specialtyOptions) {

    regTypeSelect.addEventListener("change", function () {

      const type = this.value;

      specialtyOptions.innerHTML = "";

      let specialties = [];

      if (type === "maintenance") {

        specialties = maintenanceSpecialties;

      } else if (type === "seller") {

        specialties = sellerSpecialties;

      } else if (type === "both") {

        specialties = [
          ...maintenanceSpecialties,
          ...sellerSpecialties
        ];

      } else {

        specialtyGroup.style.display = "none";
        return;
      }

      specialties.forEach(item => {

        const label = document.createElement("label");
        label.className = "specialty-checkbox";

        label.innerHTML = `
        <input
          type="checkbox"
          name="specialties"
          value="${item}"
        >
        <span>${item}</span>
      `;

        specialtyOptions.appendChild(label);
      });

      specialtyGroup.style.display = "block";
    });
  }

  // إغلاق نافذة التسجيل
  window.closeModal = function () {
    const el = document.getElementById("registrationModal");
    if (el) el.classList.remove("active");
  };

  // ==========================================
  // حفظ التسجيلات
  // ==========================================

  const registrationForm = document.getElementById("registrationForm");

  if (registrationForm) {

    registrationForm.addEventListener("submit", async (e) => {

      e.preventDefault();

      try {

        // جمع التخصصات المختارة
        const selectedSpecialties = Array.from(
          document.querySelectorAll('input[name="specialties"]:checked')
        ).map(input => input.value);

        // بيانات التسجيل
        const data = {
          name: document.getElementById("name")?.value.trim() || "",
          phone: document.getElementById("phone")?.value.trim() || "",
          city: document.getElementById("city")?.value.trim() || "",
          region: document.getElementById("region")?.value.trim() || "",
          landmark: document.getElementById("landmark")?.value.trim() || "",
          regType: document.getElementById("regType")?.value || "",

          // نخزن التخصصات كـ Array
          specialties: selectedSpecialties,

          workDays: document.getElementById("workDays")?.value.trim() || "",
          workHours: document.getElementById("workHours")?.value.trim() || "",
          mapLocation: document.getElementById("mapLocation")?.value.trim() || "",
          description: document.getElementById("description")?.value.trim() || ""
        };

        console.log("📋 بيانات التسجيل:", data);

        // التحقق من البيانات الأساسية (الإجباري فقط: الاسم، المحافظة، المنطقة، الفئة)
        if (!data.name) {
          alert("يرجى إدخال اسم المحل");
          return;
        }

        if (!data.city) {
          alert("يرجى إدخال المحافظة");
          return;
        }

        if (!data.region) {
          alert("يرجى إدخال المنطقة");
          return;
        }

        if (!data.regType) {
          alert("يرجى اختيار الفئة");
          return;
        }

        // الحفظ في Firebase
        const ok = await saveRegistration(data);

        console.log("💾 نتيجة الحفظ:", ok);

        if (!ok) {
          alert("حدث خطأ أثناء الحفظ");
          return;
        }

        // نجاح
        alert("✅ تم حفظ التسجيل بنجاح");

        // تنظيف النموذج
        registrationForm.reset();

        // إخفاء التخصصات
        const specialtyGroup =
          document.getElementById("specialtyGroup");

        const specialtyOptions =
          document.getElementById("specialtyOptions");

        if (specialtyGroup) {
          specialtyGroup.style.display = "none";
        }

        if (specialtyOptions) {
          specialtyOptions.innerHTML = "";
        }

        // إغلاق النافذة
        const regModal =
          document.getElementById("registrationModal");

        if (regModal) {
          regModal.classList.remove("active");
        }

        // إعادة تحميل التسجيلات مباشرة
        await loadRegistrations();

      } catch (error) {

        console.error(
          "❌ Registration save error:",
          error
        );

        alert("حدث خطأ غير متوقع أثناء الحفظ");

      }

    });

  } else {

    console.error(
      "❌ registrationForm غير موجود"
    );

  }
  // إرسال تعليق (نص فقط، بلا حدود)
  window.sendComment = async function (shopId) {

    const name = document.getElementById(`cname-${shopId}`)?.value.trim() || "";
    const comment = document.getElementById(`comment-${shopId}`)?.value.trim() || "";

    if (!comment) {
      alert("اكتب تعليقك أولاً");
      return;
    }

    const ok = await saveComment({
      shopId,
      name: name || "مستخدم",
      comment
    });

    if (!ok) {
      alert("حدث خطأ أثناء الحفظ");
      return;
    }

    const commentBox = document.getElementById(`comment-${shopId}`);
    if (commentBox) commentBox.value = "";

    const nameBox = document.getElementById(`cname-${shopId}`);
    if (nameBox) nameBox.value = "";

    await loadComments(shopId);
  };

  // التقييم من أعلى البطاقة: ضغطة على نجمة تُرسل التقييم مباشرة (بدون زر إرسال)
  window.rateShop = async function (shopId, value) {
    const widget = document.getElementById(`star-widget-${shopId}`);
    const previous = widget && widget.dataset.userRating ? Number(widget.dataset.userRating) : null;
    const starsText = value === 1 ? 'نجمة' : 'نجوم';

    if (previous) {
      const ok = window.confirm(`أنت قيّمت هذا المحل مسبقاً بـ ${previous} ${previous === 1 ? 'نجمة' : 'نجوم'}.\nهل تريد تغيير تقييمك إلى ${value} ${starsText}؟`);
      if (!ok) return;
    }

    const result = await saveRating({
      shopId,
      rating: value
    });

    if (!result) {
      alert("حدث خطأ أثناء حفظ التقييم");
      return;
    }

    await loadComments(shopId);
  };

  // تحميل التقييمات (ملخص النجمة) والتعليقات النصية بشكل منفصل
  async function loadComments(shopId) {

    const ratingBadge = document.getElementById(`rating-badge-${shopId}`);
    const starWidget = document.getElementById(`star-widget-${shopId}`);
    const box = document.getElementById(`comments-${shopId}`);

    try {

      // 1) التقييمات: تُحسب من مجموعة ratings (مرة واحدة لكل مستخدم)
      const ratings = await getRatings(shopId);
      const ratingsList = Array.isArray(ratings) ? ratings : [];

      const votes = ratingsList.length;
      const average = votes
        ? ratingsList.reduce((sum, c) => sum + (Number(c.rating) || 0), 0) / votes
        : 0;

      const summaryText = `⭐ ${average.toFixed(1)} (${votes} تقييم)`;

      if (ratingBadge) ratingBadge.textContent = summaryText;

      // تلوين نجوم الأعلى حسب متوسط التقييم + تمييز من قام بالتقييم مسبقًا
      if (starWidget) {
        const userRating = await getUserRating(shopId);

        if (userRating) {
          starWidget.querySelectorAll(".star").forEach(s => {
            const val = Number(s.dataset.v) || 0;
            s.classList.toggle("selected", val <= userRating);
          });
          starWidget.classList.add("already-rated");
          starWidget.dataset.userRating = userRating;
          starWidget.title = `تقييمك الحالي: ${userRating} ${userRating === 1 ? 'نجمة' : 'نجوم'} (اضغط لتعديل)`;
          if (ratingBadge) ratingBadge.innerHTML = `${summaryText}<br><span class="my-rating-note">⭐ تقييمك: ${userRating} ${userRating === 1 ? 'نجمة' : 'نجوم'}</span>`;
        } else {
          const rounded = Math.round(average);
          starWidget.querySelectorAll(".star").forEach(s => {
            const val = Number(s.dataset.v) || 0;
            s.classList.toggle("selected", val <= rounded);
          });
          starWidget.classList.remove("already-rated");
          if (ratingBadge) ratingBadge.textContent = summaryText;
        }
      }

      // 2) التعليقات النصية: بلا حدود (أول تعليقين + عرض المزيد)
      const comments = await getComments(shopId);
      const list = Array.isArray(comments) ? comments : [];

      if (box) {
        if (list.length === 0) {
          box.innerHTML = `<p class="no-comments">لا توجد تعليقات بعد، كن أول من يكتب تعليقًا</p>`;
        } else {
          const renderOne = (c) => `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-name">${c.name || "مستخدم"}</span>
              </div>
              ${c.comment ? `<p class="comment-text">${c.comment}</p>` : ""}
            </div>
          `;

          const visible = list.slice(0, 2).map(renderOne).join("");
          const hidden = list.slice(2).map(renderOne).join("");

          box.innerHTML = `
            <div class="comments-visible">${visible}</div>
            ${hidden
              ? `<div class="comments-hidden" style="display:none;">${hidden}</div>
                 <button type="button" class="show-more-comments">عرض المزيد (${list.length - 2}+)</button>`
              : ""
            }
          `;

          const moreBtn = box.querySelector(".show-more-comments");
          if (moreBtn) {
            moreBtn.addEventListener("click", () => {
              const hiddenBox = box.querySelector(".comments-hidden");
              if (hiddenBox) hiddenBox.style.display = "block";
              moreBtn.style.display = "none";
            });
          }
        }
      }

    } catch (err) {
      console.error("loadComments error:", err);
      if (box) box.innerHTML = `<p class="no-comments">تعذّر تحميل التعليقات</p>`;
    }
  }


  // ================================
  // فتح قسم الصيانة أو المبيعات
  // ================================
  // ================================
  // فتح قسم الصيانة أو المبيعات
  // ================================
  // ==========================================
  // حساب عدد المحلات لكل فئة وتخصص
  // ==========================================
  async function updateCategoryCounts(type) {
    try {
      const regs = await getRegistrations();

      // عدد جميع المحلات ضمن القسم
      const totalCount = regs.filter(r =>
        r.regType === type || r.regType === "both"
      ).length;

      // تحديث عنوان القسم
      const title = document.querySelector(".section-title");

      if (title) {
        const titleText =
          type === "maintenance"
            ? "🔧 خدمات الصيانة"
            : "🛒 فئات المبيعات";

        title.innerHTML = `
        ${titleText}
        <span class="main-category-count">${totalCount}</span>
      `;
      }

      // تحديث عدد المحلات لكل تخصص
      const cards = document.querySelectorAll(".specialty-row");

      cards.forEach(card => {

        const onclick = card.getAttribute("onclick") || "";

        // استخراج اسم التخصص من showCategoryRegistrations
        const match = onclick.match(
          /showCategoryRegistrations\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
        );

        if (!match) return;

        const specialty = match[1];
        const count = regs.filter(r =>
          (r.regType === type || r.regType === "both") &&
          (
            Array.isArray(r.specialties)
              ? r.specialties.includes(specialty)
              : Array.isArray(r.specialty)
                ? r.specialty.includes(specialty)
                : String(r.specialty || "").trim() === String(specialty || "").trim()
          )
        ).length;

        const countElement = card.querySelector(".specialty-count");

        if (countElement) {
          countElement.textContent = count;
        }
      });
    } catch (error) {
      console.error("updateCategoryCounts error:", error);
    }
  }
  window.openCategory = function (type) {

    const title = document.querySelector(".section-title");
    const grid = document.querySelector(".category-grid");
    const backButton = document.getElementById("backToHome");

    if (backButton) {
      backButton.style.display = "block";

      backButton.onclick = function () {
        title.textContent = "الأقسام";

        grid.innerHTML = `
      <div
        class="category-tile"
        onclick="openCategory('maintenance')"
      >
        <div class="category-icon maintenance-icon">
          🔧
        </div>
        <h3>الصيانة</h3>
        <p>خدمات الصيانة والإصلاح</p>
      </div>

      <div
        class="category-tile"
        onclick="openCategory('seller')"
      >
        <div class="category-icon sales-icon">
          🛒
        </div>
        <h3>المبيعات</h3>
        <p>المحلات والبائعين</p>
      </div>
    `;

        grid.classList.remove("specialty-list");
        backButton.style.display = "none";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      };
    }
    if (!title || !grid) {
      console.error("category elements not found");
      return;
    }

    if (type === "maintenance") {

      title.textContent = "🔧 خدمات الصيانة";
      grid.classList.add("specialty-list");

      grid.innerHTML = `

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'فني تبريد وتكييف')">
        <span class="specialty-icon">❄️</span>
        <span class="specialty-name">فني تبريد وتكييف</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'كهربائي سيارات')">
        <span class="specialty-icon">⚡</span>
        <span class="specialty-name">كهربائي سيارات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'فيتر (ميكانيكي)')">
        <span class="specialty-icon">🔧</span>
        <span class="specialty-name">فيتر (ميكانيكي)</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'حداد صدر')">
        <span class="specialty-icon">🔨</span>
        <span class="specialty-name">حداد صدر</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'سمكري')">
        <span class="specialty-icon">🚗</span>
        <span class="specialty-name">سمكري</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'صباغ سيارات')">
        <span class="specialty-icon">🎨</span>
        <span class="specialty-name">صباغ سيارات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'ميزان وبالنص')">
        <span class="specialty-icon">⚙️</span>
        <span class="specialty-name">ميزان وبالنص</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'تبديل زيت وفلاتر')">
        <span class="specialty-icon">🛢️</span>
        <span class="specialty-name">تبديل زيت وفلاتر</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'صيانة إيرباك')">
        <span class="specialty-icon">🛡️</span>
        <span class="specialty-name">صيانة إيرباك</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'صيانة ABS')">
        <span class="specialty-icon">🚨</span>
        <span class="specialty-name">صيانة ABS</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'بريكات (دسكات، فلنجات، سفايف)')">
        <span class="specialty-icon">🛞</span>
        <span class="specialty-name">بريكات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'صيانة جير أوتوماتيك')">
        <span class="specialty-icon">⚙️</span>
        <span class="specialty-name">صيانة جير أوتوماتيك</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'برمجة وفحص كمبيوتر')">
        <span class="specialty-icon">💻</span>
        <span class="specialty-name">برمجة وفحص كمبيوتر</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'بطاريات')">
        <span class="specialty-icon">🔋</span>
        <span class="specialty-name">بطاريات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'إطارات وبنجرجي')">
        <span class="specialty-icon">🛞</span>
        <span class="specialty-name">إطارات وبنجرجي</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'تبديل زجاج')">
        <span class="specialty-icon">🪟</span>
        <span class="specialty-name">تبديل زجاج</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'صيانة رديتر')">
        <span class="specialty-icon">🌡️</span>
        <span class="specialty-name">صيانة رديتر</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'عادم (إكزوزت)')">
        <span class="specialty-icon">🔧</span>
        <span class="specialty-name">عادم (إكزوزت)</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'مفاتيح سيارات وبرمجة ريموت')">
        <span class="specialty-icon">🔑</span>
        <span class="specialty-name">مفاتيح وبرمجة ريموت</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('maintenance', 'تلميع وحماية')">
        <span class="specialty-icon">✨</span>
        <span class="specialty-name">تلميع وحماية</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

    `;

    } else if (type === "seller") {

      title.textContent = "🛒 فئات المبيعات";
      grid.classList.add("specialty-list");

      grid.innerHTML = `

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'قطع غيار أصلية')">
        <span class="specialty-icon">🔩</span>
        <span class="specialty-name">قطع غيار أصلية</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'قطع غيار تجارية')">
        <span class="specialty-icon">🔧</span>
        <span class="specialty-name">قطع غيار تجارية</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'إكسسوارات')">
        <span class="specialty-icon">🚗</span>
        <span class="specialty-name">إكسسوارات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'زيوت')">
        <span class="specialty-icon">🛢️</span>
        <span class="specialty-name">زيوت</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'بطاريات')">
        <span class="specialty-icon">🔋</span>
        <span class="specialty-name">بطاريات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'إطارات')">
        <span class="specialty-icon">🛞</span>
        <span class="specialty-name">إطارات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'جنوط')">
        <span class="specialty-icon">⚙️</span>
        <span class="specialty-name">جنوط</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'إنارة')">
        <span class="specialty-icon">💡</span>
        <span class="specialty-name">إنارة</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'أجهزة فحص')">
        <span class="specialty-icon">💻</span>
        <span class="specialty-name">أجهزة فحص</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

      <div class="specialty-row"
           onclick="showCategoryRegistrations('seller', 'مكيفات سيارات')">
        <span class="specialty-icon">❄️</span>
        <span class="specialty-name">مكيفات سيارات</span>
        <span class="specialty-count">0</span>
        <span class="specialty-arrow">‹</span>
      </div>

`;

    }

    // تحديث عدد المحلات لكل تخصص (يعمل الآن لقسمي الصيانة والمبيعات)
    updateCategoryCounts(type);
  };

    // ==========================================
    // فتح صفحة مستقلة (تخفي الصفحة الرئيسية وتعرض المحتوى بملء الشاشة)
    // ==========================================
    function openAsFullPage() {

      const homePage = document.querySelector(".container");
      const registrationsList = document.getElementById("registrationsList");

      if (!registrationsList) return;

      // إخراج صفحة المحلات من داخل الصفحة الرئيسية
      document.body.appendChild(registrationsList);

      // إخفاء الصفحة الرئيسية
      if (homePage) {
        homePage.style.display = "none";
      }

      // إظهار صفحة المحلات
      registrationsList.style.display = "block";
      registrationsList.style.minHeight = "100vh";
      registrationsList.style.padding = "20px";
      registrationsList.style.boxSizing = "border-box";

      // زر الرجوع
      let backButton = document.getElementById("registrationsBackButton");

      if (!backButton) {

        backButton = document.createElement("button");

        backButton.id = "registrationsBackButton";

        backButton.innerHTML = "⬅️ رجوع";

        backButton.style.cssText = `
      display:block;
      width:100%;
      max-width:390px;
      margin:0 auto 20px auto;
      padding:14px;
      border:none;
      border-radius:15px;
      font-size:17px;
      font-weight:bold;
      cursor:pointer;
    `;

        backButton.onclick = function () {

          registrationsList.style.display = "none";

          // إعادة صفحة المحلات إلى الصفحة الرئيسية
          if (homePage) {
            homePage.appendChild(registrationsList);
            homePage.style.display = "";
          }

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        };

        registrationsList.prepend(backButton);
      } else {
        // تأكد إن زر الرجوع يبقى أول عنصر بالصفحة
        registrationsList.prepend(backButton);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    // ==========================================
    // عرض المحلات ضمن تخصص فرعي معيّن
    // ==========================================
    window.showCategoryRegistrations = async function (type, specialty) {

      const container = document.getElementById("registrationsList");

      if (!container) return;

      container.innerHTML = "🔍 جارٍ التحميل...";

      // افتح الصفحة كاملة فوراً عشان الصفحة الرئيسية تنتهي وتظهر صفحة جديدة
      openAsFullPage();

      try {

        const regs = await getRegistrations();

        const results = regs.filter(r => {

          if (r.regType !== type && r.regType !== "both") return false;

          if (Array.isArray(r.specialties)) {
            return r.specialties.includes(specialty);
          }

          if (Array.isArray(r.specialty)) {
            return r.specialty.includes(specialty);
          }

          return String(r.specialty || "").trim() === String(specialty || "").trim();
        });

        if (results.length === 0) {

          container.innerHTML = `
          <div class="no-registrations">
            لا توجد محلات مسجلة ضمن:
            <strong>${specialty}</strong>
          </div>
        `;

          openAsFullPage();

          return;
        }

        container.innerHTML = "";

        results.forEach(r => {

          const typeLabel =
            r.regType === "seller"
              ? "🛒 بيع"
              : r.regType === "maintenance"
                ? "🔧 صيانة"
                : r.regType === "both"
                  ? "🔧🛒 صيانة + بيع"
                  : r.regType || "";

          const specialties = Array.isArray(r.specialties)
            ? r.specialties.join("، ")
            : (r.specialty || "غير محدد");

          container.innerHTML += `
          <div class="registration-card">

            <h3>
              <span class="shop-name">${r.name || r.shopName || "بدون اسم"}</span>
              ${starWidgetHTML(r.id)}
            </h3>

            <p>
              <strong>الفئة:</strong>
              ${typeLabel}
            </p>

            <p>
              <strong>التخصصات:</strong>
              ${specialties}
            </p>

            <p>
              <strong>المحافظة:</strong>
              ${r.city || ""}
            </p>

            <p>
              <strong>المنطقة:</strong>
              ${r.region || ""}
            </p>

            ${r.landmark
              ? `
                <p>
                  <strong>📍 أقرب نقطة دالة / الشارع:</strong>
                  ${r.landmark}
                </p>
              `
              : ""
            }

            ${r.phone
              ? `
                <p>
                  <strong>📞 الهاتف:</strong>
                  <span class="shop-phone" data-phone="${r.phone}">${r.phone}</span>
                  <small class="phone-hint">(ضغطة مطوّلة للاتصال / النسخ)</small>
                </p>
              `
              : ""
            }

            ${r.mapLocation
              ? `
                <p>
                  <strong>🗺️ الموقع:</strong>
                  <a href="${r.mapLocation}" target="_blank">
                    فتح الموقع على الخريطة 📍
                  </a>
                </p>
              `
              : ""
            }

            ${renderReviewSection(r.id)}

          </div>
        `;
        });

        results.forEach(r => loadComments(r.id));

        // تفعيل الضغطة المطوّلة على أرقام الهواتف
        attachPhoneLongPress(container);

        openAsFullPage();

      } catch (error) {

        console.error("showCategoryRegistrations error:", error);

        container.innerHTML = `
        <div class="no-registrations">
          حدث خطأ أثناء جلب المحلات
        </div>
      `;
      }
    };

    // ==========================================
    // القائمة الجانبية
    // ==========================================

    const menuButton = document.getElementById("menuButton");
    const sideMenu = document.getElementById("sideMenu");
    const menuClose = document.getElementById("menuClose");
    const menuOverlay = document.getElementById("menuOverlay");

    function openMenu() {
      sideMenu.classList.add("active");
      menuOverlay.classList.add("active");
    }

    function closeMenu() {
      sideMenu.classList.remove("active");
      menuOverlay.classList.remove("active");
    }

    if (menuButton) {
      menuButton.addEventListener("click", openMenu);
    }

    if (menuClose) {
      menuClose.addEventListener("click", closeMenu);
    }

    if (menuOverlay) {
      menuOverlay.addEventListener("click", closeMenu);
    }


    // الصفحة الرئيسية
    window.goToHome = function () {
      closeMenu();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }


    // الشكاوي
    window.goToComplaints = function () {
      closeMenu();

      alert("قسم الشكاوي سيتم تفعيله لاحقاً");
    }


    // من نحن
    window.goToAbout = function () {
      closeMenu();

      alert("صفحة من نحن سيتم إعدادها لاحقاً");
    }


    // اتصل بنا
    window.goToContact = function () {
      closeMenu();

      alert("صفحة اتصل بنا سيتم إعدادها لاحقاً");
    }


    // تسجيل الدخول
    window.login = function () {
      closeMenu();

      alert("تسجيل الدخول سيتم تفعيله لاحقاً");
    }

    // ==========================================
    // 🔍 البحث عن المحلات والخدمات
    // ==========================================

    const searchInput = document.getElementById("searchInput");

    if (searchInput) {

      searchInput.addEventListener("input", async function () {

        const searchText = this.value.trim().toLowerCase();

        const container = document.getElementById("registrationsList");

        if (!container) return;

        // إذا البحث فارغ نرجع للصفحة الرئيسية
        if (searchText === "") {
          container.style.display = "none";
          return;
        }

        container.style.display = "block";
        container.innerHTML = "🔍 جارٍ البحث...";

        try {

          const regs = await getRegistrations();

          const results = regs.filter(r => {

            const specialties = Array.isArray(r.specialties)
              ? r.specialties.join(" ")
              : String(r.specialty || "");

            const text = [
              r.name,
              r.shopName,
              r.phone,
              r.city,
              r.region,
              r.landmark,
              r.workDays,
              r.workHours,
              r.description,
              specialties
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return text.includes(searchText);
          });

          if (results.length === 0) {

            container.innerHTML = `
          <div class="no-registrations">
            لا توجد نتائج للبحث عن:
            <strong>${this.value}</strong>
          </div>
        `;

            return;
          }

          // عرض النتائج
          container.innerHTML = "";

          results.forEach(r => {

            const typeLabel =
              r.regType === "seller"
                ? "🛒 بيع"
                : r.regType === "maintenance"
                  ? "🔧 صيانة"
                  : r.regType === "both"
                    ? "🔧🛒 صيانة + بيع"
                    : r.regType || "";

            const specialties = Array.isArray(r.specialties)
              ? r.specialties.join("، ")
              : (r.specialty || "غير محدد");

            container.innerHTML += `
          <div class="registration-card">

            <h3>
              <span class="shop-name">${r.name || r.shopName || "بدون اسم"}</span>
              ${starWidgetHTML(r.id)}
            </h3>

            <p>
              <strong>الفئة:</strong>
              ${typeLabel}
            </p>

            <p>
              <strong>التخصصات:</strong>
              ${specialties}
            </p>

            <p>
              <strong>المحافظة:</strong>
              ${r.city || ""}
            </p>

            <p>
              <strong>المنطقة:</strong>
              ${r.region || ""}
            </p>

            ${r.landmark
              ? `
                <p>
                  <strong>📍 أقرب نقطة دالة / الشارع:</strong>
                  ${r.landmark}
                </p>
              `
              : ""
            }

            ${r.phone
              ? `
                <p>
                  <strong>📞 الهاتف:</strong>
                  <span class="shop-phone" data-phone="${r.phone}">${r.phone}</span>
                  <small class="phone-hint">(ضغطة مطوّلة للاتصال / النسخ)</small>
                </p>
              `
              : ""
            }

            ${r.mapLocation
                ? `
                  <p>
                    <strong>🗺️ الموقع:</strong>
                    <a href="${r.mapLocation}" target="_blank">
                      فتح الموقع على الخريطة 📍
                    </a>
                  </p>
                `
                : ""
              }

            ${renderReviewSection(r.id)}

          </div>
        `;
          });

          results.forEach(r => loadComments(r.id));

          // تفعيل الضغطة المطوّلة على أرقام الهواتف
          attachPhoneLongPress(container);

          container.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        } catch (error) {

          console.error("Search error:", error);

          container.innerHTML = `
        <div class="no-registrations">
          حدث خطأ أثناء البحث
        </div>
      `;
        }

            });
    }
    // ==========================================
    // صفحة مستقلة لعرض المحلات
    // ==========================================

    window.openRegistrationsPage = function () {
      // تحميل قائمة المحلات (بترتيب آخر النشاطات) ثم فتحها كصفحة مستقلة
      loadRegistrations().then(() => openAsFullPage());
    };

    });