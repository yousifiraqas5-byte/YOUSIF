import {
  saveShop,
  getShops,
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments,
  getRatingStats
} from "./firebase.js?v=3";

console.log("🚗 CAR SYSTEM TEST");

// Ensure DOM is ready and elements exist before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("shopForm");
  const list = document.getElementById("shopsList");

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

          <hr>
<h4>💬 التقييمات والتعليقات</h4>

<div
  class="rating-summary"
  id="rating-summary-${r.id}">
  ⭐ 0.0 (0 تقييم)
</div>

<input
  type="text"
  id="name-${r.id}"
  placeholder="اسمك">
          <textarea
            id="comment-${r.id}"
            placeholder="اكتب تعليقك..."></textarea>

          <select id="rating-${r.id}">
            <option value="5">⭐⭐⭐⭐⭐</option>
            <option value="4">⭐⭐⭐⭐</option>
            <option value="3">⭐⭐⭐</option>
            <option value="2">⭐⭐</option>
            <option value="1">⭐</option>
          </select>

          <button
            class="comment-btn"
            onclick="sendComment('${r.id}')">
            إرسال التقييم
          </button>

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
          phone: document.getElementById("phone")?.value.trim() || "",
          city: document.getElementById("city")?.value.trim() || "",
          region: document.getElementById("region")?.value.trim() || "",
          regType: document.getElementById("regType")?.value || "",

          // نخزن التخصصات كـ Array
          specialties: selectedSpecialties,

          workDays: document.getElementById("workDays")?.value.trim() || "",
          workHours: document.getElementById("workHours")?.value.trim() || "",
          mapLocation: document.getElementById("mapLocation")?.value.trim() || "",
          description: document.getElementById("description")?.value.trim() || ""
        };

        console.log("📋 بيانات التسجيل:", data);

        // التحقق من البيانات الأساسية
        if (!data.name) {
          alert("يرجى إدخال اسم المحل");
          return;
        }

        if (!data.city) {
          alert("يرجى إدخال المحافظة");
          return;
        }

        if (!data.phone) {
          alert("يرجى إدخال رقم الهاتف");
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
  // إرسال تعليق
  // إرسال تعليق
  window.sendComment = async function (shopId) {

    const name = document.getElementById(`name-${shopId}`).value.trim();
    const comment = document.getElementById(`comment-${shopId}`).value.trim();
    const rating = parseInt(
      document.getElementById(`rating-${shopId}`).value
    );
    const ok = await saveComment({
      shopId,
      name: name || "مستخدم",
      comment,
      rating
    });

    if (ok === "already-rated") {
      alert("لقد قيّمت هذا المحل مسبقًا ⭐");
      return;
    }

    if (!ok) {
      alert("حدث خطأ أثناء الحفظ");
      return;
    }
    document.getElementById(`comment-${shopId}`).value = "";
    document.getElementById(`name-${shopId}`).value = "";

    await loadComments(shopId);
  };

  // تحميل التعليقات وتحديث ملخص التقييم
  async function loadComments(shopId) {

    const stats = await getRatingStats(shopId);

    const ratingBox =
      document.getElementById(`rating-summary-${shopId}`);

    if (ratingBox) {
      ratingBox.textContent =
        `⭐ ${stats.average.toFixed(1)} (${stats.votes} تقييم)`;
    }

    const ratingBadge =
      document.getElementById(`rating-badge-${shopId}`);

    if (ratingBadge) {
      ratingBadge.textContent =
        `⭐ ${stats.average.toFixed(1)} (${stats.votes} تقييم)`;
    }

    // ملاحظة: عرض قائمة التعليقات الفردية غير مفعّل حالياً بالواجهة
    const box = document.getElementById(`comments-${shopId}`);

    if (box) {
      const comments = await getComments(shopId);

      if (!Array.isArray(comments) || comments.length === 0) {
        box.innerHTML = "لا توجد تعليقات";
        return;
      }

      box.innerHTML = "";
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
      const cards = document.querySelectorAll(".category-card");

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
        let countElement =
          card.querySelector(".category-count");

        if (!countElement) {
          countElement = document.createElement("span");
          countElement.className = "category-count";

          const heading = card.querySelector("h3");

          if (heading) {
            heading.appendChild(document.createTextNode(" "));
            heading.appendChild(countElement);
          }
        }

        countElement.textContent = count;
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
        class="category-card"
        onclick="openCategory('maintenance')"
      >
        <div class="category-icon maintenance-icon">
          🔧
        </div>
        <h3>الصيانة</h3>
        <p>خدمات الصيانة والإصلاح</p>
      </div>

      <div
        class="category-card"
        onclick="openCategory('seller')"
      >
        <div class="category-icon sales-icon">
          🛒
        </div>
        <h3>المبيعات</h3>
        <p>المحلات والبائعين</p>
      </div>
    `;

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

      grid.innerHTML = `

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'فني تبريد وتكييف')">
        <div class="category-icon maintenance-icon">❄️</div>
        <h3>فني تبريد وتكييف</h3>
        <p>صيانة أجهزة التبريد والتكييف</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'كهربائي سيارات')">
        <div class="category-icon maintenance-icon">⚡</div>
        <h3>كهربائي سيارات</h3>
        <p>الأعمال الكهربائية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'فيتر (ميكانيكي)')">
        <div class="category-icon maintenance-icon">🔧</div>
        <h3>فيتر (ميكانيكي)</h3>
        <p>صيانة ميكانيكية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'حداد صدر')">
        <div class="category-icon maintenance-icon">🔨</div>
        <h3>حداد صدر</h3>
        <p>أعمال الحدادة وتصليح الهيكل</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'سمكري')">
        <div class="category-icon maintenance-icon">🚗</div>
        <h3>سمكري</h3>
        <p>تصليح هياكل السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'صباغ سيارات')">
        <div class="category-icon maintenance-icon">🎨</div>
        <h3>صباغ سيارات</h3>
        <p>صبغ السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'ميزان وبالنص')">
        <div class="category-icon maintenance-icon">⚙️</div>
        <h3>ميزان وبالنص</h3>
        <p>ميزان السيارات والبالنص</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'تبديل زيت وفلاتر')">
        <div class="category-icon maintenance-icon">🛢️</div>
        <h3>تبديل زيت وفلاتر</h3>
        <p>خدمات الزيوت والفلاتر</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'صيانة إيرباك')">
        <div class="category-icon maintenance-icon">🛡️</div>
        <h3>صيانة إيرباك</h3>
        <p>صيانة الوسائد الهوائية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'صيانة ABS')">
        <div class="category-icon maintenance-icon">🚨</div>
        <h3>صيانة ABS</h3>
        <p>صيانة نظام ABS</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'بريكات (دسكات، فلنجات، سفايف)')">
        <div class="category-icon maintenance-icon">🛞</div>
        <h3>بريكات</h3>
        <p>دسكات، فلنجات، سفايف</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'صيانة جير أوتوماتيك')">
        <div class="category-icon maintenance-icon">⚙️</div>
        <h3>صيانة جير أوتوماتيك</h3>
        <p>صيانة نواقل الحركة</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'برمجة وفحص كمبيوتر')">
        <div class="category-icon maintenance-icon">💻</div>
        <h3>برمجة وفحص كمبيوتر</h3>
        <p>فحص وبرمجة السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'بطاريات')">
        <div class="category-icon maintenance-icon">🔋</div>
        <h3>بطاريات</h3>
        <p>بيع وصيانة البطاريات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'إطارات وبنجرجي')">
        <div class="category-icon maintenance-icon">🛞</div>
        <h3>إطارات وبنجرجي</h3>
        <p>الإطارات وخدمات البنجرجي</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'تبديل زجاج')">
        <div class="category-icon maintenance-icon">🪟</div>
        <h3>تبديل زجاج</h3>
        <p>زجاج السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'صيانة رديتر')">
        <div class="category-icon maintenance-icon">🌡️</div>
        <h3>صيانة رديتر</h3>
        <p>صيانة أنظمة التبريد</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'عادم (إكزوزت)')">
        <div class="category-icon maintenance-icon">🔧</div>
        <h3>عادم (إكزوزت)</h3>
        <p>أنظمة العادم</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'مفاتيح سيارات وبرمجة ريموت')">
        <div class="category-icon maintenance-icon">🔑</div>
        <h3>مفاتيح وبرمجة ريموت</h3>
        <p>مفاتيح السيارات والريموت</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'تلميع وحماية')">
        <div class="category-icon maintenance-icon">✨</div>
        <h3>تلميع وحماية</h3>
        <p>تلميع وحماية السيارات</p>
      </div>

    `;

    } else if (type === "seller") {

      title.textContent = "🛒 فئات المبيعات";

      grid.innerHTML = `

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'قطع غيار أصلية')">
        <div class="category-icon sales-icon">🔩</div>
        <h3>قطع غيار أصلية</h3>
        <p>قطع غيار أصلية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'قطع غيار تجارية')">
        <div class="category-icon sales-icon">🔧</div>
        <h3>قطع غيار تجارية</h3>
        <p>قطع غيار تجارية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'إكسسوارات')">
        <div class="category-icon sales-icon">🚗</div>
        <h3>إكسسوارات</h3>
        <p>إكسسوارات السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'زيوت')">
        <div class="category-icon sales-icon">🛢️</div>
        <h3>زيوت</h3>
        <p>زيوت السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'بطاريات')">
        <div class="category-icon sales-icon">🔋</div>
        <h3>بطاريات</h3>
        <p>بطاريات السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'إطارات')">
        <div class="category-icon sales-icon">🛞</div>
        <h3>إطارات</h3>
        <p>إطارات وعجلات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'جنوط')">
        <div class="category-icon sales-icon">⚙️</div>
        <h3>جنوط</h3>
        <p>جنوط السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'إنارة')">
        <div class="category-icon sales-icon">💡</div>
        <h3>إنارة</h3>
        <p>إنارة السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'أجهزة فحص')">
        <div class="category-icon sales-icon">💻</div>
        <h3>أجهزة فحص</h3>
        <p>أجهزة فحص السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'مكيفات سيارات')">
        <div class="category-icon sales-icon">❄️</div>
        <h3>مكيفات سيارات</h3>
        <p>مكيفات وأنظمة تكييف السيارات</p>
        </div>

`;



      updateCategoryCounts(type);

    }
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

          </div>
        `;
        });

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

          </div>
        `;
          });

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