import React from "react";
import Icon from "./Icon";

interface NotificationProps {
    title: string;
    author: string;
}


export default function Notification({ title, author }: NotificationProps) {
    return (
        <>
            <div className="flex flex-col gap-2 relative after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:border-b after:border-b-gray-300 hover:after:border-b-[#882626] transition-all duration-200 ease-in-out p-3 rounded-md hover:bg-white/5 hover:shadow-md hover:scale-[1.01] cursor-pointer">
                <h3 className="font-bold flex text-primary">{title}</h3>
                <div className="flex flex-row gap-5 items-center">

                    <p className="text-gray-500"><span className="font-bold">{author}</span> vous a invité à rejoindre cette note</p>
                    <Icon name="Checkk" size={20} className=" text-green-500"/>

                </div>
                
            </div>
        </>
    );
}