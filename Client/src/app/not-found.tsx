import React from 'react';
import "./globals.css";
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/ui/Icon';

export default function GlobalNotFound() {
    return (
        <main className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 min-h-full items-center justify-center">
                <div className="col-span-full flex flex-col items-center">
                    <Icon
                        name="404"
                        className="col-span-full mx-auto mb-8"
                        width={200}
                        height={200}
                        // strokeWidth={16}
                    />
                    <h1 className="mb-4 text-primary">
                        <Icon name="oups" width={200} height={60}strokeWidth={8} />
                        {/* - Page introuvable */}
                        </h1>
                    <p className="text-foreground">On dirait que la page que vous recherchez n&apos;existe pas...</p>
                    <Link href="/notes" className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-primary transition">Retour à mes notes</Link>
                </div>
            </div>
        </main>
    );
}