import React from 'react';

type HeaderProps = {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function Header({ darkMode, setDarkMode }: HeaderProps) {
    return (
        <header className='border-b border-slate-800 bg-[#0F172A] px-8 py-8 text-white'>
            <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
                <div>
                    <p className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300'> 
                        Tyto-PhishShield Design System
                    </p>
                    <h1 className='text-3xl font-extrabold tracking-tight md:text-4xl'>
                        Design Specification Preview 
                    </h1>
                </div>

                {/* Dark Mode button */}
                <div>
                    <button
                        type='button'
                        onClick={() => setDarkMode(false)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!darkMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Light

                    </button>

                    <button
                        type='button'
                        onClick={() => setDarkMode(true)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${darkMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Dark

                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header;