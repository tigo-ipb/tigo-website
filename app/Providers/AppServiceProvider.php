<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum; // <-- Tambahkan ini
use App\Models\PersonalAccessToken;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;
use Illuminate\Support\Facades\URL;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use App\Mail\VerifikasiEmail;
use App\Mail\LupaPasswordEmail;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
        Mail::extend('brevo', function (array $config = []) {
            return (new BrevoTransportFactory)->create(
                new Dsn(
                    'brevo+api',
                    'default',
                    config('services.brevo.key')
                )
            );
        });
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            // $notifiable adalah data User, $url adalah link aman dari Laravel
            return (new VerifikasiEmail($notifiable->name, $url))
                        ->to($notifiable->email);
        });

        // 2. Timpa Email Lupa Password Bawaan Laravel
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            // Buat link reset password bawaan Breeze
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new LupaPasswordEmail($url))
                        ->to($notifiable->email);
        });
    }
}
