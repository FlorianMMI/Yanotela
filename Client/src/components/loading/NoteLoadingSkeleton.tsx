import { motion } from "motion/react";

export default function NoteLoadingSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg h-full flex flex-col justify-center items-center gap-6 relative overflow-hidden">
      
      {/* Fond avec motif subtil */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "url('/fond.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        animate={{
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Logo ou icône principale animée */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          duration: 0.8, 
          ease: "backOut",
          delay: 0.2 
        }}
      >
        {/* Cercle principal avec couleur de votre DA */}
        <motion.div
          className="w-16 h-16 border-4 rounded-full relative"
          style={{ borderColor: '#882626' }}
          animate={{
            borderColor: ['#882626', '#ff0000', '#882626']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Icône de document animée */}
          <motion.div
            className="absolute inset-2 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg 
              className="w-6 h-6" 
              style={{ color: '#882626' }}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Texte de chargement avec votre typographie */}
      <motion.div
        className="text-center space-y-2 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <motion.h3
          className="font-geologica text-lg font-semibold"
          style={{ color: '#882626' }}
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          Chargement de votre note
        </motion.h3>
        
        <motion.p
          className="font-gantari text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Préparation de l'éditeur
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            ...
          </motion.span>
        </motion.p>
      </motion.div>

      {/* Barre de progression animée */}
      <motion.div 
        className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden relative z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#882626' }}
          initial={{ width: '0%', x: '-100%' }}
          animate={{ 
            width: '100%', 
            x: '0%'
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5
          }}
        />
      </motion.div>

      {/* Points d'ornementation flottants */}
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: '#882626',
            left: `${20 + (index * 10)}%`,
            top: `${30 + (index % 2) * 40}%`,
            opacity: 0.3
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}