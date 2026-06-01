<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LupaPasswordEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $linkReset;

    public function __construct($linkReset)
    {
        $this->linkReset = $linkReset;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Instruksi Atur Ulang Kata Sandi Akun Anda',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password', // Mengarah ke blade lupa password
        );
    }
}