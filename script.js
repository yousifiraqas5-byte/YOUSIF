// ======================================================
// دليل المحلات - script.js
// الجزء 1/3: البيانات + السيارات + الدوال الأساسية
// ======================================================

import {
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments
} from "./firebase.js";

// ======================================================
// التخصصات
// ======================================================

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
  "قطع غيار أصلية",
  "قطع غيار تجارية",
  "إكسسوارات",
  "زيوت",
  "بطاريات",
  "إطارات",
  "جنوط",
  "إنارة",
  "أجهزة فحص",
  "مكيفات سيارات"
];

// ======================================================
// بيانات السيارات
// ======================================================

const vehicleData = {

  "كوري": {
    "كيا": [
      "سيراتو",
      "سبورتاج",
      "سورينتو",
      "ريو",
      "بيكانتو",
      "K5",
      "كارنفال"
    ],
    "هيونداي": [
      "النترا",
      "سوناتا",
      "توسان",
      "سانتافي",
      "أكسنت",
      "كونا",
      "باليسيد",
      "كريتا"
    ],
    "جينيسس": [
      "G70",
      "G80",
      "G90",
      "GV70",
      "GV80"
    ],
    "دايو": [
      "لانوس",
      "نوبيرا",
      "ليجانزا"
    ]
  },

  "أمريكي": {
    "شيفروليه": [
      "ماليبو",
      "إمبالا",
      "كروز",
      "تاهو",
      "سوبربان",
      "كابتيفا",
      "ترافيرس",
      "سيلفرادو",
      "كامارو"
    ],
    "دودج": [
      "تشارجر",
      "تشالنجر",
      "دورانجو",
      "رام"
    ],
    "GMC": [
      "يوكون",
      "سييرا",
      "أكاديا",
      "تيرين"
    ],
    "فورد": [
      "إكسبلورر",
      "إكسبيديشن",
      "إيدج",
      "إسكيب",
      "موستانج",
      "F-150",
      "رابتور"
    ],
    "كرايسلر": [
      "300",
      "باسيفيكا",
      "فوياجر"
    ],
    "جيب": [
      "جراند شيروكي",
      "رانجلر",
      "كومباس",
      "جلادياتور",
      "شيروكي"
    ],
    "كاديلاك": [
      "إسكاليد",
      "XT4",
      "XT5",
      "XT6",
      "CT5"
    ],
    "لينكولن": [
      "نافيجيتور",
      "أفياتور",
      "نوتيلوس"
    ]
  },

  "ياباني": {
    "تويوتا": [
      "كامري",
      "كورولا",
      "راف 4",
      "لاندكروزر",
      "برادو",
      "هايلاندر",
      "يارس",
      "أفالون",
      "فورتشنر",
      "هايلوكس"
    ],
    "نيسان": [
      "ألتيما",
      "سنترا",
      "باترول",
      "إكس تريل",
      "ماكسيما",
      "قشقاي",
      "نافارا"
    ],
    "هوندا": [
      "أكورد",
      "سيفيك",
      "CR-V",
      "HR-V",
      "بايلوت"
    ],
    "مازدا": [
      "مازدا 3",
      "مازدا 6",
      "CX-5",
      "CX-9",
      "CX-30"
    ],
    "ميتسوبيشي": [
      "لانسر",
      "أوتلاندر",
      "باجيرو",
      "ASX",
      "L200"
    ],
    "سوبارو": [
      "فورستر",
      "أوتباك",
      "إمبريزا"
    ],
    "سوزوكي": [
      "سويفت",
      "فيتارا",
      "جيمني",
      "إرتيجا"
    ],
    "إنفينيتي": [
      "Q50",
      "QX50",
      "QX60",
      "QX80"
    ]
  },

  "صيني": {
    "MG": [
      "MG 5",
      "MG 6",
      "ZS",
      "HS",
      "RX5"
    ],
    "BYD": [
      "F3",
      "Song Plus",
      "Qin",
      "Han",
      "Atto 3"
    ],
    "Chery": [
      "Arrizo 5",
      "Arrizo 6",
      "Tiggo 4",
      "Tiggo 7",
      "Tiggo 8"
    ],
    "Geely": [
      "Emgrand",
      "Coolray",
      "Azkarra"
    ],
    "Haval": [
      "H6",
      "H9",
      "Jolion"
    ],
    "Changan": [
      "Alsvin",
      "CS35",
      "CS55",
      "CS75"
    ],
    "GAC": [
      "GS3",
      "GS4",
      "GS8",
      "EMPOW"
    ]
  },

  "فرنسي": {
    "بيجو": [
      "208",
      "301",
      "308",
      "508",
      "2008",
      "3008",
      "5008"
    ],
    "رينو": [
      "ميغان",
      "لوجان",
      "داستر",
      "كوليوس",
      "كابتشر"
    ],
    "سيتروين": [
      "C3",
      "C4",
      "C5",
      "C5 Aircross"
    ]
  },

  "تشيكي": {
    "سكودا": [
      "أوكتافيا",
      "سوبيرب",
      "فابيا",
      "رابيد",
      "كودياك",
      "كاروك"
    ]
  },

  "بريطاني": {
    "لاندروفر": [
      "رانج روفر",
      "ديسكفري",
      "ديفندر",
      "إيفوك"
    ],
    "جاغوار": [
      "XE",
      "XF",
      "F-Pace",
      "F-Type"
    ],
    "بنتلي": [
      "كونتيننتال",
      "بنتايجا",
      "فلاينغ سبير"
    ]
  },

  "ماليزي": {
    "بروتون": [
      "سابا",
      "بيرسونا",
      "إكسورا"
    ],
    "بيرودوا": [
      "Myvi",
      "Axia",
      "Bezza"
    ]
  }
};

