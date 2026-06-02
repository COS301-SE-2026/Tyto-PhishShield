import {useState} from 'react';
import Sidebar from './components/layout/sidebar';
import Header from './components/layout/header';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const pageStyle = darkMode? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';

  return(
    <div className={`min-h-screen ${pageStyle}`}>
      <Sidebar/>

      <main className='lg:ml-64'>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <section className='p-6 md:p-8'>
          page stuff
        </section>
      </main>
    </div>
  )
}

export default App;