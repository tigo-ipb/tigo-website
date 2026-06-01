<!DOCTYPE html>
<html>
<head>
    <title>Atur Ulang Kata Sandi</title>
    <style>
        body { font-family: Poppins, sans-serif; background-color: #f8fafc; padding: 20px; color: #334155; }
        .card { background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .logo { font-size: 24px; font-weight: bold; color: #ef4444; text-align: center; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; }
        .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-top: 20px; font-size: 13px; color: #991b1b; }
        .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://tigo-ipb.up.railway.app/tigo-logo.svg" alt="Logo Tigo" style="max-width: 150px; height: auto;">
        </div>
        <h2>Permintaan Atur Ulang Password</h2>
        <p>Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        
        <div style="text-align: center;">
            <a href="{{ $linkReset }}" class="btn">Atur Ulang Password</a>
        </div>

        <div class="warning">
            <strong>Penting:</strong> Link ini hanya berlaku selama 60 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini dan password Anda akan tetap aman.
        </div>
        
        <div class="footer">
            &copy; {{ date('Y') }} Tigo IPB. All rights reserved.
        </div>
    </div>
</body>
</html>