// ======================================================
// المتغيرات العامة
// ======================================================

let selectedVehicleItems = [];
let allRegistrations = [];

// ======================================================
// حماية النصوص
// ======================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

// ======================================================
// البيانات العامة
// ======================================================

window.appData = {
  maintenanceSpecialties,
  sellerSpecialties,
  vehicleData
};

// ======================================================
// السيارات المختارة
// ======================================================

window.getSelectedVehicles = function () {
  return [...selectedVehicleItems];
};

window.clearSelectedVehicles = function () {
  selectedVehicleItems = [];
  renderSelectedVehicles();
};

window.removeSelectedVehicle = function (index) {
  selectedVehicleItems.splice(index, 1);
  renderSelectedVehicles();
};

// ======================================================
// فتح الأقسام
// ======================================================

window.openCategory = function (type) {

  console.log("فتح القسم:", type);

  const title = document.querySelector(".section-title");
  const grid = document.querySelector(".category-grid");

  if (type === "maintenance") {

    if (title) {
      title.textContent = "🔧 فئات الصيانة";
    }

    if (grid) {
      grid.innerHTML = maintenanceSpecialties.map(item => `
        <div class="category-card"
             onclick="showCategoryRegistrations('maintenance', '${escapeAttribute(item)}')">

          <div class="category-icon maintenance-icon">🔧</div>

          <h3>${escapeHTML(item)}</h3>

          <p>محلات وخدمات ${escapeHTML(item)}</p>

        </div>
      `).join("");
    }

    return;
  }

  if (type === "seller") {

    if (title) {
      title.textContent = "🛒 فئات المبيعات";
    }

    if (grid) {
      grid.innerHTML = sellerSpecialties.map(item => `
        <div class="category-card"
             onclick="showCategoryRegistrations('seller', '${escapeAttribute(item)}')">

          <div class="category-icon sales-icon">🛒</div>

          <h3>${escapeHTML(item)}</h3>

          <p>محلات بيع ${escapeHTML(item)}</p>

        </div>
      `).join("");
    }

    return;
  }

  if (type === "both") {

    if (title) {
      title.textContent = "🔧🛒 الصيانة والمبيعات";
    }

    if (grid) {
      grid.innerHTML = `
        <div class="category-card"
             onclick="openCategory('maintenance')">

          <div class="category-icon maintenance-icon">🔧</div>
          <h3>الصيانة</h3>
          <p>جميع خدمات صيانة السيارات</p>

        </div>

        <div class="category-card"
             onclick="openCategory('seller')">

          <div class="category-icon sales-icon">🛒</div>
          <h3>المبيعات</h3>
          <p>قطع الغيار والإكسسوارات</p>

        </div>
      `;
    }

    return;
  }

  if (type === "all") {

    loadRegistrations();
    return;
  }

  console.warn("نوع القسم غير معروف:", type);
};

