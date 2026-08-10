import {
  saveShop,
  getShops,
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments,
  getRatingStats
} from "./firebase.js?v=2";
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
  <span class="rating-summary" id="rating-${r.id}">
    ⭐ 0.0 (0 تقييم)
  </span>
</h3>

          <p>
            <strong>الفئة:</strong>
            ${typeLabel}
          </p>

          <p>
            <strong>التخصص:</strong>
            ${r.specialty || "غير محدد"}
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

          ${
            r.mapLocation
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

          ${
            r.description
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

  // Load shops if list exists
  loadShops();
  // ================================
// فلترة التسجيلات حسب القسم والتخصص
// ================================

window.showCategoryRegistrations = async function(type, specialty) {

  const container = document.getElementById("registrationsList");

  if (!container) return;

  container.style.display = "block";
  container.innerHTML = "جارٍ تحميل النتائج...";

  try {

    const regs = await getRegistrations();

    const filtered = regs.filter(r => {

      const sameType =
        r.regType === type ||
        r.regType === "both";

      const sameSpecialty =
        !specialty ||
        (r.specialty || "").trim() === specialty.trim();

      return sameType && sameSpecialty;
    });

    if (filtered.length === 0) {

      container.innerHTML = `
        <div class="no-registrations">
          لا توجد نتائج مسجلة في هذه الفئة حتى الآن
        </div>
      `;

      return;
    }

    container.innerHTML = "";

    filtered.forEach(r => {

      const typeLabel =
        r.regType === "seller"
          ? "🛒 بيع"
          : r.regType === "maintenance"
          ? "🔧 صيانة"
          : r.regType === "both"
          ? "🔧🛒 صيانة + بيع"
          : r.regType || "";

      container.innerHTML += `

        <div class="registration-card">

          <h3>${r.name || r.shopName || "بدون اسم"}</h3>

          <p>
            <strong>الفئة:</strong>
            ${typeLabel}
          </p>

          <p>
            <strong>التخصص:</strong>
            ${r.specialty || "غير محدد"}
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

          ${
            r.mapLocation
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

          ${
            r.description
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
          <div
            class="comments-list"
            id="comments-${r.id}">
            جارٍ تحميل التعليقات...
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

    container.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (err) {

    console.error(
      "showCategoryRegistrations error:",
      err
    );

    container.innerHTML = `
      <div class="no-registrations">
        حدث خطأ أثناء جلب النتائج
      </div>
    `;
  }

};

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
  window.selectRegistrationType = function(type) {
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


const regTypeSelect = document.getElementById("regType");
const specialtyGroup = document.getElementById("specialtyGroup");
const specialtySelect = document.getElementById("specialty");

if (regTypeSelect && specialtyGroup && specialtySelect) {

  regTypeSelect.addEventListener("change", function () {

    const type = this.value;

    specialtySelect.innerHTML =
      '<option value="">اختر التخصص</option>';

    if (type === "maintenance") {

      maintenanceSpecialties.forEach(item => {
        specialtySelect.innerHTML +=
          `<option value="${item}">${item}</option>`;
      });

      specialtyGroup.style.display = "block";

    } else if (type === "seller") {

      sellerSpecialties.forEach(item => {
        specialtySelect.innerHTML +=
          `<option value="${item}">${item}</option>`;
      });

      specialtyGroup.style.display = "block";

    } else if (type === "both") {

      const allSpecialties = [
        ...maintenanceSpecialties,
        ...sellerSpecialties
      ];

      allSpecialties.forEach(item => {
        specialtySelect.innerHTML +=
          `<option value="${item}">${item}</option>`;
      });

      specialtyGroup.style.display = "block";

    } else {

      specialtyGroup.style.display = "none";
      specialtySelect.value = "";

    }

  });

}
  // إغلاق نافذة التسجيل
  window.closeModal = function () {
    const el = document.getElementById("registrationModal");
    if (el) el.classList.remove("active");
  };

  // حفظ التسجيلات
  const registrationForm = document.getElementById("registrationForm");

  if (registrationForm) {
    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();


const data = {
  name: document.getElementById("name")?.value || "",
  phone: document.getElementById("phone")?.value || "",
  city: document.getElementById("city")?.value || "",
  region: document.getElementById("region")?.value || "",
  regType: document.getElementById("regType")?.value || "",
  specialty: document.getElementById("specialty")?.value || "",
  workDays: document.getElementById("workDays")?.value || "",
  workHours: document.getElementById("workHours")?.value || "",
  mapLocation: document.getElementById("mapLocation")?.value || "",
  description: document.getElementById("description")?.value || ""
};

const ok = await saveRegistration(data);
      if (ok) {
        alert("تم الحفظ");
        registrationForm.reset();
        const regModal = document.getElementById("registrationModal");
        if (regModal) regModal.classList.remove("active");
        // بعد الحفظ، نعيد تحميل قائمة المحلات ليظهر للجميع
        loadRegistrations();
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    });
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

  if (!ok) {
    alert("حدث خطأ أثناء الحفظ");
    return;
  }

  document.getElementById(`comment-${shopId}`).value = "";
  document.getElementById(`name-${shopId}`).value = "";

  await loadComments(shopId);
};

  // تحميل التعليقات
  async function loadComments(shopId) {

    const box = document.getElementById(`comments-${shopId}`);

    if (!box) return;

    const comments = await getComments(shopId);
    const stats = await getRatingStats(shopId);
const ratingBox =
  document.getElementById(`rating-summary-${shopId}`);

if (ratingBox) {
  ratingBox.textContent =
    `⭐ ${stats.average.toFixed(1)} (${stats.votes} تقييم)`;
}

    if (!Array.isArray(comments) || comments.length === 0) {
      box.innerHTML = "لا توجد تعليقات";
      return;
    }

    box.innerHTML = "";

    comments.forEach(c => {

      box.innerHTML += `
      <div class="comment-card">
        <strong>${c.name}</strong><br>
        <span>${"⭐".repeat(c.rating)}</span>
        <p>${c.comment}</p>
        <hr>
      </div>
    `;

    });

  }


// ================================
// فتح قسم الصيانة أو المبيعات
// ================================
// ================================
// فتح قسم الصيانة أو المبيعات
// ================================

window.openCategory = function (type) {

  const title = document.querySelector(".section-title");
  const grid = document.querySelector(".category-grid");

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
  }
};
});