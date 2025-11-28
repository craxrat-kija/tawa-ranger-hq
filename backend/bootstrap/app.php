<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \App\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias([
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);

        // Exclude all API routes from CSRF verification (we use Bearer tokens for authentication)
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'api/login',
            'api/super-admin/login',
            'api/register',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