// ======================================================
// عرض المحلات حسب الفئة
// ======================================================

window.showCategoryRegistrations = async function (
  type,
  category
) {

  console.log("عرض:", type, category);

  const container =
    document.getElementById("registrationsList");

  if (!container) {
    console.warn("registrationsList غير موجود");
    return;
  }

  container.innerHTML = `
    <div class="loading">
      ⏳ جارٍ تحميل المحلات...
    </div>
  `;

  try {

    const registrations =
      await getRegistrations();

    const filtered = registrations.filter(shop => {

      if (type === "maintenance") {
        return (
          shop.regType === "maintenance" ||
          shop.regType === "both"
        ) &&
        getShopSpecialties(shop).includes(category);
      }

      if (type === "seller") {
        return (
          shop.regType === "seller" ||
          shop.regType === "both"
        ) &&
        getShopSpecialties(shop).includes(category);
      }

      return true;
    });

    if (filtered.length === 0) {

      container.innerHTML = `
        <div class="no-registrations">
          لا توجد محلات مسجلة ضمن هذه الفئة حتى الآن.
        </div>
      `;

      return;
    }

    renderRegistrations(
      filtered,
      container
    );

  } catch (error) {

    console.error(
      "showCategoryRegistrations:",
      error
    );

    container.innerHTML = `
      <div class="no-registrations">
        حدث خطأ أثناء تحميل المحلات.
      </div>
    `;
  }
};

// ======================================================
// الرجوع وإظهار كل المحلات
// ======================================================

window.showAllRegistrations = function () {
  loadRegistrations();
};

// ======================================================
// عند تحميل الصفحة
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "دليل المحلات: script.js يعمل بنجاح"
    );

    setupRegistrationForm();
    setupVehicleSelectors();

    loadRegistrations();
  }
);
// ======================================================
// دليل المحلات - script.js
// الجزء 2/3: التسجيل + السيارات + النوافذ
// ======================================================

// ======================================================
// نافذة اختيار نوع التسجيل
// ======================================================

window.openModal = function () {

  const modal =
    document.getElementById("typeModal");

  if (modal) {
    modal.classList.add("active");
  } else {
    console.warn("typeModal غير موجود");
  }
};

window.closeTypeModal = function () {

  const modal =
    document.getElementById("typeModal");

  if (modal) {
    modal.classList.remove("active");
  }
};

window.selectRegistrationType =
function (type) {

  const typeModal =
    document.getElementById("typeModal");

  const registrationModal =
    document.getElementById(
      "registrationModal"
    );

  const regType =
    document.getElementById("regType");

  if (typeModal) {
    typeModal.classList.remove("active");
  }

  if (regType) {

    regType.value = type;

    regType.dispatchEvent(
      new Event("change")
    );
  }

  if (registrationModal) {
    registrationModal.classList.add("active");
  }
};

// ======================================================
// إغلاق نافذة التسجيل
// ======================================================

window.closeModal = function () {

  const modal =
    document.getElementById(
      "registrationModal"
    );

  if (modal) {
    modal.classList.remove("active");
  }
};

// ======================================================
// تحميل التخصصات
// ======================================================

function loadSpecialties(type) {

  const select =
    document.getElementById("specialty");

  const group =
    document.getElementById(
      "specialtyGroup"
    );

  if (!select || !group) {
    return;
  }

  select.innerHTML = "";

  let specialties = [];

  if (type === "maintenance") {

    specialties =
      [...maintenanceSpecialties];

  } else if (type === "seller") {

    specialties =
      [...sellerSpecialties];

  } else if (type === "both") {

    specialties = [
      ...maintenanceSpecialties,
      ...sellerSpecialties
    ];
  }

  if (specialties.length === 0) {

    group.style.display = "none";
    return;
  }

  group.style.display = "block";

  specialties.forEach(
    specialty => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        specialty;

      option.textContent =
        specialty;

      select.appendChild(
        option
      );
    }
  );
}

// ======================================================
// إعداد نموذج التسجيل
// ======================================================

