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
} from "./firebase.js";

document.addEventListener('DOMContentLoaded', () => {
  // كان معرّف الفورم في الكود القديم "shopForm" بينما الفورم الفعلي في
  // index.html معرّفه "registrationForm" — هذا كان يمنع أي submit listener
  // من العمل إطلاقًا. تم التصحيح هنا.
  const form = document.getElementById("registrationForm");

  // ---------------------------------------------------------------------
  // أداة تنظيف النصوص لمنع XSS: أي بيانات قادمة من المستخدم (اسم محل،
  // تعليق، وصف...) يجب أن تمر من هنا قبل إدراجها داخل innerHTML.
  // ---------------------------------------------------------------------
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  // يتحقق أن الرابط يبدأ بـ http/https قبل استخدامه كـ href، لمنع حقن
  // روابط من نوع javascript: عبر حقل "الموقع على الخريطة".
  function isSafeUrl(url) {
    try {
      const u = new URL(String(url), window.location.href);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  // يبقي فقط الأرقام و + في رقم الهاتف (يمنع حقن أي HTML/سكربت عبره
  // ويصلح استخدامه داخل روابط tel: وداخل onclick).
  function sanitizePhone(value) {
    return String(value ?? "").replace(/[^\d+]/g, "");
  }

  function timeToMillis(v) {
    if (!v) return 0;
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000;
    if (v instanceof Date) return v.getTime();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function attachPhoneLongPress(root) {
    if (!root) return;
    root.querySelectorAll(".shop-phone").forEach(el => {
      let startX = 0, startY = 0, pressed = false, timer = null;
      const cancel = () => {
        pressed = false;
        if (timer) { clearTimeout(timer); timer = null; }
      };
      el.addEventListener("pointerdown", (e) => {
        startX = e.clientX; startY = e.clientY; pressed = true;
        timer = setTimeout(() => {
          timer = null;
          if (pressed) showPhoneActions(el.dataset.phone, e);
        }, 600);
      });
      el.addEventListener("pointermove", (e) => {
        if (pressed && (Math.abs(e.clientX - startX) > 12 || Math.abs(e.clientY - startY) > 12)) cancel();
      });
      el.addEventListener("pointerup", cancel);
      el.addEventListener("pointercancel", cancel);
      el.addEventListener("pointerleave", cancel);
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        cancel();
        showPhoneActions(el.dataset.phone, e);
      });
    });
  }

  function showPhoneActions(phone, e) {
    closePhoneActions();
    const safePhone = sanitizePhone(phone);
    const overlay = document.createElement("div");
    overlay.className = "phone-action-overlay";
    overlay.onclick = closePhoneActions;
    const panel = document.createElement("div");
    panel.className = "phone-action-panel";
    panel.innerHTML = `
      <div class="phone-action-title">📞 ${escapeHTML(safePhone)}</div>
      <button type="button" data-action="call">📞 اتصال</button>
      <button type="button" data-action="copy">📋 نسخ الرقم</button>
      <button type="button" class="phone-action-cancel" data-action="cancel">إلغاء</button>
    `;
    panel.querySelector('[data-action="call"]').addEventListener("click", () => {
      window.location.href = `tel:${safePhone}`;
    });
    panel.querySelector('[data-action="copy"]').addEventListener("click", () => {
      window.copyPhone(safePhone);
    });
    panel.querySelector('[data-action="cancel"]').addEventListener("click", closePhoneActions);
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
      const ta = document.createElement("textarea");
      ta.value = phone;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    closePhoneActions();
    alert("✅ تم نسخ رقم الهاتف");
  };

  window.attachPhoneLongPress = attachPhoneLongPress;

  function starWidgetHTML(shopId) {
    const safeId = escapeHTML(shopId);
    const starList = [5, 4, 3, 2, 1].map(v =>
      `<span class="star" data-v="${v}" data-shop-id="${safeId}" data-filled="false">☆</span>`
    ).join("");

    return `
      <span class="shop-rating-top">
        <span class="star-widget" id="top-star-${safeId}">${starList}</span>
        <span class="rating-summary" id="top-rating-${safeId}">⭐ 0.0 (0 تقييم)</span>
      </span>
    `;
  }

  // يضبط شكل نجمة واحدة (مليانة ★ أو فارغة ☆) ويحفظ حالتها الحقيقية في
  // data-filled حتى يقدر hover يرجّعها لحالتها الصحيحة بعد ما يبعد الماوس،
  // بدل الاعتماد فقط على كلاس CSS قد ما يكون مفعّل شكل مختلف.
  function setStarFilled(starEl, filled) {
    starEl.dataset.filled = filled ? "true" : "false";
    starEl.textContent = filled ? "★" : "☆";
    starEl.classList.toggle("selected", filled);
  }

  // تفعيل نجوم التقييم عبر addEventListener بدل onclick/onmouseover المضمّنة
  // في HTML (أنظف وأكثر أمانًا، ويعمل بشكل صحيح مع معرّفات تحتوي رموزًا خاصة).
  function attachStarWidgetEvents(root) {
    if (!root) return;
    root.querySelectorAll(".star-widget").forEach(widget => {
      const stars = widget.querySelectorAll(".star");
      stars.forEach(star => {
        const shopId = star.dataset.shopId;
        const v = Number(star.dataset.v);
        star.addEventListener("click", () => window.rateShop(shopId, v));
        star.addEventListener("mouseover", () => {
          stars.forEach(s => {
            const isPreviewFilled = Number(s.dataset.v) <= v;
            s.textContent = isPreviewFilled ? "★" : "☆";
            s.classList.toggle("hover", isPreviewFilled);
          });
        });
        star.addEventListener("mouseout", () => {
          stars.forEach(s => {
            s.textContent = s.dataset.filled === "true" ? "★" : "☆";
            s.classList.remove("hover");
          });
        });
      });
    });
  }

  function renderReviewSection(shopId) {
    const safeId = escapeHTML(shopId);
    return `
      <hr>
      <div class="review-block">
        <h4>💬 التعليقات</h4>
        <div class="comments-list" id="comments-${safeId}">
          جارٍ تحميل التعليقات...
        </div>
        <div class="review-form" id="comment-form-${safeId}">
          <div class="comment-input-row">
            <textarea id="comment-${safeId}" placeholder="اكتب تعليقك..."></textarea>
            <button type="button" class="comment-btn" data-shop-id="${safeId}" aria-label="إرسال" title="إرسال">➤</button>
          </div>
        </div>
      </div>
    `;
  }

  function attachCommentButtons(root) {
    if (!root) return;
    root.querySelectorAll(".comment-btn").forEach(btn => {
      btn.addEventListener("click", () => window.sendComment(btn.dataset.shopId));
    });
  }

  function attachCardToggle(root) {
    if (!root) return;
    root.querySelectorAll(".card-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const extra = btn.previousElementSibling;
        if (!extra || !extra.classList.contains("card-extra")) return;
        const open = extra.style.display !== "none";
        extra.style.display = open ? "none" : "block";
        btn.textContent = open ? "▼ عرض التفاصيل" : "▲ إخفاء التفاصيل";
      });
    });
  }

  const registrationsContainer = document.getElementById('registrationsList');

  async function loadRegistrations() {
    if (!registrationsContainer) return;
    registrationsContainer.innerHTML = "جارٍ تحميل المحلات...";
    try {
      const regs = await getRegistrations();
      let allComments = [];
      try {
        allComments = await getAllComments();
      } catch (err) {
        // فشل جلب التعليقات لا يجب أن يمنع عرض قائمة المحلات نفسها.
        allComments = [];
      }
      const latestByShop = {};
      (Array.isArray(allComments) ? allComments : []).forEach(c => {
        const t = timeToMillis(c.createdAt);
        if (t > (latestByShop[c.shopId] || 0)) latestByShop[c.shopId] = t;
      });

      if (!Array.isArray(regs) || regs.length === 0) {
        registrationsContainer.innerHTML = "لا توجد محلات مسجلة حتى الآن";
        return;
      }

      regs.forEach(r => {
        r.__lastActivity = Math.max(timeToMillis(r.createdAt), latestByShop[r.id] || 0);
      });
      regs.sort((a, b) => (b.__lastActivity || 0) - (a.__lastActivity || 0));

      registrationsContainer.innerHTML = "";

      regs.forEach(r => {
        const typeLabel =
          r.regType === "seller" ? "🛒 بيع" :
          r.regType === "maintenance" ? "🔧 صيانة" :
          r.regType === "both" ? "🔧🛒 صيانة + بيع" : (r.regType || "");

        const specialties = Array.isArray(r.specialties) ? r.specialties.join("، ") : (r.specialty || "غير محدد");
        const safePhone = r.phone ? sanitizePhone(r.phone) : "";

        registrationsContainer.innerHTML += `
        <div class="registration-card">
          <h3>
            <span class="shop-name">${escapeHTML(r.name || r.shopName || "بدون اسم")}</span>
            ${starWidgetHTML(r.id)}
          </h3>
          <p><strong>الفئة:</strong> ${escapeHTML(typeLabel)}</p>
          <p><strong>التخصصات:</strong> ${escapeHTML(specialties)}</p>
          <p><strong>المحافظة:</strong> ${escapeHTML(r.city || "")}</p>
          <p><strong>المنطقة:</strong> ${escapeHTML(r.region || "")}</p>
          ${safePhone ? `<p><strong>📞 الهاتف:</strong> <span class="shop-phone" data-phone="${escapeHTML(safePhone)}">${escapeHTML(safePhone)}</span></p>` : ""}

          <div class="card-extra" style="display:none">
            ${r.landmark ? `<p><strong>📍 أقرب نقطة دالة / الشارع:</strong> ${escapeHTML(r.landmark)}</p>` : ""}
            <p><strong>أيام الدوام:</strong> ${escapeHTML(r.workDays || "غير محدد")}</p>
            <p><strong>أوقات الدوام:</strong> ${escapeHTML(r.workHours || "غير محدد")}</p>
            ${r.mapLocation && isSafeUrl(r.mapLocation) ? `<p><strong>🗺️ الموقع:</strong> <a href="${escapeHTML(r.mapLocation)}" target="_blank" rel="noopener noreferrer">فتح الموقع على الخريطة 📍</a></p>` : ""}
            ${r.description ? `<p><strong>📝 الوصف:</strong> ${escapeHTML(r.description)}</p>` : ""}
            ${renderReviewSection(r.id)}
          </div>

          <button type="button" class="card-toggle-btn">▼ عرض التفاصيل</button>
        </div>`;
      });

      attachPhoneLongPress(registrationsContainer);
      attachStarWidgetEvents(registrationsContainer);
      attachCommentButtons(registrationsContainer);
      attachCardToggle(registrationsContainer);
      regs.forEach(r => loadComments(r.id));
    } catch (err) {
      registrationsContainer.innerHTML = `<div class="no-registrations">حدث خطأ أثناء جلب المحلات</div>`;
    }
  }

  window.loadRegistrations = loadRegistrations;

  // يجمع القيم المحدَّدة (checked) لمجموعة checkboxes حسب name، إن وُجدت.
  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
  }

  if (form) {
    const regTypeSelect = document.getElementById("regType");
    const specialtyGroup = document.getElementById("specialtyGroup");
    const specialtyOptions = document.getElementById("specialtyOptions");

    const regMaintenance = [
      "فني تبريد وتكييف", "كهربائي سيارات", "فيتر (ميكانيكي)", "حداد صدر",
      "سمكري", "صباغ سيارات", "ميزان وبالنص", "تبديل زيت وفلاتر",
      "صيانة إيرباك", "صيانة ABS", "بريكات", "صيانة جير أوتوماتيك",
      "برمجة وفحص كمبيوتر", "بطاريات", "إطارات وبنجرجي", "تبديل زجاج",
      "صيانة رديتر", "عادم (إكزوزت)", "مفاتيح سيارات وبرمجة ريموت", "تلميع وحماية"
    ];
    const regSeller = [
      "قطع غيار", "إكسسوارات", "زيوت وفلاتر", "بطاريات",
      "إطارات", "جنوط", "إنارة", "أجهزة فحص"
    ];

    const fillSpecialties = () => {
      if (!regTypeSelect || !specialtyOptions) return;
      const type = regTypeSelect.value;
      specialtyOptions.innerHTML = "";
      const list = type === "maintenance" ? regMaintenance :
                    type === "seller" ? regSeller :
                    type === "both" ? [...regMaintenance, ...regSeller] : [];
      list.forEach(s => {
        const id = "spec_" + s.replace(/[^\w]/g, "_");
        specialtyOptions.insertAdjacentHTML("beforeend",
          `<label class="specialty-checkbox" for="${id}">
            <input type="checkbox" id="${id}" name="specialties" value="${s}">
            <span>${s}</span>
          </label>`);
      });
    };

    if (regTypeSelect && specialtyGroup) {
      regTypeSelect.addEventListener("change", () => {
        fillSpecialties();
        specialtyGroup.style.display = regTypeSelect.value ? "" : "none";
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim() || "";
      const city = document.getElementById("city")?.value.trim() || "";
      const region = document.getElementById("region")?.value.trim() || "";

      if (!name || !city || !region) {
        alert("الرجاء تعبئة الحقول المطلوبة: اسم المحل، المحافظة، المنطقة");
        return;
      }

      const selectedSpecialties = getCheckedValues("specialties");
      if (selectedSpecialties.length === 0) {
        alert("الرجاء اختيار تخصص واحد على الأقل");
        return;
      }

      const data = {
        name,
        city,
        region,
        landmark: document.getElementById("landmark")?.value.trim() || "",
        phone: sanitizePhone(document.getElementById("phone")?.value || ""),
        regType: document.getElementById("regType")?.value || "",
        specialties: getCheckedValues("specialties"),
        workDays: document.getElementById("workDays")?.value.trim() || "",
        workHours: document.getElementById("workHours")?.value.trim() || "",
        mapLocation: document.getElementById("mapLocation")?.value.trim() || "",
        description: document.getElementById("description")?.value.trim() || "",
        carOrigins: getCheckedValues("carOrigins")
      };

      try {
        const ok = await saveRegistration(data);
        if (ok) {
          alert("تم حفظ المحل");
          form.reset();
          if (specialtyGroup) specialtyGroup.style.display = "none";
          window.closeModal();
          loadRegistrations();
        } else {
          alert('حدث خطأ أثناء حفظ المحل');
        }
      } catch (err) {
        alert('حدث خطأ غير متوقع');
      }
    });
  }

  loadRegistrations();

  window.openModal = function () {
    const el = document.getElementById("registrationModal");
    if (el) el.classList.add("active");
  };

  window.openRecommendModal = function () {
    const el = document.getElementById("recommendModal");
    if (el) el.classList.add("active");
  };

  window.closeRecommendModal = function () {
    const el = document.getElementById("recommendModal");
    if (el) el.classList.remove("active");
  };

  const recommendForm = document.getElementById("recommendForm");
  if (recommendForm) {
    recommendForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById("recName")?.value.trim() || "",
        phone: sanitizePhone(document.getElementById("recPhone")?.value || ""),
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
        alert("حدث خطأ غير متوقع");
      }
    });
  }

  window.sendComment = async function (shopId) {
    const comment = document.getElementById(`comment-${shopId}`)?.value.trim() || "";
    if (!comment) {
      alert("اكتب تعليقك أولاً");
      return;
    }
    const ok = await saveComment({ shopId, comment });
    if (!ok) {
      alert("حدث خطأ أثناء الحفظ");
      return;
    }
    const commentBox = document.getElementById(`comment-${shopId}`);
    if (commentBox) commentBox.value = "";
    await loadComments(shopId);
  };

  window.rateShop = async function (shopId, value) {
    const widget = document.getElementById(`top-star-${shopId}`);
    const previous = widget && widget.dataset.userRating ? Number(widget.dataset.userRating) : null;
    const starsText = value === 1 ? 'نجمة' : 'نجوم';
    if (previous) {
      const ok = window.confirm(`أنت قيّمت هذا المحل مسبقاً بـ ${previous} ${previous === 1 ? 'نجمة' : 'نجوم'}.\nهل تريد تغيير تقييمك إلى ${value} ${starsText}؟`);
      if (!ok) return;
    }
    const result = await saveRating({ shopId, rating: value });
    if (!result) {
      alert("حدث خطأ أثناء حفظ التقييم");
      return;
    }
    await loadComments(shopId);
  };

  async function loadComments(shopId) {
    const ratingBadges = document.querySelectorAll(`[id="top-rating-${shopId}"]`);
    const starWidgets = document.querySelectorAll(`[id="top-star-${shopId}"]`);
    const boxes = document.querySelectorAll(`[id="comments-${shopId}"]`);
    const box = boxes[0];

    try {
      const ratings = await getRatings(shopId);
      const ratingsList = Array.isArray(ratings) ? ratings : [];
      const votes = ratingsList.length;
      const average = votes ? ratingsList.reduce((sum, c) => sum + (Number(c.rating) || 0), 0) / votes : 0;
      const summaryText = `⭐ ${average.toFixed(1)} (${votes} تقييم)`;

      if (starWidgets.length > 0) {
        const userRating = await getUserRating(shopId);
        starWidgets.forEach(widget => {
          if (userRating) {
            widget.querySelectorAll(".star").forEach(s => {
              const val = Number(s.dataset.v) || 0;
              setStarFilled(s, val <= userRating);
            });
            widget.classList.add("already-rated");
            widget.dataset.userRating = userRating;
            widget.title = `تقييمك الحالي: ${userRating} ${userRating === 1 ? 'نجمة' : 'نجوم'} (اضغط لتعديل)`;
          } else {
            const rounded = Math.round(average);
            widget.querySelectorAll(".star").forEach(s => {
              const val = Number(s.dataset.v) || 0;
              setStarFilled(s, val <= rounded);
            });
            widget.classList.remove("already-rated");
          }
        });

        if (ratingBadges.length > 0) {
          if (userRating) {
            const note = `⭐ تقييمك: ${userRating} ${userRating === 1 ? 'نجمة' : 'نجوم'}`;
            ratingBadges.forEach(b => { b.innerHTML = `${escapeHTML(summaryText)}<br><span class="my-rating-note">${escapeHTML(note)}</span>`; });
          } else {
            ratingBadges.forEach(b => { b.textContent = summaryText; });
          }
        }
      } else if (ratingBadges.length > 0) {
        ratingBadges.forEach(b => { b.textContent = summaryText; });
      }

      const comments = await getComments(shopId);
      const list = Array.isArray(comments) ? comments : [];
      if (box) {
        if (list.length === 0) {
          box.innerHTML = `<p class="no-comments">لا توجد تعليقات بعد، كن أول من يكتب تعليقًا</p>`;
        } else {
          // ترقيم مجهول لكل شخص (uid) حسب أول ظهور له زمنيًا، بحيث نفس
          // الشخص ياخذ نفس الرقم بكل تعليقاته على هذا المحل، شبيه بأسلوب
          // "مشارك مجهول #1" المستخدم بمجموعات فيسبوك.
          const chronological = [...list].sort((a, b) => timeToMillis(a.createdAt) - timeToMillis(b.createdAt));
          const anonNumberByKey = {};
          let nextAnonNumber = 1;
          chronological.forEach(c => {
            const key = c.uid || `__no_uid_${c.id}`;
            if (!(key in anonNumberByKey)) {
              anonNumberByKey[key] = nextAnonNumber++;
            }
          });
          const anonLabel = (c) => {
            const key = c.uid || `__no_uid_${c.id}`;
            return `مشارك مجهول #${anonNumberByKey[key]}`;
          };

          const renderOne = (c) => `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-name">${escapeHTML(anonLabel(c))}</span>
              </div>
              ${c.comment ? `<p class="comment-text">${escapeHTML(c.comment)}</p>` : ""}
            </div>`;
          const visible = list.slice(0, 2).map(renderOne).join("");
          const hidden = list.slice(2).map(renderOne).join("");
          const hiddenHtml = hidden ? `<div class="comments-hidden" style="display:none;">${hidden}</div><button type="button" class="show-more-comments">عرض المزيد (${list.length - 2}+)</button>` : "";
          box.innerHTML = `<div class="comments-visible">${visible}</div>${hiddenHtml}`;

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
      if (box) box.innerHTML = `<p class="no-comments">تعذّر تحميل التعليقات</p>`;
    }
  }

  window.openAsFullPage = function () {
    const homePage = document.querySelector(".container");
    const registrationsList = document.getElementById("registrationsList");
    if (!registrationsList) return;
    document.body.appendChild(registrationsList);
    if (homePage) homePage.style.display = "none";
    registrationsList.style.display = "block";
    registrationsList.style.minHeight = "100vh";
    registrationsList.style.padding = "20px";
    registrationsList.style.boxSizing = "border-box";

    let backButton = document.getElementById("registrationsBackButton");
    if (!backButton) {
      backButton = document.createElement("button");
      backButton.id = "registrationsBackButton";
      backButton.innerHTML = "⬅️ رجوع";
      backButton.style.cssText = "display:block;width:100%;max-width:390px;margin:0 auto 20px auto;padding:14px;border:none;border-radius:15px;font-size:17px;font-weight:bold;cursor:pointer;";
      backButton.onclick = function () {
        registrationsList.style.display = "none";
        if (homePage) {
          homePage.appendChild(registrationsList);
          homePage.style.display = "";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      registrationsList.prepend(backButton);
    } else {
      registrationsList.prepend(backButton);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

window.showCategoryRegistrations = async function (type, specialty) {
    const container = document.getElementById("registrationsList");
    if (!container) return;
    container.innerHTML = "🔍 جارٍ التحميل...";

    if (typeof window.openAsFullPage === "function") window.openAsFullPage();

    try {
      const regs = await getRegistrations();
      const results = regs.filter(r => {
        if (specialty === "__all__") return r.regType === type || r.regType === "both";
        if (r.regType !== type && r.regType !== "both") return false;
        if (Array.isArray(r.specialties)) return r.specialties.includes(specialty);
        if (Array.isArray(r.specialty)) return r.specialty.includes(specialty);
        return String(r.specialty || "").trim() === String(specialty || "").trim();
      });

      if (results.length === 0) {
        container.innerHTML = `<div class="no-registrations">لا توجد محلات مسجلة ضمن: <strong>${specialty === "__all__" ? "هذا القسم" : specialty}</strong></div>`;
        if (typeof window.openAsFullPage === "function") window.openAsFullPage();
        return;
      }

      container.innerHTML = "";
      results.forEach(r => {
        const typeLabel =
          r.regType === "seller" ? "🛒 بيع" :
          r.regType === "maintenance" ? "🔧 صيانة" :
          r.regType === "both" ? "🔧🛒 صيانة + بيع" : (r.regType || "");
        const specialties = Array.isArray(r.specialties) ? r.specialties.join("، ") : (r.specialty || "غير محدد");

        container.innerHTML += `
        <div class="registration-card">
          <h3>
            <span class="shop-name">${r.name || r.shopName || "بدون اسم"}</span>
            ${starWidgetHTML(r.id)}
          </h3>
          <p><strong>الفئة:</strong> ${typeLabel}</p>
          <p><strong>التخصصات:</strong> ${specialties}</p>
          <p><strong>المحافظة:</strong> ${r.city || ""}</p>
          <p><strong>المنطقة:</strong> ${r.region || ""}</p>
          <div class="card-extra" style="display:none">
            ${r.landmark ? `<p><strong>📍 أقرب نقطة دالة / الشارع:</strong> ${r.landmark}</p>` : ""}
            ${r.phone ? `<p><strong>📞 الهاتف:</strong> <span class="shop-phone" data-phone="${r.phone}">${r.phone}</span></p>` : ""}
            ${r.mapLocation ? `<p><strong>🗺️ الموقع:</strong> <a href="${r.mapLocation}" target="_blank">فتح الموقع على الخريطة 📍</a></p>` : ""}
            ${renderReviewSection(r.id)}
          </div>
          <button type="button" class="card-toggle-btn">▼ عرض التفاصيل</button>
        </div>`;
        loadComments(r.id);
      });

      attachPhoneLongPress(container);
      attachCardToggle(container);
      if (typeof window.openAsFullPage === "function") window.openAsFullPage();
    } catch (err) {
      container.innerHTML = `<div class="no-registrations">حدث خطأ أثناء جلب المحلات</div>`;
    }
  };

  window.openRegistrationsPage = function () {
    loadRegistrations().then(() => window.openAsFullPage && window.openAsFullPage());
  };

window.openCategory = async function (type) {
    const title = document.querySelector(".section-title");
    const grid = document.querySelector(".category-grid");
    const backButton = document.getElementById("backToHome");
    if (!title || !grid) {
      console.error("category elements not found");
      return;
    }

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
      "قطع غيار",
      "إكسسوارات",
      "زيوت وفلاتر",
      "بطاريات",
      "إطارات",
      "جنوط",
      "إنارة",
      "أجهزة فحص"
    ];

    if (backButton) {
      backButton.style.display = "block";
      backButton.onclick = function () {
        title.textContent = "الأقسام";
        grid.innerHTML = `
      <div class="category-tile" onclick="openCategory('maintenance')">
        <div class="category-icon maintenance-icon">🔧</div>
        <h3>الصيانة</h3>
        <p>خدمات الصيانة والإصلاح</p>
      </div>
      <div class="category-tile" onclick="openCategory('seller')">
        <div class="category-icon sales-icon">🛒</div>
        <h3>المبيعات</h3>
        <p>المحلات والبائعين</p>
      </div>`;
        grid.classList.remove("specialty-list");
        backButton.style.display = "none";
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }

    const specialties = type === "maintenance" ? maintenanceSpecialties :
                       type === "seller" ? sellerSpecialties : [];

    let allRegs = [];
    try {
      allRegs = await getRegistrations();
    } catch (e) { allRegs = []; }

    const countFor = (s) => allRegs.filter(r =>
      (r.regType === type || r.regType === "both") &&
      (Array.isArray(r.specialties) ? r.specialties.includes(s) :
       Array.isArray(r.specialty) ? r.specialty.includes(s) :
       String(r.specialty || "").trim() === s)
    ).length;

    const totalCount = allRegs.filter(r => r.regType === type || r.regType === "both").length;

    title.textContent = type === "maintenance" ? "🔧 خدمات الصيانة" : "🛒 فئات المبيعات";
    grid.classList.add("specialty-list");

    const allBtn = `<div class="specialty-row" onclick="showCategoryRegistrations('${type}', '__all__')">
        <span class="specialty-icon">📋</span>
        <span class="specialty-name" style="font-weight:bold">عرض جميع المحلات</span>
        <span class="specialty-count">${totalCount}</span>
        <span class="specialty-arrow">‹</span>
      </div>`;

    grid.innerHTML = allBtn + specialties.map(s => {
      const c = countFor(s);
      return `<div class="specialty-row" onclick="showCategoryRegistrations('${type}', '${s}')">
        <span class="specialty-icon">${type === "maintenance" ? "🔧" : "🛒"}</span>
        <span class="specialty-name">${s}</span>
        <span class="specialty-count">${c}</span>
        <span class="specialty-arrow">‹</span>
      </div>`;
    }).join("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.closeModal = function () {
    const el = document.getElementById("registrationModal");
    if (el) el.classList.remove("active");
  };

  // -----------------------------------------------------------------
  // القائمة الجانبية: لم تكن مربوطة بأي JavaScript سابقًا (الأزرار كانت
  // تستدعي دوال غير موجودة أصلًا مثل goToHome/goToComplaints...).
  // -----------------------------------------------------------------
  const sideMenu = document.getElementById("sideMenu");
  const menuButton = document.getElementById("menuButton");
  const menuClose = document.getElementById("menuClose");
  const menuOverlay = document.getElementById("menuOverlay");

  function openSideMenu() {
    if (sideMenu) sideMenu.classList.add("active");
    if (menuOverlay) menuOverlay.classList.add("active");
  }

  function closeSideMenu() {
    if (sideMenu) sideMenu.classList.remove("active");
    if (menuOverlay) menuOverlay.classList.remove("active");
  }

  if (menuButton) menuButton.addEventListener("click", openSideMenu);
  if (menuClose) menuClose.addEventListener("click", closeSideMenu);
  if (menuOverlay) menuOverlay.addEventListener("click", closeSideMenu);

  window.goToHome = function () {
    closeSideMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // الصفحات التالية (الشكاوى / من نحن / اتصل بنا / تسجيل الدخول) غير
  // موجودة بعد في المشروع، فتم وضع دوال placeholder آمنة بدل الأخطاء
  // السابقة (كانت هذه الدوال غير معرّفة إطلاقًا وتسبب ReferenceError).
  // استبدل محتوى كل دالة عند إضافة الصفحة الفعلية لها.
  window.goToComplaints = function () {
    closeSideMenu();
    alert("صفحة الشكاوي قيد الإعداد حاليًا");
  };

  window.goToAbout = function () {
    closeSideMenu();
    alert("صفحة \"من نحن\" قيد الإعداد حاليًا");
  };

  window.goToContact = function () {
    closeSideMenu();
    alert("صفحة \"اتصل بنا\" قيد الإعداد حاليًا");
  };

  window.login = function () {
    closeSideMenu();
    alert("ميزة تسجيل الدخول قيد الإعداد حاليًا");
  };

  // ربط أزرار الأقسام الرئيسية بدون onclick مضمّن في HTML.
  document.querySelectorAll('[data-category]').forEach(el => {
    el.addEventListener("click", () => window.openCategory(el.dataset.category));
  });
});
