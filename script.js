// Tunggu sampai form di-submit (tombol Masuk diklik)
document.getElementById('loginForm').addEventListener('submit', function (e) {

  // Mencegah halaman reload otomatis (default browser)
  e.preventDefault();

  // Ambil nilai yang diketik user
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  // ⚠️ Ini akun demo sementara, nanti kita ganti pakai sistem yang lebih aman
  const validUsername = 'admin';
  const validPassword = 'rmik123';

  if (username === validUsername && password === validPassword) {
    // Kalau benar: simpan status "sudah login" lalu pindah halaman
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('namaPetugas', username);
    window.location.href = 'dashboard.html';
  } else {
    // Kalau salah: tampilkan pesan error
    errorMsg.textContent = 'NIP atau kata sandi salah. Silakan coba lagi.';
  }
});