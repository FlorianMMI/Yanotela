import { Prisma } from "@prisma/client"

export const NotificationController = {
    getNotification: async (req, res) => {
    
        
        try {
            const prisma = new Prisma.PrismaClient()
            const id = req.params?.id || req.query?.id

            if (!id) return res.status(400).json({ error: "Missing id parameter" })

            // Cherche les notifications qui correspondent soit à l'id string,
            // soit à un user/author id numérique (flexible selon le schéma)
            const notifications = await prisma.notification.findMany({
                where: {
                    id_user: id 
                }
            })

            await prisma.$disconnect()
            return res.status(200).json({ notifications })
        } catch (err) {
            return res.status(500).json({ error: err?.message || "Internal server error" })
        }
        
    
    
    },

    createNotification: async(req, res) => {
        
        
        try {
            const prisma = new Prisma.PrismaClient()
            const { id_user, id_note } = req.body

            if (!id_user || !id_note) {
                return res.status(400).json({ error: "Missing required fields" })
            }
            const newNotification = await prisma.notification.create({
                data: {
                    id_user,
                    id_note,
                }})

            await prisma.$disconnect()
            return res.status(201).json({ notification: newNotification })
        } catch (err) {
            return res.status(500).json({ error: err?.message || "Internal server error" })
        }

    }

}

