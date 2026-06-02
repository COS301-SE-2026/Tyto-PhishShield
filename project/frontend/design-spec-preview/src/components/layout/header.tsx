import React from 'react';

type HeaderProps = {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function Header({ darkMode, setDarkMode }: HeaderProps) {
    return (
        <header className='border-b border-slate-800 bg-[#0F172A] px-8 py-8 text-white'>
            <div>
                <div className=''>
                    <h1 className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300'> 
                        Tyto-PhishShield Design Specification Preview 
                    </h1>
                </div>

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
                        onClick={() => setDarkMode(false)}
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