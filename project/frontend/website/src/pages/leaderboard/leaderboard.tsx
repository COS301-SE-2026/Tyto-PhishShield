import { useState } from "react";

type LeaderboardTab = 'users' | 'departments';

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('departments');

    return(
        <main>
            <section>
                <div>
                    <h1>
                        Leaderboard
                    </h1>
                    <p>
                        Track top-performing users and departments
                    </p>
                </div>

                <div>
                    <div>
                        <button 
                          type = 'button'
                          onClick={() => setActiveTab('users')}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            activeTab === "users"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                            Users
                        </button>

                        <button 
                          type = 'button'
                          onClick={() => setActiveTab('departments')}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            activeTab === "departments"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                            Departments
                        </button>
                    </div>
                </div>
                
            </section>
        </main>
    );
}