function setupRegistrationForm() {

  const form =
    document.getElementById(
      "registrationForm"
    );

  const regType =
    document.getElementById(
      "regType"
    );

  if (!form) {
    return;
  }

  if (regType) {

    regType.addEventListener(
      "change",
      () => {

        loadSpecialties(
          regType.value
        );

      }
    );
  }

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const name =
        document.getElementById(
          "name"
        )?.value.trim() || "";

      const phone =
        document.getElementById(
          "phone"
        )?.value.trim() || "";

      const city =
        document.getElementById(
          "city"
        )?.value.trim() || "";

      const region =
        document.getElementById(
          "region"
        )?.value.trim() || "";

      const activityType =
        document.getElementById(
          "regType"
        )?.value || "";

      const workDays =
        document.getElementById(
          "workDays"
        )?.value.trim() || "";

      const workHours =
        document.getElementById(
          "workHours"
        )?.value.trim() || "";

      const mapLocation =
        document.getElementById(
          "mapLocation"
        )?.value.trim() || "";

      const description =
        document.getElementById(
          "description"
        )?.value.trim() || "";

      const specialtySelect =
        document.getElementById(
          "specialty"
        );

      const specialties =
        specialtySelect
          ? Array.from(
              specialtySelect.selectedOptions
            ).map(
              option => option.value
            )
          : [];

      const vehicles =
        window.getSelectedVehicles();

      // ----------------------------------------------
      // التحقق
      // ----------------------------------------------

      if (!name) {
        alert("يرجى إدخال اسم المحل");
        return;
      }

      if (!phone) {
        alert("يرجى إدخال رقم الهاتف");
        return;
      }

      if (!city) {
        alert("يرجى اختيار المحافظة");
        return;
      }

      if (!region) {
        alert("يرجى إدخال المنطقة");
        return;
      }

      if (!activityType) {
        alert("يرجى اختيار نوع النشاط");
        return;
      }

      // ----------------------------------------------
      // البيانات
      // ----------------------------------------------

      const data = {

        name,

        phone,

        city,

        region,

        regType:
          activityType,

        specialties,

        specialty:
          specialties.join(" • "),

        vehicles,

        workDays,

        workHours,

        mapLocation,

        description,

        rating: 0,

        ratingCount: 0

      };

      console.log(
        "سيتم حفظ:",
        data
      );

      const button =
        form.querySelector(
          'button[type="submit"]'
        );

      if (button) {

        button.disabled = true;

        button.textContent =
          "⏳ جارٍ التسجيل...";
      }

      try {

        const saved =
          await saveRegistration(
            data
          );

        if (!saved) {

          alert(
            "❌ تعذر حفظ التسجيل"
          );

          return;
        }

        alert(
          "✅ تم تسجيل المحل بنجاح"
        );

        form.reset();

        window.clearSelectedVehicles();

        const specialtyGroup =
          document.getElementById(
            "specialtyGroup"
          );

        if (specialtyGroup) {
          specialtyGroup.style.display =
            "none";
        }

        window.closeModal();

        await loadRegistrations();

      } catch (error) {

        console.error(
          "registration error:",
          error
        );

        alert(
          "❌ حدث خطأ أثناء تسجيل المحل"
        );

      } finally {

        if (button) {

          button.disabled = false;

          button.textContent =
            "✅ تسجيل المحل";
        }
      }
    }
  );
}

// ======================================================
// إعداد السيارات
// ======================================================

