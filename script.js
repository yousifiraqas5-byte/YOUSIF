import { saveShop, getShops } from "./firebase.js";

const form = document.getElementById("shopForm");
const list = document.getElementById("shopsList");

async function loadShops() {

    list.innerHTML = "";

    const shops = await getShops();

    shops.forEach(shop => {

        list.innerHTML += `
        <div class="shop-card">
            <h3>${shop.shopName}</h3>
            <p><b>الاختصاص:</b> ${shop.speciality}</p>
            <p><b>المحافظة:</b> ${shop.city}</p>
            <p><b>المنطقة:</b> ${shop.area}</p>
            <p><b>الهاتف:</b> ${shop.phone}</p>
            <a href="tel:${shop.phone}">
                <button>اتصال</button>
            </a>
        </div>
        `;

    });

}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = {

        shopName: document.getElementById("shopName").value,
        speciality: document.getElementById("speciality").value,
        city: document.getElementById("city").value,
        area: document.getElementById("area").value,
        phone: document.getElementById("phone").value

    };

    await saveShop(data);

    alert("تم حفظ المحل");

    form.reset();

    loadShops();

});

loadShops();
