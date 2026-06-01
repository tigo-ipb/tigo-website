<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Poppins, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #dc2626; margin-bottom: 20px; }
        .otp-box { background-color: #fef2f2; border: 2px dashed #dc2626; color: #dc2626; font-size: 32px; font-weight: bold; text-align: center; padding: 15px; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://tigo-ipb.up.railway.app/tigo-logo.svg" alt="Logo Tigo" style="max-width: 150px; height: auto;">
        </div>
        <h2 class="header">Permintaan Reset Password</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun Tigo Anda. Silakan masukkan 6 digit kode OTP berikut ke dalam aplikasi untuk membuat password baru:</p>
        
        <div class="otp-box">
            {{ $otp }}
        </div>
        
        <p><em>Kode ini hanya berlaku selama 15 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan akun Anda akan tetap aman.</em></p>
        <p>Salam hangat,<br>Tim Tigo IPB</p>

        <div class="footer">
            &copy; {{ date('Y') }} Tigo IPB. All rights reserved.
        </div>
    </div>
</body>
</html>