function setupVehicleSelectors() {

  const origin =
    document.getElementById(
      "vehicleOrigin"
    );

  const brand =
    document.getElementById(
      "vehicleBrand"
    );

  const model =
    document.getElementById(
      "vehicleModel"
    );

  const year =
    document.getElementById(
      "vehicleYear"
    );

  const brandGroup =
    document.getElementById(
      "vehicleBrandGroup"
    );

  const modelGroup =
    document.getElementById(
      "vehicleModelGroup"
    );

  const yearGroup =
    document.getElementById(
      "vehicleYearGroup"
    );

  const addButton =
    document.getElementById(
      "addVehicleBtn"
    );

  // ----------------------------------------------
  // السنوات
  // ----------------------------------------------

  if (year && year.options.length <= 1) {

    for (
      let y = new Date().getFullYear();
      y >= 1980;
      y--
    ) {

      const option =
        document.createElement(
          "option"
        );

      option.value = y;
      option.textContent = y;

      year.appendChild(
        option
      );
    }
  }

  // ----------------------------------------------
  // المنشأ
  // ----------------------------------------------

  if (origin) {

    origin.addEventListener(
      "change",
      () => {

        const value =
          origin.value;

        if (brand) {

          brand.innerHTML =
            `<option value="">اختر الشركة</option>`;
        }

        if (model) {

          model.innerHTML =
            `<option value="">اختر الموديل</option>`;
        }

        if (brandGroup) {

          brandGroup.style.display =
            value
              ? "block"
              : "none";
        }

        if (modelGroup) {
          modelGroup.style.display =
            "none";
        }

        if (yearGroup) {
          yearGroup.style.display =
            "none";
        }

        if (
          !value ||
          !vehicleData[value]
        ) {
          return;
        }

        Object.keys(
          vehicleData[value]
        ).forEach(
          brandName => {

            const option =
              document.createElement(
                "option"
              );

            option.value =
              brandName;

            option.textContent =
              brandName;

            brand.appendChild(
              option
            );
          }
        );
      }
    );
  }

  // ----------------------------------------------
  // الشركة
  // ----------------------------------------------

  if (brand) {

    brand.addEventListener(
      "change",
      () => {

        const originValue =
          origin?.value || "";

        const brandValue =
          brand.value || "";

        if (model) {

          model.innerHTML =
            `<option value="">اختر الموديل</option>`;
        }

        if (modelGroup) {

          modelGroup.style.display =
            brandValue
              ? "block"
              : "none";
        }

        if (yearGroup) {
          yearGroup.style.display =
            "none";
        }

        if (
          !originValue ||
          !brandValue ||
          !vehicleData[originValue] ||
          !vehicleData[originValue][brandValue]
        ) {
          return;
        }

        vehicleData[
          originValue
        ][
          brandValue
        ].forEach(
          modelName => {

            const option =
              document.createElement(
                "option"
              );

            option.value =
              modelName;

            option.textContent =
              modelName;

            model.appendChild(
              option
            );
          }
        );
      }
    );
  }

  // ----------------------------------------------
  // الموديل
  // ----------------------------------------------

  if (model) {

    model.addEventListener(
      "change",
      () => {

        if (yearGroup) {

          yearGroup.style.display =
            model.value
              ? "block"
              : "none";
        }
      }
    );
  }

  // ----------------------------------------------
  // إضافة السيارة
  // ----------------------------------------------

  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        const originValue =
          origin?.value || "";

        const brandValue =
          brand?.value || "";

        const modelValue =
          model?.value || "";

        const yearValue =
          year?.value || "";

        if (
          !originValue ||
          !brandValue ||
          !modelValue
        ) {

          alert(
            "اختر منشأ السيارة والشركة والموديل أولاً"
          );

          return;
        }

        const exists =
          selectedVehicleItems.some(
            item =>
              item.origin === originValue &&
              item.brand === brandValue &&
              item.model === modelValue &&
              item.year === yearValue
          );

        if (exists) {

          alert(
            "هذه السيارة مضافة مسبقًا"
          );

          return;
        }

        selectedVehicleItems.push({

          origin:
            originValue,

          brand:
            brandValue,

          model:
            modelValue,

          year:
            yearValue

        });

        renderSelectedVehicles();
      }
    );
  }
}

// ======================================================
// عرض السيارات المختارة
// ======================================================

