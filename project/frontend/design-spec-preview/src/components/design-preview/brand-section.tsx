type BrandSectionProps = {
    darkMode : boolean;
}

function BrandSection({darkMode}: BrandSectionProps) {
    const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';

    return(
        <div className='max-w-3xl text-sm leading-6 md:text-base'>
            <p>
                Tyto-PhishShield helps organizations to build resiliance against phishing attacks by training employees with realistc phishing simulations.
            </p>
            
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                    <h3 className="text-sm font-semibold text-blue-500">
                        Mission
                    </h3>
                    <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                        Make employees part of the firewall by encouraging safer
                        behaviour and faster phishing reporting.
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-blue-500">
                        Tone
                    </h3>
                    <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                        Clear, Helpful, Encouraging, Security-focused and Professional
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BrandSection;