import React from 'react';
import "./globals.css";
import Image from 'next/image';
import Link from 'next/link';

export default function GlobalNotFound() {
    return (
        <main className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 items-center justify-center">
                <div className="col-span-full flex flex-col items-center">
                    <Image src="/404.png" width={300} height={300} alt="404 Not Found" />
                    <Image src="/oups.png" width={100} height={100} className="mt-16" alt="Oups" />
                    <p className="text-foreground">On dirait que la page que vous recherchez n&apos;existe pas...</p>
                    <Link href="/notes" className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-primary transition">Retour à mes notes</Link>
                </div>
            </div>
        </main>
    );
}