<!DOCTYPE html>
<html>
<head>
    <title>Verifikasi Akun Anda</title>
    <style>
        body { font-family: Poppins, sans-serif; background-color: #f8fafc; padding: 20px; color: #334155; }
        .card { background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .logo { font-size: 24px; font-weight: bold; color: #4f46e5; text-align: center; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; }
        .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://tigo-ipb.up.railway.app/tigo-logo.svg" alt="Logo Tigo" style="max-width: 150px; height: auto;">
        </div>
        <h2>Halo, {{ $nama }}!</h2>
        <p>Terima kasih telah mendaftar di website kami. Sedikit langkah lagi, silakan klik tombol di bawah ini untuk mengaktifkan akun Anda:</p>
        
        <div style="text-align: center;">
            <a href="{{ $linkVerifikasi }}" class="btn">Verifikasi Akun Saya</a>
        </div>

        <p style="margin-top: 25px; font-size: 13px; color: #64748b;">Jika tombol di atas tidak berfungsi, Anda juga bisa menyalin link berikut ke browser Anda:<br>{{ $linkVerifikasi }}</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} Tigo IPB. All rights reserved.
        </div>
    </div>
</body>
</html>