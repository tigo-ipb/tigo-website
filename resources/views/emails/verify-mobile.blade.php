<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333333; margin-bottom: 20px; }
        .otp-box { background-color: #f0fdf4; border: 2px dashed #16a34a; color: #16a34a; font-size: 32px; font-weight: bold; text-align: center; padding: 15px; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Selamat Datang di Tigo IPB! </h2>
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar. Untuk menyelesaikan proses registrasi dan mengamankan akun Anda, silakan masukkan kode OTP berikut ke dalam aplikasi:</p>
        
        <div class="otp-box">
            {{ $otp }}
        </div>
        
        <p><em>Kode ini hanya berlaku selama 15 menit. Jangan berikan kode ini kepada siapa pun, termasuk pihak Tigo.</em></p>
        <p>Salam hangat,<br>Tim Tigo IPB</p>

        <div class="footer">
            &copy; {{ date('Y') }} Tigo IPB. All rights reserved.
        </div>
    </div>
</body>
</html>