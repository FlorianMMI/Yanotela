'use client';

import Image from "next/image";
import Icon from "../../ui/Icon";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const loginData = {
      identifiant: formData.get('identifiant') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        // Connexion réussie, rediriger vers la page d'accueil
        router.push('/');
      } else {
        const errorData = await response.text();
        setError('Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-screen p-2.5 flex flex-col justify-between items-center">
      <Link href="/" className="w-full items-start flex">
        <Icon name="arrow-ss-barre" className="text-black hover:scale-75 active:scale-75 transition-transform duration-200" size={40} />
      </Link>

      <div className="p-5 flex flex-col justify-center items-start gap-8">
        <p className="
          text-center text-primary text-3xl font-bold
          after:content-[''] after:block after:w-full after:h-1 after:bg-primary after:rounded after:mt-8
        ">
          Quel plaisir de vous revoir !
        </p>
    

        <form onSubmit={handleSubmit} id="login-form" className=" w-full flex flex-col justify-center items-start gap-2.5">
          {error && (
            <div className="w-full p-2.5 bg-100 border border-400 text-700 rounded-[10px] text-sm">
              {error}
            </div>
          )}
          
          <p className="justify-center text-black text-sm font-normal font-gant">
            Veuillez indiquer votre adresse e-mail et votre mot de passe.
          </p>
          
          <div data-property-1="Mail" className="w-full p-2.5 bg-white rounded-[10px] flex justify-start items-center gap-2.5">
            <Icon name="at" className="text-zinc-500" size={20} />
            <input 
              type="text" 
              name="identifiant"
              id="identifiant"
              placeholder="Votre mail ou pseudonyme"
              required
              className="flex-1 bg-transparent text-black text-sm font-normal font-gant outline-none"
            />
          </div>
          
          <div data-property-1="MDP" className="w-full p-2.5 bg-white rounded-[10px] flex justify-between items-center">
            <div className="flex justify-center items-center gap-2.5">
              <Icon name="keyhole" className="text-zinc-500" size={20} />
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Votre mot de passe"
                required
                className="flex-1 bg-transparent text-black text-sm font-normal font-gant outline-none"
              />
            </div>
            <button 
              type="button"
              onClick={togglePasswordVisibility}
              className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              <Icon 
                name={showPassword ? "eye-close" : "eye"} 
                className="text-zinc-500 hover:text-zinc-700" 
                size={16} 
              />
            </button>
          </div>
          
          <button type="button" className="w-full justify-start text-start flex text-red-default hover:text-red-hover active:text-red-hover text-sm font-normal font-['Gantari'] cursor-pointer">
            Mot de passe oublié ?
          </button>
        
          <button 
            type="submit" 
            disabled={isLoading}
            className="p-2.5 w-full bg-primary hover:bg-hover active:bg-active disabled:bg-gray-400 rounded-[10px] flex justify-between items-center shadow-md cursor-pointer transition-colors"
          >
            <p className="flex-1 text-center justify-center text-white text-xl font-bold font-gant pointer-events-none">
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </p>
            <Icon name="arrow-barre" className="text-white pointer-events-none" size={40} />
          </button>
        </form>

        {/* Séparateur et connexion Google */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center w-full gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="text-gray-500 text-sm font-normal font-gant">ou</p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          
          <button 
            type="button" 
            className="w-full p-2.5 bg-white border border-gray-300 rounded-[10px] flex justify-center items-center gap-3 hover:bg-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
          >
            <Icon name="google" className="text-primary" size={20} />
            <span className="text-gray-700  text-sm font-medium font-gant">
              Se connecter avec Google
            </span>
          </button>
        </div>
      </div>


{/* inscrivez vous ici */}
      <div className="p-2.5 flex flex-col justify-center items-center gap-2.5">
        <p className="text-center justify-center text-black text-l font-normal font-gant">
          Vous n'avez pas de Compte ?
        </p>
        <Link href="/register" className="text-center justify-center text-primary hover:text-hover active:text-hover text-xl font-normal font-gant cursor-pointer">
          Inscrivez-vous
        </Link>
      </div>
    </div>
  );
}
