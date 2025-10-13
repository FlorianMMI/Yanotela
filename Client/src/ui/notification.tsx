import React from "react";
import Icon from "./Icon";
import { AcceptNotification, RefuseNotification } from "@/loader/loader";

interface NotificationProps {
    id: string;
    title: string;
    author: string;
    onNotificationUpdate?: () => void;
}

export default function Notification({ id, title, author, onNotificationUpdate }: NotificationProps) {
    const handleUpdateNotification = async (event?: React.MouseEvent<HTMLDivElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        try {
            await AcceptNotification(id);
            // Appeler le callback pour rafraîchir la liste
            onNotificationUpdate?.();
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la notification:", error);
        }
    };
    const handleRefuseNotification = async (event?: React.MouseEvent<HTMLDivElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        try {
            await RefuseNotification(id);
            // Appeler le callback pour rafraîchir la liste
            onNotificationUpdate?.();
        } catch (error) {
            console.error("Erreur lors du refus de la notification:", error);
        }
    };
    return (
        <>
            <div className="flex flex-col relative after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:border-b after:border-b-gray-300 hover:after:border-b-[#882626] transition-all duration-200 ease-in-out rounded-md hover:bg-white/5 hover:shadow-md hover:scale-[1.01] cursor-pointer">
                <h3 className=" pl-2 font-bold flex text-primary">{title}</h3>
                <div className="flex flex-row gap-3 pl-2 items-center">

                    <p className="text-gray-500 text-sm "><span className="font-bold">{author}</span> vous a invité à rejoindre cette note</p>
                    <div onClick={handleUpdateNotification}><Icon  name="Checkk" size={20} className=" text-green-500"/></div>
                    <div onClick={handleRefuseNotification}><Icon  name="close" size={20} className=" text-red-500"/></div>

                </div>
                
            </div>
        </>
    );
}