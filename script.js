import { saveShop, getShops, saveRegistration } from "./firebase.js";
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
});
// فتح نافذة اختيار نوع التسجيل
window.openModal = function () {
  document.getElementById("typeModal").classList.add("active");
};

// إغلاق نافذة اختيار النوع
window.closeTypeModal = function () {
  document.getElementById("typeModal").classList.remove("active");
};

// اختيار بائع أو صيانة
window.selectRegistrationType = function(type) {
  document.getElementById("typeModal").classList.remove("active");

  const regType = document.getElementById("regType");
  if (regType) {
    regType.value = type;
  }

  document.getElementById("registrationModal").classList.add("active");
};

// إغلاق نافذة التسجيل
window.closeModal = function () {
  document.getElementById("registrationModal").classList.remove("active");
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
    } else {
      alert("حدث خطأ أثناء الحفظ");
    }
  });
}