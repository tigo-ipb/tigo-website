<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifikasiEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $nama;
    public $linkVerifikasi;

    public function __construct($nama, $linkVerifikasi)
    {
        $this->nama = $nama;
        $this->linkVerifikasi = $linkVerifikasi;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verifikasi Pendaftaran Akun Baru',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify', // Mengarah ke blade verifikasi
        );
    }
}