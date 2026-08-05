import {useState} from 'react';
import Sidebar from './components/layout/sidebar';
import Header from './components/layout/header';
import PageSection from './components/layout/page-section';
import BrandSection from './components/design-preview/brand-section';
import ColourSection from './components/design-preview/colour-section';
import TypographySection from './components/design-preview/typography-section';
import SpacingSection from './components/design-preview/spacing-section';
import ComponentsSection from './components/design-preview/components-section';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return(
    <div
      data-theme={darkMode ? "dark" : "light"}
      style={{
        color: "var(--text-primary)",
        background: "var(--bg-page)",
        display: 'flex',
        width: "100%",
        height: "100vh",
        overflow: 'hidden',
      }}
    >
      <Sidebar collapsed={sidebarCollapsed}/>

      <div
        style={{
          flex:1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >

        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          onToggleSidebar={() => setSidebarCollapsed(value => !value)}
        />

        <main 
          style={{
            flex: 1,
            overflow: 'auto',
            padding: "24px 26px",
            background: "var(--bg-page)",
          }}
        >
        

          <div 
            style={{
              display: 'flex',
              flexDirection:'column',
              gap: 24,
              maxWidth: 1500,
              margin: "0 auto",
            }}
          >
            <PageSection id='brand' title='Brand Identity'>
              <BrandSection/>
            </PageSection>

            <PageSection id='colours' title='Colour System'>
              <ColourSection/>
            </PageSection>

            <PageSection id='typography' title='Typography'>
              <TypographySection/>
            </PageSection>

            <PageSection id='spacing' title='Spacing System'>
              <SpacingSection/>
            </PageSection>

            <PageSection id='components' title='UI Components'>
              <ComponentsSection/>
            </PageSection>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App;