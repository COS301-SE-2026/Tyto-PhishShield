import { OwlLogo, LogoLockup } from '../../../../website/src/components/ui/owl-logo';

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
    {label:'Brand', id: 'brand'}, 
    {label: 'Colours', id: 'colours'},
    {label: 'Typography', id: 'typography'},
    {label: 'Spacing', id: 'spacing'},
    {label: 'Components', id: 'components'},
];

function Sidebar({collapsed}: SidebarProps) {
    return (
        <aside 
            style={{
                background: 'var(--bg-sidebar)',
                width: collapsed ? 60 : 218,
                height: "100%",
                display: "flex",
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden',
                transition: "width 0.2s ease",
            }}
        >
            <a
                href="#brand"
                aria-label="Go to brand section"
                style={{
                    height: 60,
                    padding: 16,
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                {collapsed ? (<OwlLogo size={28}/>) : (<LogoLockup size={28}/>)}
            </a>
            
            {/* Sidebar Navigation */}
            <nav className='space-y-1' aria-label='Design spec preview'>
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className = 'block rounded-lg px-3 py-2 text-sm font-medium'
                        style={{
                            color: 'var(--sidebar-text)'
                        }}
                         onMouseEnter={(event) => {
                            event.currentTarget.style.background ="var(--sidebar-hover-bg)";
                            event.currentTarget.style.color ="var(--sidebar-text-active)";
                            }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = "transparent";
                            event.currentTarget.style.color = "var(--sidebar-text)";
                        }}
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;