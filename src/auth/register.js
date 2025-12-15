import { API } from "../api.js";

export function registerPage() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <h2>Daftar Tamu</h2>
        <input id="username" placeholder="Username">
        <input id="email" placeholder="Email">
        <input id="password" type="password" placeholder="Password">
        <input id="nama" placeholder="Nama Lengkap">
        <select id="jk">
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
        </select>

        <button id="regBtn">Daftar</button>
    `;

    document.getElementById("regBtn").onclick = register;
}

async function register() {
    const payload = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        nama: document.getElementById("nama").value,
        jk: document.getElementById("jk").value
    };

    const res = await fetch(API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
        alert("Berhasil daftar!");
        window.location.hash = "/login";
    } else {
        alert(JSON.stringify(data));
    }
}
