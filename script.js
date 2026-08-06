import { saveShop, getShops, saveRegistration, getRegistrations } from "./firebase.js";
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
            <a href="tel:${r.phone || ''}"><button>اتصال</button></a>
          </div>
        `;
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

});
