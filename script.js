import {
  saveShop,
  getShops,
  saveRegistration,
  getRegistrations,
  saveComment,
  getComments
} from "./firebase.js";
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
    registrationsContainer.innerHTML = '<div class="loading">جارٍ تحميل المحلات...</div>';
    try {
      const regs = await getRegistrations();
      if (!Array.isArray(regs) || regs.length === 0) {
        registrationsContainer.innerHTML = '<div class="no-registrations">لا توجد محلات مسجلة حتى الآن</div>';
        return;
      }

      registrationsContainer.innerHTML = '';
      regs.forEach(r => {
        const typeLabel = r.regType === 'seller' ? 'بائع' : (r.regType === 'maintenance' ? 'صيانة' : r.regType || '');
        registrationsContainer.innerHTML += `
          <div class="registration-card">
            <h3>${r.name || r.shopName || 'بدون اسم'}</h3>
            <p><strong>النوع:</strong> ${typeLabel}</p>
            <p><strong>الاختصاص:</strong> ${r.specialty || ''}</p>
            <p><strong>المنطقة/الحي:</strong> ${r.region || ''}</p>
            <p><strong>العنوان:</strong> ${r.address || ''}</p>
            <p><strong>أقرب نقطة دالة:</strong> ${r.landmark || ''}</p>
            <p><strong>الهاتف:</strong> ${r.phone || ''}</p>
            <a href="tel:${r.phone || ''}">
                <button>📞 اتصال</button>
            </a>

            <hr>

            <h4>💬 التعليقات</h4>

            <div class="comments-list" id="comments-${r.id}">
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

            <button class="comment-btn"
                    onclick="sendComment('${r.id}')">
                إرسال التعليق
            </button>
          </div>
        `;

        // Load comments for this registration right after rendering its card
        loadComments(r.id);
      });
    } catch (err) {
      console.error('loadRegistrations error:', err);
      registrationsContainer.innerHTML = '<div class="no-registrations">حدث خطأ أثناء جلب المحلات</div>';
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

      const sameType = r.regType === type;

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
          ? "مبيعات"
          : "صيانة";

      container.innerHTML += `

        <div class="registration-card">

          <h3>
            ${r.name || r.shopName || "بدون اسم"}
          </h3>

          <p>
            <strong>النوع:</strong>
            ${typeLabel}
          </p>

          <p>
            <strong>الاختصاص:</strong>
            ${r.specialty || ""}
          </p>

          <p>
            <strong>المنطقة:</strong>
            ${r.region || ""}
          </p>

          <p>
            <strong>العنوان:</strong>
            ${r.address || ""}
          </p>

          <p>
            <strong>الهاتف:</strong>
            ${r.phone || ""}
          </p>

          <a href="tel:${r.phone || ""}">
            <button>📞 اتصال</button>
          </a>

          <hr>

          <h4>💬 التعليقات</h4>

          <div
            class="comments-list"
            id="comments-${r.id}">
            جارٍ تحميل التعليقات...
          </div>

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
        address: document.getElementById("address")?.value || "",
        region: document.getElementById("region")?.value || "",
        landmark: document.getElementById("landmark")?.value || "",
        regType: document.getElementById("regType")?.value || "",
        specialty: document.getElementById("specialty")?.value || ""
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
  window.sendComment = async function (shopId) {

    const name = document.getElementById(`name-${shopId}`).value.trim();
    const comment = document.getElementById(`comment-${shopId}`).value.trim();
    const rating = parseInt(document.getElementById(`rating-${shopId}`).value);

    if (!comment) {
      alert("اكتب تعليقاً أولاً");
      return;
    }

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

    loadComments(shopId);
  };

  // تحميل التعليقات
  async function loadComments(shopId) {

    const box = document.getElementById(`comments-${shopId}`);

    if (!box) return;

    const comments = await getComments(shopId);

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
           onclick="showCategoryRegistrations('maintenance', 'حداد')">
        <div class="category-icon maintenance-icon">🔨</div>
        <h3>حداد</h3>
        <p>أعمال الحدادة</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'فيتر')">
        <div class="category-icon maintenance-icon">🔧</div>
        <h3>فيتر</h3>
        <p>صيانة السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'كهربائي')">
        <div class="category-icon maintenance-icon">⚡</div>
        <h3>كهربائي</h3>
        <p>الأعمال الكهربائية</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'تبريد وتكييف')">
        <div class="category-icon maintenance-icon">❄️</div>
        <h3>تبريد وتكييف</h3>
        <p>صيانة أجهزة التبريد</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'سباك')">
        <div class="category-icon maintenance-icon">🚰</div>
        <h3>سباك</h3>
        <p>أعمال السباكة</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('maintenance', 'تنظيف')">
        <div class="category-icon maintenance-icon">🧹</div>
        <h3>تنظيف</h3>
        <p>خدمات التنظيف</p>
      </div>

    `;

  } else if (type === "seller") {

    title.textContent = "🛒 فئات المبيعات";

    grid.innerHTML = `

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'سيارات')">
        <div class="category-icon sales-icon">🚗</div>
        <h3>سيارات</h3>
        <p>بيع وشراء السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'قطع غيار')">
        <div class="category-icon sales-icon">🔩</div>
        <h3>قطع غيار</h3>
        <p>قطع غيار السيارات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'إطارات')">
        <div class="category-icon sales-icon">🛞</div>
        <h3>إطارات</h3>
        <p>إطارات وعجلات</p>
      </div>

      <div class="category-card"
           onclick="showCategoryRegistrations('seller', 'بطاريات')">
        <div class="category-icon sales-icon">🔋</div>
        <h3>بطاريات</h3>
        <p>بطاريات السيارات</p>
      </div>

    `;

  }

};
});