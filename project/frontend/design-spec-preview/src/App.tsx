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

  const pageStyle = darkMode? 'bg-slate-950 text-slate-100' : 'bg-slate-200 text-slate-950';

  return(
    <div className={`min-h-screen ${pageStyle}`}>
      <Sidebar/>

      <main className='lg:ml-64'>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <div className='space-y-8 p-6 md:p-8'>
          <PageSection id='brand' title='Brand Identity' darkMode={darkMode}>
            <BrandSection darkMode={darkMode} />
          </PageSection>

          <PageSection id='colours' title='Colour System' darkMode={darkMode}>
            <ColourSection darkMode={darkMode} />
          </PageSection>

          <PageSection id='typography' title='Typography' darkMode={darkMode}>
            <TypographySection darkMode={darkMode} />
          </PageSection>

          <PageSection id='spacing' title='Spacing System' darkMode={darkMode}>
            <SpacingSection darkMode={darkMode} />
          </PageSection>

          <PageSection id='components' title='UI Components' darkMode={darkMode}>
            <ComponentsSection darkMode={darkMode} />
          </PageSection>

          <PageSection id='ratio' title='Ratio Example' darkMode={darkMode}>
            <p>Ratio Section</p>
          </PageSection>

          <PageSection id='dashboard' title='Dashboard Layout' darkMode={darkMode}>
            <p>Dashboard Section</p>
          </PageSection>
        </div>
        
      </main>
    </div>
  )
}

export default App;