function renderSelectedVehicles() {

  const container =
    document.getElementById(
      "selectedVehicles"
    );

  if (!container) {
    return;
  }

  if (
    selectedVehicleItems.length === 0
  ) {

    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    selectedVehicleItems
      .map(
        (item, index) => `

          <div class="selected-vehicle">

            <span>
              🚗
              ${escapeHTML(item.origin)}
              -
              ${escapeHTML(item.brand)}
              -
              ${escapeHTML(item.model)}
              ${
                item.year
                  ? `(${escapeHTML(item.year)})`
                  : ""
              }
            </span>

            <button
              type="button"
              onclick="removeSelectedVehicle(${index})">

              ✕

            </button>

          </div>

        `
      )
      .join("");
}

// ======================================================
// تحديث قائمة التسجيلات
// ======================================================

window.refreshRegistrations =
async function () {

  await loadRegistrations();

};
// ======================================================
// دليل المحلات - script.js
// الجزء 3/3: المحلات + التقييمات + التعليقات
// ======================================================

// ======================================================
// جلب المحلات
// ======================================================

async function loadRegistrations() {

  const container =
    document.getElementById(
      "registrationsList"
    );

  if (!container) {
    console.warn(
      "registrationsList غير موجود"
    );
    return;
  }

  container.innerHTML = `
    <div class="loading">
      ⏳ جارٍ تحميل المحلات...
    </div>
  `;

  try {

    const registrations =
      await getRegistrations();

    allRegistrations =
      Array.isArray(
        registrations
      )
        ? registrations
        : [];

    if (
      allRegistrations.length === 0
    ) {

      container.innerHTML = `
        <div class="no-registrations">
          لا توجد محلات مسجلة حتى الآن
        </div>
      `;

      return;
    }

    renderRegistrations(
      allRegistrations,
      container
    );

  } catch (error) {

    console.error(
      "loadRegistrations:",
      error
    );

    container.innerHTML = `
      <div class="no-registrations">
        ❌ حدث خطأ أثناء تحميل المحلات
      </div>
    `;
  }
}

// ======================================================
// الحصول على تخصصات المحل
// ======================================================

function getShopSpecialties(shop) {

  if (
    Array.isArray(
      shop.specialties
    )
  ) {

    return shop.specialties;
  }

  if (
    typeof shop.specialty ===
    "string"
  ) {

    return shop.specialty
      .split(" • ")
      .map(
        item => item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

// ======================================================
// نوع النشاط
// ======================================================

function getTypeLabel(type) {

  if (type === "maintenance") {
    return "🔧 صيانة";
  }

  if (type === "seller") {
    return "🛒 مبيعات";
  }

  if (type === "both") {
    return "🔧🛒 صيانة + مبيعات";
  }

  return "";
}

// ======================================================
// التقييم
// ======================================================

function getRatingText(shop) {

  const rating =
    Number(
      shop.rating || 0
    );

  const count =
    Number(
      shop.ratingCount ||
      shop.votes ||
      0
    );

  if (!count) {

    return "⭐ لا توجد تقييمات";
  }

  return `
    ⭐ ${rating.toFixed(1)}
    |
    👥 ${count} تقييم
  `;
}

// ======================================================
// رسم المحلات
// ======================================================

function renderRegistrations(
  shops,
  container
) {

  container.innerHTML = "";

  shops.forEach(
    shop => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "registration-card";

      const specialties =
        getShopSpecialties(
          shop
        );

      const vehicleText =
        Array.isArray(
          shop.vehicles
        )
          ? shop.vehicles
              .map(
                vehicle =>
                  `${vehicle.brand || ""} ${vehicle.model || ""} ${
                    vehicle.year || ""
                  }`
              )
              .join(" • ")
          : "";

      card.innerHTML = `

        <h3>
          ${escapeHTML(
            shop.name ||
            shop.shopName ||
            "بدون اسم"
          )}
        </h3>

        <p>
          ${getTypeLabel(
            shop.regType
          )}
        </p>

        ${
          specialties.length
            ? `
              <p>
                🔧
                ${escapeHTML(
                  specialties.join(" • ")
                )}
              </p>
            `
            : ""
        }

        ${
          vehicleText
            ? `
              <p>
                🚗
                ${escapeHTML(
                  vehicleText
                )}
              </p>
            `
            : ""
        }

        <p>
          📍
          ${escapeHTML(
            shop.city || ""
          )}
          -
          ${escapeHTML(
            shop.region || ""
          )}
        </p>

        ${
          shop.workDays
            ? `
              <p>
                📅
                ${escapeHTML(
                  shop.workDays
                )}
              </p>
            `
            : ""
        }

        ${
          shop.workHours
            ? `
              <p>
                🕐
                ${escapeHTML(
                  shop.workHours
                )}
              </p>
            `
            : ""
        }

        ${
          shop.description
            ? `
              <p>
                📝
                ${escapeHTML(
                  shop.description
                )}
              </p>
            `
            : ""
        }

        <p class="shop-rating">
          ${getRatingText(
            shop
          )}
        </p>

        <div class="shop-actions">

          ${
            shop.phone
              ? `
                <a
                  href="tel:${escapeAttribute(
                    shop.phone
                  )}">

                  <button
                    type="button">
                    📞 اتصال
                  </button>

                </a>
              `
              : ""
          }

          ${
            shop.mapLocation
              ? `
                <a
                  href="${escapeAttribute(
                    shop.mapLocation
                  )}"
                  target="_blank"
                  rel="noopener noreferrer">

                  <button
                    type="button">
                    📍 الموقع
                  </button>

                </a>
              `
              : ""
          }

        </div>

        <hr>

        <h4>
          ⭐ تقييم المحل
        </h4>

        <div
          class="comments-list"
          id="comments-${escapeAttribute(
            shop.id
          )}">

          ⏳ جارٍ تحميل التقييمات...

        </div>

        <input
          type="text"
          id="name-${escapeAttribute(
            shop.id
          )}"
          placeholder="اسمك (اختياري)">

        <textarea
          id="comment-${escapeAttribute(
            shop.id
          )}"
          placeholder="اكتب تعليقك (اختياري)">
        </textarea>

        <select
          id="rating-${escapeAttribute(
            shop.id
          )}">

          <option value="5">
            ⭐⭐⭐⭐⭐
          </option>

          <option value="4">
            ⭐⭐⭐⭐
          </option>

          <option value="3">
            ⭐⭐⭐
          </option>

          <option value="2">
            ⭐⭐
          </option>

          <option value="1">
            ⭐
          </option>

        </select>

        <button
          type="button"
          class="comment-btn"
          onclick="sendComment('${escapeAttribute(
            shop.id
          )}')">

          ⭐ إرسال التقييم

        </button>

        <button
          type="button"
          class="report-shop-btn"
          onclick="reportShop('${escapeAttribute(
            shop.id
          )}')">

          ⚠️ إبلاغ عن معلومات غير صحيحة

        </button>

      `;

      container.appendChild(
        card
      );

      loadComments(
        shop.id
      );
    }
  );
}

