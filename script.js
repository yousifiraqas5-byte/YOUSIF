import {
  saveShop,
  getShops,
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments,
  saveRating,
  getRatings,
  getRatingStats,
  getCurrentUid,
  saveRecommendation
} from "./firebase.js?v=3";

console.log("🚗 CAR SYSTEM TEST");

// Ensure DOM is ready and elements exist before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("shopForm");
  const list = document.getElementById("shopsList");

  // قسم التقييمات والتعليقات المشترك (يُستخدم في كل مكان يُعرض فيه محل)
  // الآن منفصل: تقييمات (نجوم فقط) + تعليقات (نص منفصل)
  function renderReviewSection(shopId) {
    return `
      <hr>
      <h4>⭐ التقييمات والتعليقات</h4>

      <!-- قسم التقييمات (نجوم فقط) -->
      <div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-bottom:16px;">
        <h5 style="margin-top:0;margin-bottom:8px;">📊 التقييمات</h5>
        <div class="rating-summary" id="rating-summary-${shopId}" style="font-size:16px;font-weight:bold;">
          ⭐ 0.0 (0 تقييم)
        </div>
        <div style="margin-top:8px;">
          <label for="rating-${shopId}" style="font-size:13px;color:#666;">اختر تقييمك:</label>
          <select id="rating-${shopId}" style="width:100%;padding:8px;margin-top:4px;border-radius:4px;border:1px solid #ddd;">
            <option value="">-- اختر التقييم --</option>
            <option value="5">⭐⭐⭐⭐⭐ ممتاز جداً</option>
            <option value="4">⭐⭐⭐⭐ ممتاز</option>
            <option value="3">⭐⭐⭐ جيد</option>
            <option value="2">⭐⭐ مقبول</option>
            <option value="1">⭐ سيء</option>
          </select>
        </div>
        <button 
          class="comment-btn" 
          onclick="sendRating('${shopId}')"
          style="width:100%;margin-top:8px;padding:10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">
          ✅ حفظ التقييم
        </button>
      </div>

      <!-- قسم التعليقات (منفصل تماماً) -->
      <div style="background:#fff9e6;padding:12px;border-radius:8px;margin-bottom:16px;border-right:3px solid #ffc107;">
        <h5 style="margin-top:0;margin-bottom:8px;">💬 التعليقات</h5>
        <div class="comments-list" id="comments-${shopId}" style="max-height:250px;overflow-y:auto;margin-bottom:12px;">
          جارٍ تحميل التعليقات...
        </div>
        
        <div class="review-form">
          <textarea
            id="comment-${shopId}"
            placeholder="اكتب تعليقك هنا (اختياري)..."
            style="width:100%;padding:8px;border-radius:4px;border:1px solid #ddd;resize:vertical;height:70px;"></textarea>
          <button
            class="comment-btn"
            onclick="sendComment('${shopId}')"
            style="width:100%;margin-top:8px;padding:10px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;">
            💬 إضافة تعليق
          </button>
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
            <p><b>الهاتف:</b> ${shop.phone || ''}</p>
            <a href="tel:${shop.phone || ''}">
                <button>اتصال</button>
            </a>
        </div>
        `;
      });
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
  ${r.name || r.shopName || "بدون اسم"}
  <span class="rating-summary" id="rating-badge-${r.id}">
    ⭐ 0.0 (0 تقييم)
  </span>
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

          <p>
            <strong>الهاتف:</strong>
            ${r.phone || ""}
          </p>

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

          <a href="tel:${r.phone || ""}">
            <button>📞 اتصال</button>
          </a>

          ${renderReviewSection(r.id)}

        </div>
      `;

        loadComments(r.id);
      });

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
  // فتح نافذة اختيار نوع التسجيل
  window.openModal = function () {
    const el = document.getElementById("typeModal");
    if (el) el.classList.add("active");
  };

  // إغلاق نافذة اختيار النوع
  window.closeTypeModal = function () {
    const el = document.getElementById("typeModal");
    if (el) el.classList.remove("active");
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

  // اختيار بائع أو صيانة
  window.selectRegistrationType = function (type) {
    const typeEl = document.getElementById("typeModal");
    if (typeEl) typeEl.classList.remove("active");

    const regType = document.getElementById("regType");
    if (regType) {
      regType.value = type;
    }

    const regModal = document.getElementById("registrationModal");
    if (regModal) regModal.classList.add("active");
  };
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
          city: document.getElementById("city")?.value.trim() || "",
          region: document.getElementById("region")?.value.trim() || "",
          street: document.getElementById("street")?.value.trim() || "",
          phone: document.getElementById("phone")?.value.trim() || "",
          regType: document.getElementById("regType")?.value || "",

          // نخزن التخصصات كـ Array
          specialties: selectedSpecialties,

          workDays: document.getElementById("workDays")?.value.trim() || "",
          workHours: document.getElementById("workHours")?.value.trim() || "",
          mapLocation: document.getElementById("mapLocation")?.value.trim() || "",
          description: document.getElementById("description")?.value.trim() || ""
        };

        console.log("📋 بيانات التسجيل:", data);

        // التحقق من الحقول الإجبارية
        if (!data.name || data.name.length === 0) {
          alert("❌ يرجى إدخال اسم المحل (حقل إجباري)");
          return;
        }

        if (!data.city || data.city.length === 0) {
          alert("❌ يرجى إدخال المحافظة (حقل إجباري)");
          return;
        }

        if (!data.region || data.region.length === 0) {
          alert("❌ يرجى إدخال المدينة/المنطقة (حقل إجباري)");
          return;
        }

        if (!data.regType || data.regType.length === 0) {
          alert("❌ يرجى اختيار الفئة (حقل إجباري)");
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
  // إرسال تقييم (نجوم فقط - تقييم واحد لكل مستخدم)
  window.sendRating = async function (shopId) {
    try {
      const ratingSelect = document.getElementById(`rating-${shopId}`);
      if (!ratingSelect || !ratingSelect.value) {
        alert("يرجى اختيار تقييم");
        return;
      }

      const ratingValue = ratingSelect.value;
      
      const ok = await saveRating(shopId, ratingValue);

      if (!ok) {
        alert("حدث خطأ أثناء حفظ التقييم");
        return;
      }

      alert("✅ شكراً لتقييمك");
      ratingSelect.value = "";

      // إعادة تحميل التقييمات والتعليقات
      await loadRatings(shopId);
      await loadComments(shopId);

    } catch (err) {
      console.error("sendRating error:", err);
      alert("حدث خطأ أثناء حفظ التقييم");
    }
  };

  // إرسال تعليق (نص فقط - بدون تقييم، غير محدود)
  window.sendComment = async function (shopId) {
    try {
      const commentInput = document.getElementById(`comment-${shopId}`);
      if (!commentInput) return;

      const commentText = commentInput.value.trim();
      
      if (!commentText) {
        alert("يرجى كتابة تعليق");
        return;
      }

      const ok = await saveComment(shopId, commentText);

      if (!ok) {
        alert("حدث خطأ أثناء حفظ التعليق");
        return;
      }

      alert("✅ شكراً لتعليقك");
      commentInput.value = "";

      // إعادة تحميل التعليقات
      await loadComments(shopId);

    } catch (err) {
      console.error("sendComment error:", err);
      alert("حدث خطأ أثناء حفظ التعليق");
    }
  };

  // تحميل وعرض التقييمات (نجوم فقط)
  async function loadRatings(shopId) {
    const ratingBox = document.getElementById(`rating-summary-${shopId}`);

    try {
      const stats = await getRatingStats(shopId);
      
      if (ratingBox) {
        const summaryText = `⭐ ${stats.average.toFixed(1)} (${stats.votes} تقييم)`;
        ratingBox.textContent = summaryText;
      }

    } catch (err) {
      console.error("loadRatings error:", err);
      if (ratingBox) ratingBox.textContent = "⭐ لا توجد تقييمات";
    }
  }

  // تحميل وعرض التعليقات (نص فقط - منفصل عن التقييمات)
  async function loadComments(shopId) {
    const box = document.getElementById(`comments-${shopId}`);

    try {
      const commentsList = await getComments(shopId);
      const list = Array.isArray(commentsList) ? commentsList : [];

      if (!box) return;

      if (list.length === 0) {
        box.innerHTML = `<p style="color:#999;font-size:13px;">لا توجد تعليقات بعد</p>`;
      } else {
        const renderOne = (c) => `
          <div style="background:#fff;padding:10px;border-radius:4px;margin-bottom:8px;border-right:2px solid #ffc107;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <strong style="font-size:13px;color:#333;">${c.uid ? "مستخدم" : "زائر"}</strong>
              <span style="font-size:11px;color:#999;">${new Date(c.createdAt?.toDate?.() || c.createdAt).toLocaleDateString('ar-IQ')}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.4;">${c.text}</p>
          </div>
        `;

        const visible = list.slice(0, 3).map(renderOne).join("");
        const hidden = list.slice(3).map(renderOne).join("");

        box.innerHTML = `
          <div>${visible}</div>
          ${hidden
            ? `<div class="comments-hidden" style="display:none;margin-top:8px;">${hidden}</div>
               <button type="button" class="show-more-comments" style="width:100%;padding:8px;background:#ffc107;border:none;border-radius:4px;cursor:pointer;font-size:12px;margin-top:8px;">عرض المزيد (${list.length - 3}+)</button>`
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

    } catch (err) {
      console.error("loadComments error:", err);
      if (box) box.innerHTML = `<p style="color:#d32f2f;font-size:13px;">تعذّر تحميل التعليقات</p>`;
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
              ${r.name || r.shopName || "بدون اسم"}
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

            <p>
              <strong>الهاتف:</strong>
              ${r.phone || ""}
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

            <a href="tel:${r.phone || ""}">
              <button>📞 اتصال</button>
            </a>

            ${renderReviewSection(r.id)}

          </div>
        `;
        });

        results.forEach(r => loadComments(r.id));

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

    // تصفح المحلات - الذهاب إلى صفحة التصفح الجديدة
    window.goToShopsDirectory = function () {
      closeMenu();
      window.location.href = "registrations.html";
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
              ${r.name || r.shopName || "بدون اسم"}
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

            <p>
              <strong>الهاتف:</strong>
              ${r.phone || ""}
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

            <a href="tel:${r.phone || ""}">
              <button>📞 اتصال</button>
            </a>

            ${renderReviewSection(r.id)}

          </div>
        `;
          });

          results.forEach(r => loadComments(r.id));

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
      openAsFullPage();
    };

    });