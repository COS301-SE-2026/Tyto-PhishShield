import dashboardDark from '../../assets/dashboard-dark.png';
import dashboardLight from '../../assets/dashboard-light.png';

type DashboardSectionProps = {
    darkMode : boolean;
};

type DashboardImageFrameProps = {
    title: string;
    imageSrc: string;
    imageAlt: string;
    frameStyle: string;
}

function DashboardImageFrame({title, imageAlt, imageSrc, frameStyle}: DashboardImageFrameProps) {
    return (
        <article className={`overflow-hidden rounded-2xl border ${frameStyle}`}>
            <div className='flex items-center justify-between border-b border-slate-700/60 px-4 py-3'>
                <div>
                    <h3 className='text-sm font-semibold'>
                        {title}
                    </h3>
                    <p className='text-xs'>
                        Representative Dashboard Layout Preview.
                    </p>
                </div>

                <div className='flex gap-2' aria-hidden='true'>
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
            </div>

            <img className='w-full' src={imageSrc}alt={imageAlt}/>

        </article>
    )
}

function DashboardSection({darkMode}: DashboardSectionProps) {
    const cardStyle = darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100';

    return (
        <div>
            <div className='space-y-8'>
                <DashboardImageFrame
                    title='Dark theme dashboard'
                    imageSrc={dashboardDark}
                    imageAlt='Dark theme dashboard preview'
                    frameStyle={cardStyle}
                />

                <DashboardImageFrame
                    title='Light theme dashboard'
                    imageSrc={dashboardLight}
                    imageAlt='Light theme dashboard preview'
                    frameStyle={cardStyle}
                />
            </div>
        </div>
    )
}

export default DashboardSection;