// ======================================================
// إرسال التقييم
// ======================================================

window.sendComment =
async function(shopId) {

  const nameInput =
    document.getElementById(
      `name-${shopId}`
    );

  const commentInput =
    document.getElementById(
      `comment-${shopId}`
    );

  const ratingInput =
    document.getElementById(
      `rating-${shopId}`
    );

  if (!ratingInput) {

    alert(
      "لم يتم العثور على خانة التقييم"
    );

    return;
  }

  const name =
    nameInput?.value.trim() ||
    "مستخدم";

  const comment =
    commentInput?.value.trim() ||
    "";

  const rating =
    Number(
      ratingInput.value
    );

  if (
    rating < 1 ||
    rating > 5
  ) {

    alert(
      "اختر تقييمًا من 1 إلى 5"
    );

    return;
  }

  try {

    const saved =
      await saveComment({

        shopId,

        name,

        comment,

        rating

      });

    if (!saved) {

      alert(
        "❌ تعذر حفظ التقييم"
      );

      return;
    }

    if (nameInput) {
      nameInput.value = "";
    }

    if (commentInput) {
      commentInput.value = "";
    }

    await loadRegistrations();

    alert(
      "✅ تم تسجيل تقييمك بنجاح"
    );

  } catch (error) {

    console.error(
      "sendComment:",
      error
    );

    alert(
      "❌ حدث خطأ أثناء إرسال التقييم"
    );
  }
};

// ======================================================
// تحميل التعليقات
// ======================================================

