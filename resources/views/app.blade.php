<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <meta name="title" content="Tigo App - Ticketing & Event Management IPB">
        <meta name="description" content="Platform Ticketing eksklusif untuk mahasiswa IPB. Temukan dan ikuti berbagai event kampus dengan mudah!">
        <link rel="icon" type="image/png" href="{{ asset('/tigo-logo.png') }}">

        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="Tigo App - Ticketing & Event Management IPB">
        <meta property="og:description" content="Platform Ticketing eksklusif untuk mahasiswa IPB. Temukan dan ikuti berbagai event kampus dengan mudah!">
        <meta property="og:image" content="{{ asset('/tigo-logo.png') }}">

        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{{ url()->current() }}">
        <meta property="twitter:title" content="Tigo IPB - Ticketing & Event Management IPB">
        <meta property="twitter:description" content="Platform Ticketing eksklusif untuk mahasiswa IPB. Temukan dan ikuti berbagai event kampus dengan mudah!">
        <meta property="twitter:image" content="{{ asset('/tigo-logo.png') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
