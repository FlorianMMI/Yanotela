'use client';

import React, { useEffect, useState } from 'react';
import Icon from '../Icon';
import { GetNotes } from '@/loader/loader';

export default function TotalNotes() {
    const [totalNotes, setTotalNotes] = useState<number | null>(null);

    useEffect(() => {
        async function fetchTotalNotes() {
            try {
                const { totalNotes } = await GetNotes();
                setTotalNotes(totalNotes);
            } catch (error) {
                console.error('Error fetching total notes:', error);
            }
        }

        fetchTotalNotes();
    }, []);

    return (
        <div className='flex flex-col items-center justify-center p-8 m-2 bg-white rounded-xl shadow-md w-fit h-fit border border-gray-200 hover:bg-red-100 hover:border-red-500 transition-all cursor-pointer group'>
            <Icon name='docs' size={50} className='text-primary mb-4' />
            <div className='flex flex-row items-center justify-center space-x-2'>

                <p className="text-2xl font-semibold text-gray-800 group-hover:text-primary">{totalNotes !== null ? totalNotes : '...'}</p>
                <p className="text-lg text-gray-500 group-hover:text-primary">Notes</p>

            </div>
        </div>
    );
}