async function loadComments(
  shopId
) {

  const box =
    document.getElementById(
      `comments-${shopId}`
    );

  if (!box) {
    return;
  }

  try {

    const comments =
      await getComments(
        shopId
      );

    if (
      !Array.isArray(
        comments
      ) ||
      comments.length === 0
    ) {

      box.innerHTML = `
        <p>
          لا توجد تقييمات حتى الآن
        </p>
      `;

      return;
    }

    const ratings =
      comments
        .map(
          item =>
            Number(
              item.rating
            )
        )
        .filter(
          rating =>
            rating >= 1 &&
            rating <= 5
        );

    const total =
      ratings.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const average =
      ratings.length
        ? total /
          ratings.length
        : 0;

    box.innerHTML = `

      <div class="rating-summary">

        <strong>
          ⭐ ${average.toFixed(1)}
        </strong>

        <span>
          👥 ${ratings.length} تقييم
        </span>

      </div>

    `;

    comments.forEach(
      comment => {

        const rating =
          Number(
            comment.rating || 0
          );

        const stars =
          "⭐".repeat(
            Math.max(
              0,
              Math.min(
                5,
                rating
              )
            )
          );

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "comment-card";

        item.innerHTML = `

          <strong>
            ${escapeHTML(
              comment.name ||
              "مستخدم"
            )}
          </strong>

          <div>
            ${stars}
          </div>

          ${
            comment.comment
              ? `
                <p>
                  ${escapeHTML(
                    comment.comment
                  )}
                </p>
              `
              : `
                <p>
                  <small>
                    ⭐ تقييم بدون تعليق
                  </small>
                </p>
              `
          }

        `;

        box.appendChild(
          item
        );
      }
    );

  } catch (error) {

    console.error(
      "loadComments:",
      error
    );

    box.innerHTML = `
      <p>
        تعذر تحميل التقييمات
      </p>
    `;
  }
}

// ======================================================
// الإبلاغ عن محل
// ======================================================

window.reportShop =
function(shopId) {

  const shop =
    allRegistrations.find(
      item =>
        String(item.id) ===
        String(shopId)
    );

  const shopName =
    shop?.name ||
    "هذا المحل";

  const confirmed =
    confirm(
      `هل تريد الإبلاغ عن معلومات غير صحيحة في ${shopName}؟`
    );

  if (!confirmed) {
    return;
  }

  alert(
    "⚠️ تم تسجيل طلب الإبلاغ. سيتم مراجعة المعلومات."
  );

  console.log(
    "Shop report:",
    shopId
  );
};

// ======================================================
// البحث عن المحلات
// ======================================================

window.searchRegistrations =
function(value) {

  const text =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  const container =
    document.getElementById(
      "registrationsList"
    );

  if (!container) {
    return;
  }

  if (!text) {

    renderRegistrations(
      allRegistrations,
      container
    );

    return;
  }

  const filtered =
    allRegistrations.filter(
      shop => {

        const specialties =
          getShopSpecialties(
            shop
          ).join(" ");

        const vehicles =
          Array.isArray(
            shop.vehicles
          )
            ? shop.vehicles
                .map(
                  v =>
                    `${v.origin} ${v.brand} ${v.model}`
                )
                .join(" ")
            : "";

        const searchable =
          `
            ${shop.name || ""}
            ${shop.city || ""}
            ${shop.region || ""}
            ${specialties}
            ${vehicles}
          `.toLowerCase();

        return searchable.includes(
          text
        );
      }
    );

  if (!filtered.length) {

    container.innerHTML = `
      <div class="no-registrations">
        لا توجد نتائج مطابقة للبحث
      </div>
    `;

    return;
  }

  renderRegistrations(
    filtered,
    container
  );
};

// ======================================================
// دوال بديلة حتى تعمل الأزرار القديمة في index.html
// ======================================================

window.openCategoryRegistrations =
function(type, category) {

  return window.showCategoryRegistrations(
    type,
    category
  );
};

window.backToCategories =
function() {

  const title =
    document.querySelector(
      ".section-title"
    );

  if (title) {
    title.textContent =
      "دليل المحلات";
  }

  const grid =
    document.querySelector(
      ".category-grid"
    );

  if (grid) {

    grid.innerHTML = `

      <div
        class="category-card"
        onclick="openCategory('maintenance')">

        <div class="category-icon">
          🔧
        </div>

        <h3>
          الصيانة
        </h3>

        <p>
          خدمات صيانة السيارات
        </p>

      </div>

      <div
        class="category-card"
        onclick="openCategory('seller')">

        <div class="category-icon">
          🛒
        </div>

        <h3>
          المبيعات
        </h3>

        <p>
          قطع الغيار والإكسسوارات
        </p>

      </div>

    `;
  }
};

// ======================================================
// تأكيد تحميل السكربت
// ======================================================

console.log(
  "✅ script.js تم تحميله بالكامل"
);

console.log(
  "openCategory:",
  typeof window.openCategory
);

console.log(
  "openModal:",
  typeof window.openModal
);