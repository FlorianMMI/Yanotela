import React from 'react';
import "./globals.css";
import Image from 'next/image';
import Link from 'next/link';

export default function GlobalNotFound() {
    return (
        <main className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 min-h-screen items-center justify-center">
                <div className="col-span-full flex flex-col items-center justify-center bg-bg border-2 border-primary border-dashed rounded-xl gap-8 p-8">
                    <Image
                        src="/logo.svg"
                        alt="Yanotela."
                        width={200}
                        height={200}
                        className="col-span-full mx-auto mb-8"
                    />
                    <h1 className="text-2xl font-bold mb-4 text-primary">404 - Page introuvable</h1>
                    <p className="text-foreground">On dirait que la page que vous recherchez n&apos;existe pas...</p>
                    <Link href="/" className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-primary transition">Retour à l&apos;accueil</Link>
                </div>
            </div>
        </main>
    );
}
