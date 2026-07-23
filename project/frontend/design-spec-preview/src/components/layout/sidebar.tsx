import { OwlLogo } from '../../../../website/src/components/ui/owl-logo';

const navItems = ['Brand', 'Colours', 'Typography', 'Spacing', 'Components', 'Dashboard'];

function Sidebar() {
    return (
        <aside className='fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-[#0F172A] p-6 text-white lg:block'>
            {/* Owl Logo */}
            <div className='mb-10 flex items-center gap-3'>
                <OwlLogo/>

                <div>
                    <div className='text-xl font-bold tracking-tight'>Tyto</div>
                    <div className='mt-1 text-xs font-medium uppercase tracking-[0.24em] text-blue-300'>PhishShield</div>
                </div>
            </div>
            
            {/* Sidebar Navigation */}
            <nav className='space-y-1' aria-label='Design spec preview'>
                {navItems.map((item) => (
                    <a
                        key = {item}
                        href={`#${item.toLowerCase()}`}
                        className = 'block rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-1'
                    >
                        {item}
                    </a>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;