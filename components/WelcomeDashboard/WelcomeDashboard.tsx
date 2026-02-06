import React from 'react';
import VisionBoard from './VisionBoard';
import ConfianceMeter from './ConfianceMeter';
import BelgianToolkit from './BelgianToolkit';

const WelcomeDashboard = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <header className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-serif text-[#5A6B70] mb-4">
                    Bienvenue chez toi, en Belgique 🇧🇪
                </h1>
                <p className="text-xl text-[#5A6B70]/70 font-light max-w-2xl mx-auto">
                    Ton espace personnel pour transformer l'expatriation en une aventure confortable.
                    Prends tes marques, une frite à la fois.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Vision & Toolkit */}
                <div className="lg:col-span-8 space-y-8">
                    <VisionBoard />
                    <BelgianToolkit />
                </div>

                {/* Right Column: Confiance Meter & Daily Motivation */}
                <div className="lg:col-span-4 space-y-8">
                    <ConfianceMeter />

                    {/* Bonus: Daily Quote Card */}
                    <div className="bg-[#5A6B70] rounded-3xl p-8 text-[#F9F7F2] text-center shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffffff] opacity-10 rounded-bl-full" />
                        <h3 className="font-serif text-xl mb-4">Le mot du jour</h3>
                        <p className="italic text-lg mb-4">"L'art de la frite, c'est comme la vie : il faut savoir être croustillant à l'extérieur et tendre à l'intérieur."</p>
                        <span className="text-sm opacity-60 uppercase tracking-widest font-bold">― Sagesse Bruxelloise</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeDashboard;
