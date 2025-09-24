// /reset-password

import React, { useState } from 'react';
import { PassThrough } from 'stream';


export async function resetPassword($password: string, $token: string): Promise<any> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        console.log('API URL:', apiUrl); // Pour debug

        const response = await fetch(`${apiUrl}/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Ajoutez ici les données nécessaires pour le reset password
            body: JSON.stringify({
                password: $password,
                token: $token
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error resetting password:", error);
        return null;
    }
}